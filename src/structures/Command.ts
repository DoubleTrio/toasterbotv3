import {
  CommandInteraction, PermissionString, ApplicationCommandOption,
} from 'discord.js';
import ToasterBot from './ToasterBot';

interface CommandOptions {
  name: string,
  options?: ApplicationCommandOption[],
  defaultPermission?: boolean;
  enabled?: boolean,
  guildOnly?: boolean,
  ownerOnly?: boolean,
  nsfw?: boolean,
  cooldown?: number,
  aliases?: Array<string>,
  botPermissions?: Array<PermissionString>,
  memberPermissions?: Array<PermissionString>,
}

interface CommandInfo {
  group: string,
  description?: string,
  extendedDescription?: string,
}

abstract class Command {
  readonly client: ToasterBot;

  public enabled: boolean;

  readonly group: string;

  readonly name: string;

  readonly description: string;

  readonly extendedDescription: string;

  readonly options: ApplicationCommandOption[];

  readonly defaultPermission: boolean;

  readonly guildOnly: boolean;

  readonly ownerOnly: boolean;

  readonly nsfw: boolean;

  readonly cooldown: number;

  readonly aliases: Array<string>;

  readonly botPermissions: Array<PermissionString>;

  readonly memberPermissions: Array<PermissionString>;

  constructor(client: ToasterBot, info: CommandInfo, options: CommandOptions) {
    this.client = client;
    this.group = info.group || 'Unknown';
    this.description = info.description || 'No description available';
    this.extendedDescription = info.extendedDescription || 'No extended description available';
    this.enabled = options.enabled || true;
    this.name = options.name;
    this.options = options.options || [];
    this.defaultPermission = options.defaultPermission || false;
    this.guildOnly = options.guildOnly || false;
    this.ownerOnly = options.ownerOnly || false;
    this.nsfw = options.nsfw || false;
    this.cooldown = options.cooldown || 3000;
    this.aliases = options.aliases || [];
    this.botPermissions = options.botPermissions || ['VIEW_CHANNEL', 'SEND_MESSAGES'];
    this.memberPermissions = options.memberPermissions || ['VIEW_CHANNEL', 'SEND_MESSAGES'];
  }

  abstract runInteraction(interaction: CommandInteraction) : Promise<unknown> | unknown;
}

export { Command, CommandOptions, CommandInfo };
