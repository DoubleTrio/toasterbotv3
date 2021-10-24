import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Collection,
  GuildMember,
  MessageActionRowOptions,
  MessageButtonOptions,
  EmbedFieldData,
  MessageEmbedOptions,
  InteractionCollectorOptions,
  ButtonInteraction,
  Message,
} from 'discord.js';
import i18n from 'i18next';
import { Game, ToasterBot, UserOption } from '../../structures';
import { AcceptEmbed } from '../../utils';
import RPSPlayer from './RPSPlayer';
import { RPS_MATCHUPS, RPSChoice } from './types';

class RPS extends Game {
  private challenger: UserOption;

  private isChallengeAccepted : boolean;

  private intermediateTime : number;

  private messageId : string;

  private requiredWins : number;

  private playerData = new Collection<string, RPSPlayer>();

  constructor(client: ToasterBot, interaction: CommandInteraction) {
    super(client, interaction, { timeLimit: 30 * 1000 });
  }

  protected async initialize() : Promise<void> {
    this.challenger = this.getUserValue('challenger');
    this.requiredWins = this.getOptionValue<number>('wins') || 1;
    this.timeLimit = this.getOptionValue<number>('time') || 20000;
    this.intermediateTime = this.getOptionValue<number>('intermediate') || 5000;
    this.setPlayers();
    const title = i18n.t('game.challengeMessage', {
      player: this.playerData.get(this.interaction.user.id),
      otherPlayer: this.playerData.get(this.challenger.user.id),
      gameName: i18n.t('rps.name'),
    });
    this.isChallengeAccepted = await new AcceptEmbed(
      this.interaction,
      {
        color: this.client.colors.primary,
        title,
      },
    ).awaitResponse(this.challenger.user.id);
    
    const message = await this.interaction.fetchReply() as Message;
    this.messageId = message.id;
  }

  protected async play() : Promise<void | APIMessage | Message> {
    await this.initialize();
    if (this.challenger.user.bot) {
      return this.interaction.followUp(i18n.t('game.cannotChallengeBot'));
    }

    if (this.challenger.user.id === this.interaction.user.id) {
      return this.interaction.followUp(i18n.t('game.cannotChallengeYourself'));
    }

    if (this.isChallengeAccepted) {
      while (!this.terminal()) {
        this.renderEmbed();
        await this.awaitChoices();
        if (this.hasEnded) {
          return;
        }
        await Game.sleep(this.intermediateTime);
      }
    } else {
      return this.interaction.followUp({
        content: i18n.t('game.declineMessage', {
          player: this.playerData.get(this.challenger.user.id),
        }),
      });
    }
  }

  private terminal() : boolean {
    return this.playerData.some((player) => player.wins === this.requiredWins);
  }

  private setPlayers() {
    this.playerData.set(
      this.interaction.user.id,
      new RPSPlayer(
        this.interaction.user,
        {
          nickname: (this.interaction.member as GuildMember).nickname,
        },
      ),
    );
    this.playerData.set(
      this.challenger.user.id,
      new RPSPlayer(
        this.challenger.user,
        {
          nickname: this.challenger.member.nickname,
        },
      ),
    );
  }

  private getRPSButton(rpsChoice: RPSChoice) : MessageButtonOptions {
    const choice = RPS_MATCHUPS[rpsChoice];
    return {
      style: 'SECONDARY',
      label: `${choice.emoji} ${choice.label}`,
      customId: rpsChoice,
      type: 'BUTTON',
    };
  }

  private actionComponent() : MessageActionRowOptions {
    const buttons: MessageButtonOptions[] = Object.keys(RPS_MATCHUPS).map((choice: RPSChoice) => this.getRPSButton(choice));

    return {
      type: 'ACTION_ROW',
      components: buttons,
    };
  }

  private renderEmbed(message?: string) {
    let fields : EmbedFieldData[] = [
      ...this.playerData.map((player) : EmbedFieldData => {
        let choiceString = '';
        if (player.choice) {
          choiceString = RPS_MATCHUPS[player.choice].emoji;
        }
        return {
          name: `${player.nickname} ${choiceString}`,
          value: player.wins.toString(),
          inline: true,
        };
      }),
    ];

    if (message) {
      fields = [
        ...fields,
        {
          name: '** **',
          value: message,
        },
      ];
    }

    const timeLimitText = i18n.t('timeLimitText', {
      timeLimit: this.timeLimit / 1000,
    });

    const requiredWinsText = i18n.t('game.firstToWins', {
      wins: this.requiredWins,
    });

    const embed : MessageEmbedOptions = {
      color: this.client.colors.primary,
      title: i18n.t('game.scores'),
      fields,
      footer: {
        text: `${requiredWinsText} | ${timeLimitText}`,
      },
    };

    const components = this.terminal() ? [] : [this.actionComponent()];
    this.interaction.editReply({ embeds: [embed], components });
  }

  private onWin(player: RPSPlayer, other: RPSPlayer) {
    player.win();
    if (player.hasWon(this.requiredWins)) {
      const playerWinGameMessage = player.winGameMessage(other);
      this.renderEmbed(playerWinGameMessage);
    } else {
      const playerWinRoundMessage = player.winRoundMessage(player);
      this.renderEmbed(playerWinRoundMessage);
    }
  }

  private allPlayersHasSelected() {
    return this.playerData.every((player) => player.choice !== null);
  }

  private async awaitChoices() {
    const options : InteractionCollectorOptions<ButtonInteraction> = {
      time: this.timeLimit,
      filter: (btnInteraction: ButtonInteraction) => this.playerData.has(btnInteraction.user.id) && btnInteraction.message.id === this.messageId,
      componentType: 'BUTTON',
    };

    const collector = this.interaction.channel.createMessageComponentCollector(
      options,
    );

    return new Promise((resolve) => {
      collector.on('collect', (btnInteraction: ButtonInteraction) => {
        btnInteraction.deferUpdate();
        const player = this.playerData.get(btnInteraction.user.id);
        player.select(btnInteraction.customId as RPSChoice);
        if (this.allPlayersHasSelected()) {
          collector.stop();
        }
      });

      collector.on('end', async () => {
        const host = this.playerData.get(this.interaction.user.id);
        const challenger = this.playerData.get(this.challenger.user.id);
        if (!this.allPlayersHasSelected()) {
          this.hasEnded = true;
          this.renderEmbed(i18n.t('game.playerInactivityMessage', {
            gameName: i18n.t('rps.name'),
          }));
          return resolve(null);
        }
        const hostWins = RPS_MATCHUPS[host.choice].wins.get(challenger.choice);
        if (host.choice === challenger.choice) {
          this.renderEmbed(i18n.t('rps.drawMessage'));
        } else if (hostWins) {
          this.onWin(host, challenger);
        } else {
          this.onWin(challenger, host);
        }

        host.deselect();
        challenger.deselect();
        resolve(null);
      });
    });
  }
}

export default RPS;
