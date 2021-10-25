import {
  Client,
  ClientOptions,
  ApplicationCommandData,
  TextChannel,
  Message,
} from 'discord.js';
import { EmbedColor } from '../types';
import {
  CommandHandler,
  EventHandler,
  InternalizationHandler,
  Command,
} from '.';

interface ToasterBotColors {
  primary: EmbedColor,
  secondary: EmbedColor,
  error: EmbedColor,
  success: EmbedColor,
  warning: EmbedColor,
}

interface ToasterBotConfiguration {
  commandHandler: CommandHandler;
  eventHandler: EventHandler;
  internalizationHandler: InternalizationHandler;
  colors?: ToasterBotColors;
  prefix?: string;
  debug?: boolean;
}

class ToasterBot extends Client {
  readonly commandHandler: CommandHandler;

  readonly eventHandler: EventHandler;

  readonly internalizationHandler: InternalizationHandler;

  readonly ownerId = '467050112787677184';

  readonly colors: ToasterBotColors;

  readonly prefix: string;

  readonly debug: boolean;

  constructor(options: ClientOptions, config: ToasterBotConfiguration) {
    super(options);
    this.commandHandler = config.commandHandler;
    this.eventHandler = config.eventHandler;
    this.internalizationHandler = config.internalizationHandler;
    this.colors = config.colors || {
      primary: 0xF9FF87,
      secondary: 0x7EE8FA,
      success: 0xAEF78E,
      error: 0xED4337,
      warning: 0xF4845F,
    };
    this.prefix = config.prefix || 'tb.';
    this.debug = config.debug || false;
  }

  get loggingChannel() : TextChannel {
    return this.channels.cache.get(process.env.LOGGING_CHANNEL) as TextChannel;
  }

  public isOwner(userId: string) : boolean {
    return this.ownerId === userId;
  }

  public async initialize() : Promise<string> {
    await this.internalizationHandler.init(this);
    await this.commandHandler.loadCommands(this);
    this.eventHandler.loadEvents(this);
    return this.login(process.env.TOKEN);
  }

  public async deleteCommand(cmd: string) : Promise<void> {
    return this.application.commands.fetch().then((res) => {
      const commandName = res.find(
        (command) => command.id === cmd || command.name === cmd,
      );
      if (commandName) {
        this.application.commands.delete(commandName);
      } else {
        throw new Error('Command not found');
      }
    });
  }

  public async createGuildCommand(
    command: Command, guildId: string = process.env.CLASH_UNITERS_ID,
  ) : Promise<ApplicationCommandData> {
    const applicationCommandData: ApplicationCommandData = {
      name: command.name,
      description: command.description,
      options: command.options,
    };
    const targetGuild = this.guilds.cache.get(guildId);
    const res = await targetGuild.commands.create(applicationCommandData);
    return res;
  }

  public capitalize = (s: string) : string => s && s[0].toUpperCase() + s.slice(1);

  public logError(command: Command, error: Error) : Promise<Message> {
    const { name } = command;
    const embed = {
      color: this.colors.error,
      fields: [
        {
          name: '**In Command**',
          value: `\`${name}\``,
        },
        {
          name: '**Error Type**',
          value: `\`${error.name}\``,
        },
        {
          name: '**Error Message**',
          value: `\`${error.message}\``,
        },
        {
          name: '**Stack**',
          value: `\`${error.stack || '** **'}\``,
        },
      ],
    };

    return this.loggingChannel.send({ embeds: [embed] });
  }
}

export default ToasterBot;
