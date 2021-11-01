import * as fs from 'fs';
import { Collection } from 'discord.js';
import i18n from 'i18next';
import { Command, CommandInfo, ToasterBot } from '..';
import { CooldownHandler } from '.';

class CommandHandler {
  public commands : Collection<string, Command> = new Collection();

  public cooldownHandler = new CooldownHandler();

  public aliases : Set<string> = new Set();

  public commandGroupNames = {
    games: 'Games',
    api: 'API',
    utils: 'Utils',
  };

  public async loadCommands(client: ToasterBot) : Promise<void> {
    const files = fs.readdirSync('./dist/commands');
    const commandFolders = files.filter((file: string) => !file.endsWith('.js'));
    for (const folder of commandFolders) {
      const commandFolderFiles = fs.readdirSync(`./dist/commands/${folder}`).filter((file) => file.endsWith('.js'));
      for (const file of commandFolderFiles) {
        const filePath = `../../commands/${folder}/${file}`;
        delete require.cache[require.resolve(filePath)];
        const commandFile = await import(filePath);
        const formattedFile = file.replace(/^.js+|.js+$/g, '');
        const description = i18n.t(`${formattedFile}.description`);
        const extendedDescription = i18n.t(`${formattedFile}.extendedDescription`);
        const commandInfo : CommandInfo = {
          description,
          extendedDescription,
          group: folder,
        };
        const command: Command = new commandFile.default(client, commandInfo);
        this.addExistingAliases(command);
        if (command.enabled) {
          this.commands.set(command.name, command);
        } else {
          console.log(command.name);
        }
      }
    }
    console.log(this.commands);
  }

  public getCommmand(commandName: string) : Command | undefined {
    return this.commands.get(commandName) || this.commands.find((cmd) => cmd.aliases.includes(commandName));
  }

  private addExistingAliases(command: Command) : void {
    for (const alias of command.aliases) {
      if (this.aliases.has(alias)) throw new Error(`A naming confict in the command ${command.name}`);
      this.aliases.add(alias);
    }
  }
}

export default CommandHandler;
