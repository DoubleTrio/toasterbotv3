import { APIMessage } from 'discord-api-types';
import {
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
  readonly interaction: CommandInteraction;

  readonly client: ToasterBot;

  protected embedColor: EmbedColor;

  protected hasEnded = false;

  protected timeLimit : number;

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

  public start() : Promise<Message | APIMessage | void> {

    return this.play();
  }

  protected setEmbedColor(color: EmbedColor) : void {
    this.embedColor = color;
  }

  private findOption(name: string) : CommandInteractionOption {
    return this.interaction.options.data.find((option) => option.name === name);
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
