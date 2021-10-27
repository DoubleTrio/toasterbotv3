import { stripIndents } from 'common-tags';
import { APIMessage } from 'discord-api-types';
import {
  ButtonInteraction,
  Collection,
  CommandInteraction,
  EmbedFieldData,
  InteractionCollectorOptions,
  Message,
  MessageActionRowOptions,
  MessageButtonOptions,
  MessageEmbedOptions,
} from 'discord.js';
import i18n from 'i18next';
import { Game, ToasterBot, ExtendedUser } from '../../structures';
import DuelPlayer from './DuelPlayer';
import { DuelChoice, Item } from './types';

class Duel extends Game {
  private startingSwords : number;

  private startingSpells : number;

  private isGameOver = false;

  private requiredWins : number;

  private challenger: ExtendedUser;

  private playerData = new Collection<string, DuelPlayer>();

  private intermediateTime : number;

  private turn = 0;

  private gameRound = 1;

  constructor(client: ToasterBot, interaction: CommandInteraction) {
    super(client, interaction);
  }

  protected async play() : Promise<void | Message | APIMessage> {
    await this.initialize();
    while (!this.terminal()) {
      this.turn += 1;
      this.renderEmbed();
      await this.awaitChoices();
      if (this.isGameOver) {
        return;
      }
      await Game.sleep(this.intermediateTime);
    }
  }

  private terminal() : boolean {
    return this.playerData.some((player) => player.wins === this.requiredWins);
  }

  protected async initialize() : Promise<void> {
    this.challenger = this.getUserValue('challenger');
    this.requiredWins = this.getOptionValue<number>('wins') ?? 1;
    this.timeLimit = this.getOptionValue<number>('time') ?? 20000;
    this.startingSwords = this.getOptionValue<number>('swords') ?? 1;
    this.startingSpells = this.getOptionValue<number>('') ?? 1;
    this.intermediateTime = this.getOptionValue<number>('intermediate') ?? 5000;
    this.setPlayers();
  }

  private setPlayers() {
    this.players.forEach((player) => {
      this.playerData.set(
        player.user.id,
        new DuelPlayer(
          player,
          {
            nickname: player.nickname,
          },
          {
            swords: this.startingSwords,
            spells: this.startingSpells,
          },
        ),
      );
    });
  }

  private createActionButtonRow() : MessageActionRowOptions {
    const buttons : MessageButtonOptions[] = [
      {
        style: 'SECONDARY',
        label: '🔫 Reload/Shoot',
        customId: Item.getId('GUN'),
        type: 'BUTTON',
      },
      {
        style: 'SECONDARY',
        label: '⚔️ Sword',
        customId: Item.getId('SWORD'),
        type: 'BUTTON',
      },
      {
        style: 'SECONDARY',
        label: '✨ Spell',
        customId: Item.getId('SPELL'),
        type: 'BUTTON',
      },
      {
        style: 'SECONDARY',
        label: '🛡️ Shield',
        customId: Item.getId('SHIELD'),
        type: 'BUTTON',
      },
      {
        style: 'SECONDARY',
        label: '🪞 Mirror',
        customId: Item.getId('MIRROR'),
        type: 'BUTTON',
      },
    ];
    return {
      type: 'ACTION_ROW',
      components: buttons,
    };
  }

  private allPlayersHasSelected() {
    return this.playerData.every((player) => player.choice !== null);
  }

