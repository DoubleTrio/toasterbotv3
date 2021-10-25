import { APIMessage } from 'discord-api-types';
import {
  Collection,
  CommandInteraction, CommandInteractionOption, GuildMember, Message, User,
} from 'discord.js';
import { ToasterBot } from '..';
import { EmbedColor } from '../../types';

interface UserOption {
  user: User;
  member: GuildMember;
}

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

  private players = new Set<string>();

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
    this.addPlayer(this.interaction.user);
    if (this.isTwoPlayerGame()) {
      console.log('here');
    }

    if (this.isMultiplayerGame()) {
      console.log('here');
    }

    if (this.hasEnded) {
      return;
    }

    await this.play();
    this.removeAllPlayers();
  }

  protected setEmbedColor(color: EmbedColor) : void {
    this.embedColor = color;
  }

  private addPlayer(user : User) : void {
    const channelId = this.interaction.channel.id;
    const userId = user.id;
    if (!Game.players.has(channelId)) {
      const set = new Set<string>();
      set.add(userId);
      Game.players.set(channelId, set);
    } else {
      Game.players.get(channelId).add(userId);
    }

    this.players.add(userId);
  }

  private removePlayer(user : User) : void {
    const channelId = this.interaction.channel.id;
    Game.players.get(channelId).delete(user.id);
  }

  private removeAllPlayers() : void {
    const channelId = this.interaction.channel.id;
    this.players.forEach((playerId) => {
      Game.players.get(channelId).delete(playerId);
    });
  }

  private findOption(name: string) : CommandInteractionOption {
    return this.interaction.options.data.find((option) => option.name === name);
  }

  private hasOption(name : string) : boolean {
    return this.findOption(name) !== undefined;
  }

  private isMultiplayerGame() : boolean {
    return this.hasOption('pmin') || this.hasOption('pmax');
  }

  private isTwoPlayerGame() : boolean {
    return this.hasOption('challenger');
  }

  protected getOptionValue<T extends OptionValue>(name: string) : T {
    const option = this.findOption(name);
    return option?.value as T;
  }

  protected getUserValue(name: string) : UserOption {
    const option = this.findOption(name);
    if (option.type !== 'USER') throw new Error(`${option.name} is not type "USER"`);
    return {
      user: option.user,
      member: option.member as GuildMember,
    };
  }
}

export { Game, UserOption };
