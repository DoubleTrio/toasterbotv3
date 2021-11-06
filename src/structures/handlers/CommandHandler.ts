import * as fs from 'fs';
import { Collection } from 'discord.js';
import i18n from 'i18next';
import * as _ from 'lodash';
import { Command, CommandInfo, GroupCommand, ToasterBot } from '..';
import { CooldownHandler } from '.';

class CommandHandler {
  public commands : Collection<string, Command | GroupCommand> = new Collection();

  public cooldownHandler = new CooldownHandler();

  public aliases : Set<string> = new Set();

  public async loadCommands(client: ToasterBot) : Promise<void> {
    const files = fs.readdirSync('./dist/commands').filter((file) => !file.endsWith('.map'));

    const partition = _.partition(files, (file) => !file.endsWith('js'));

    const commandFolders = partition[0].filter((folder) => !folder.includes('.'));

    const otherCommands = partition[1];

    const addCommand = async (path : string, file: string, group : string, groupCommand : GroupCommand = null) => {
      delete require.cache[require.resolve(path)];
      const commandFile = await import(path);
      const formattedFile = file.replace(/^.js+|.js+$/g, '');
      const description = i18n.t(`${formattedFile}.description`);
      const extendedDescription = i18n.t(`${formattedFile}.extendedDescription`);
      const commandInfo : CommandInfo = {
        description,
        extendedDescription,
        group,
      };
      const command: Command = new commandFile.default(client, commandInfo);
      this.addExistingAliases(command);
      if (groupCommand) {
        if (command.enabled) {
          groupCommand.setCommand(command);
        }
      } else if (command.enabled) {
        this.commands.set(command.name, command);
      }
    };

    for (const folder of commandFolders) {
      const commandFolderFiles = fs.readdirSync(`./dist/commands/${folder}`).filter((file) => file.endsWith('.js'));
      const commandGroup = new GroupCommand(client, {
        extendedDescription: '',
        description: i18n.t(`group.${folder}`),
        group: folder,
      }, {
        name: folder,
      });

      for (const file of commandFolderFiles) {
        addCommand(`../../commands/${folder}/${file}`, file, folder, commandGroup);
      }
      this.commands.set(commandGroup.name, commandGroup);
    }

    for (const file of otherCommands) {
      addCommand(`../../commands/${file}`, file, 'misc');
    }

    console.log(this.commands);
  }

  private addExistingAliases(command: Command) : void {
    for (const alias of command.aliases) {
      if (this.aliases.has(alias)) throw new Error(`A naming confict in the command ${command.name}`);
      this.aliases.add(alias);
    }
  }

  public getCommmand(commandName: string) : Command | undefined {
    return this.commands.get(commandName) || this.commands.find((cmd) => cmd.aliases.includes(commandName));
  }
}

export default CommandHandler;