  private renderEmbed(message = '** **') {
    const fields : EmbedFieldData[] = [
      ...this.playerData.map((player) : EmbedFieldData => {
        let choiceString = '';
        if (player.choice) {
          choiceString = Item.getEmoji(player.choice);
        }
        const winsString = `Wins: ${player.wins}`;
        const hasReloadedString = `Can shoot: ${player.reloaded ? '✅' : '❌'}`;
        const swordsLeftString = `Swords Left: **${player.swords}**`;
        const spellsLeftString = `Spells Left: **${player.spells}**`;
        const shieldsLeftString = `Shields Left: **${player.shields}**`;
        const mirrorsLeftString = `Mirrors Left: **${player.mirrors}**`;
        return {
          name: `${player.nickname} ${choiceString}`,
          value: stripIndents`
            ${winsString}
            ${hasReloadedString}
            ${swordsLeftString}
            ${spellsLeftString}
            ${shieldsLeftString}
            ${mirrorsLeftString}
          `,
          inline: true,
        };
      }),
      {
        name: `**${i18n.t('game.logs')}**`,
        value: message,
      },
    ];

    const scoreText = i18n.t('game.scores');

    const turnText = i18n.t('game.turn', {
      turn: this.turn,
    });

    const title = `${scoreText} | ${turnText}`;

    const timeLimitText = i18n.t('timeLimitText', {
      timeLimit: this.timeLimit / 1000,
    });

    const firstToWinsText = i18n.t('game.firstToWins', {
      requiredWins: this.requiredWins,
    });

    const embed : MessageEmbedOptions = {
      color: this.client.colors.primary,
      title,
      fields,
      footer: {
        text: `${firstToWinsText} | ${timeLimitText}`,
      },
      timestamp: Date.now(),
    };

    this.interaction.editReply({ embeds: [embed], components: this.terminal() ? [] : [this.createActionButtonRow()] });
  }

  private evaluateWeapon(p1 : DuelPlayer, p2 : DuelPlayer) {
    // if (p1.hasWeapon && p2.hasWeapon) {
    //   if (p1.reloaded && p2.reloaded) return this.renderEmbed('Both player reloaded!')
    //   if (p1.reloaded && !p2.reloaded) return this.renderEmbed('Player 1 is dead');
    //   if (!p1.reloaded && p2.reloaded) return this.renderEmbed('Player 2 is dead');
    //   if (p1.weapon.id === 'GUN') {
    //     if (p1.hasAmmo) {
    //       if (p2.weapon.id && p2.hasAmmo) {
    //         return this.renderEmbed('Both players have killed each other with the same weapons!');
    //       }
    //     } else {
    //       return
    //     }
    //   }

    //   if (p1.weapon.speed === p2.weapon.speed) {
    //     if (p1.weapon.id === 'GUN') {
    //       if (p1.hasAmmo) {

    //       }
    //     }
    //     return this.renderEmbed('Both players have killed each other with the same weapons!');
    //   }

    //   if (p1.weapon.speed > p2.weapon.speed) {
    //     return this.renderEmbed('P1 ')
    //   }
    // }
  }

  private evaluateRound(p1 : DuelPlayer, p2 : DuelPlayer) {
    this.evaluateWeapon(p1, p2);
  }

  private restart() {
    this.gameRound += 1;
    this.turn = 1;
    this.playerData.forEach((player: DuelPlayer) => {
      player.restart();
    });
  }

  private async awaitChoices() {
    const options : InteractionCollectorOptions<ButtonInteraction> = {
      time: this.timeLimit,
      filter: (btnInteraction: ButtonInteraction) => this.playerData.has(btnInteraction.user.id),
      componentType: 'BUTTON',
    };

    const collector = this.interaction.channel.createMessageComponentCollector(
      options,
    );

    return new Promise((resolve) => {
      collector.on('collect', (btnInteraction: ButtonInteraction) => {
        btnInteraction.deferUpdate();
        const player = this.playerData.get(btnInteraction.user.id);
        player.select(btnInteraction.customId as DuelChoice);
        if (this.allPlayersHasSelected()) {
          collector.stop();
        }
      });

      collector.on('end', async () => {
        if (!this.allPlayersHasSelected()) {
          this.isGameOver = true;
          return resolve(this.renderEmbed(i18n.t('playerInactivityMessage', {
            gameName: i18n.t('duel.name'),
          })));
        }

        const host = this.playerData.get(this.interaction.user.id);
        const challenger = this.playerData.get(this.challenger.user.id);
        host.confirmChoice();
        challenger.confirmChoice();
        this.evaluateRound(host, challenger);
        host.deselect();
        challenger.deselect();
        resolve(null);
      });
    });
  }
}

export default Duel;
