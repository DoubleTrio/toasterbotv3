import * as fs from 'fs';
import { User, Collection } from 'discord.js';
import i18n from 'i18next';
import { Command, CommandInfo, ToasterBot } from '..';

interface CooldownData {
  command: Command;
  timeLeft: number;
}

class CommandHandler {
  public commands : Collection<string, Command> = new Collection();

  public cooldowns = new Collection<string, Collection<string, number>>();

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

  public isOnCooldown(command: Command, user: User) : CooldownData | null {
    if (!this.cooldowns.has(command.name)) {
      this.cooldowns.set(command.name, new Collection());
    }
    const now = Date.now();
    const timestamps = this.cooldowns.get(command.name);
    const cooldownAmount = command.cooldown;
    if (timestamps?.has(user.id)) {
      const cooldown = timestamps.get(user.id);
      if (cooldown) {
        const expirationTime = cooldown + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return {
            command,
            timeLeft,
          };
        }
      }
    }
    timestamps?.set(user.id, now);
    setTimeout(() => timestamps?.delete(user.id), cooldownAmount);
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
