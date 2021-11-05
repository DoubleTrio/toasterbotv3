import {
  CommandInteraction,
  Collection,
  ApplicationCommandOption,
  ApplicationCommandChoicesData,
  ApplicationCommandNonOptionsData,
} from 'discord.js';
import { Command } from '..';

class GroupCommand extends Command {
  public commands : Collection<string, Command> = new Collection();

  public options : ApplicationCommandOption[];

  runInteraction(interaction: CommandInteraction) : Promise<unknown> | unknown {
    const subcommand = interaction.options.getSubcommand();
    return this.commands.get(subcommand).runInteraction(interaction);
  }

  public setCommand(command : Command) : void {
    this.commands.set(command.name, command);
    this.options.push({
      type: 'SUB_COMMAND',
      name: command.name,
      description: command.description,
      options: [
        ...command.options as (ApplicationCommandNonOptionsData | ApplicationCommandChoicesData)[] & ApplicationCommandOption[],
      ],
    });
  }
}

export default GroupCommand;
