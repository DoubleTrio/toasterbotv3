import { APIMessage } from 'discord-api-types';
import {
  Collection,
  CommandInteraction, CommandInteractionOption, GuildMember, Message,
} from 'discord.js';
import i18n from 'i18next';
import { ExtendedUser, ToasterBot } from '..';
import { EmbedColor } from '../../types';
import { AcceptEmbed, MultiplayerEmbed } from '../../utils';

interface GameConfig {
  timeLimit: number;
}

interface BoardConfig<T> {
  width: number,
  height: number,
  map: (value : unknown, index : number) => T,
}

type OptionValue = string | boolean | number;

abstract class Game {
  static players = new Collection<string, Set<string>>();

  readonly interaction: CommandInteraction;

  readonly client: ToasterBot;

  protected embedColor: EmbedColor;

  protected hasEnded = false;

  protected timeLimit : number;

  protected players = new Collection<number, ExtendedUser>();

  private playerCounter = 0;

  constructor(client: ToasterBot, interaction: CommandInteraction, config? : GameConfig) {
    this.client = client;
    this.interaction = interaction;
    this.embedColor = client.colors.primary;
    this.timeLimit = config.timeLimit || 30000;
  }

  static sleep(ms: number) : Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static generateBoard<T>(config: BoardConfig<T>) : Array<Array<T>> {
    return Array.from(new Array(config.height)).map(
      () => Array.from(new Array(config.width)).map(
        config.map,
      ),
    );
  }

  protected abstract play() : Promise<Message | APIMessage | void>;

  protected abstract initialize(interaction: CommandInteraction) : void;

  public async start() : Promise<Message | APIMessage | void> {
    this.addHost();

    const challenger = this.getUserValue('challenger');
    if (challenger) {
      const hasChallenger = await this.checkChallenger(challenger);
      if (!hasChallenger) {
        return;
      }
    }

    const pmin = this.getOptionValue<number>('pmin');
    const pmax = this.getOptionValue<number>('pmax');
    if (pmin || pmax) {
      const minPlayers = pmin ?? 2;
      const maxPlayers = pmax ?? 4;
      const hasPlayers = await this.checkMultiplayer(minPlayers, maxPlayers);
      if (!hasPlayers) {
        return;
      }
    }

    if (!this.hasEnded) {
      await this.play();
    }
    this.removeAllPlayers();
  }

  protected setEmbedColor(color: EmbedColor) : void {
    this.embedColor = color;
  }

  private addHost() : void {
    const { user } = this.interaction;
    const member = this.interaction.member as GuildMember;
    const host = ExtendedUser.fromMember(user, member);
    this.addPlayer(host);
  }

  private addPlayer(extendUser : ExtendedUser) : void {
    this.playerCounter += 1;
    const channelId = this.interaction.channel.id;
    const userId = extendUser.user.id;
    if (!Game.players.has(channelId)) {
      const set = new Set<string>();
      set.add(userId);
      Game.players.set(channelId, set);
    } else {
      Game.players.get(channelId).add(userId);
    }
    this.players.set(this.playerCounter, extendUser);
  }

  private removePlayer(extendedUser : ExtendedUser) : void {
    const channelId = this.interaction.channel.id;
    Game.players.get(channelId).delete(extendedUser.user.id);
    const key = this.players.findKey((player : ExtendedUser) => player.user.id === extendedUser.user.id);
    this.players.delete(key);
  }

  private removeAllPlayers() : void {
    const channelId = this.interaction.channel.id;
    for (const player of this.players.values()) {
      Game.players.get(channelId).delete(player.user.id);
    }
  }

  private findOption(name: string) : CommandInteractionOption {
    return this.interaction.options.data.find((option) => option.name === name);
  }

  private hasOption(name : string) : boolean {
    return this.findOption(name) !== undefined;
  }

  private async checkChallenger(challenger : ExtendedUser) : Promise<boolean> {
    if (challenger.user.bot) {
      this.interaction.followUp(i18n.t('game.cannotChallengeBot'));
      return false;
    }

    if (challenger.user.id === this.interaction.user.id) {
      this.interaction.followUp(i18n.t('game.cannotChallengeYourself'));
      return false;
    }

    const title = i18n.t('game.challengeMessage', {
      playerNickname: this.players.get(1).nickname,
      otherPlayerNickname: this.players.get(2).nickname,
      gameName: i18n.t(`${this.interaction.commandName}.name`),
    });

    const isChallengeAccepted = await new AcceptEmbed(
      this.interaction,
      {
        color: this.client.colors.primary,
        title,
      },
    ).awaitResponse(challenger.user.id);

    if (!isChallengeAccepted) {
      this.interaction.followUp({
        content: i18n.t('game.declineMessage', {
          nickname: this.players.get(2).nickname,
        }),
      });
      return false;
    }

    this.addPlayer(new ExtendedUser(challenger.user, challenger.nickname ?? challenger.user.username));
    return true;
  }

  private async checkMultiplayer(min : number, max : number) : Promise<boolean> {
    const gameName = i18n.t(`${this.interaction.commandName}.name`);

    const multiplayerEmbed = new MultiplayerEmbed(
      this.client,
      this.interaction,
      {
        color: this.client.colors.primary,
        title: `${this.players.get(1).nickname} has started ${gameName}! Click join to play!`,
      },
      {
        min,
        max,
      },
    );

    const canPlay = await multiplayerEmbed.awaitResponse();
    if (canPlay) {
      let index = 1;
      multiplayerEmbed.players.forEach((player) => {
        this.players.set(index, player);
        index += 1;
      });
      console.log(multiplayerEmbed.players);
    }
    return canPlay;
  }

  protected getOptionValue<T extends OptionValue>(name: string) : T {
    const option = this.findOption(name);
    return option?.value as T;
  }

  protected getUserValue(name: string) : ExtendedUser {
    const option = this.findOption(name);
    if (!option) {
      return null;
    }

    if (option.type !== 'USER') throw new Error(`${option.name} is not type "USER"`);
    return ExtendedUser.fromMember(option.user, option.member as GuildMember);
  }
}

export { Game, ExtendedUser };
