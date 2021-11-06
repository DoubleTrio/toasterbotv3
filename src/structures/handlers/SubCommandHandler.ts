import { Collection, CollectorFilter, CommandInteraction, Message, MessageCollector } from "discord.js";
import { CooldownHandler } from ".";

interface SubCommand {
  cooldown : number;
  name : string;
  aliases?: string[];
  execute : (message : Message, arg: unknown[]) => void;
  description: string;
  args: string
}

interface SubCommandHandlerConfig {
	commands: SubCommand[];
	onCooldown: VoidFunction;
	filter: CollectorFilter<[Message]>
	prefix: string;
	timeLimit?: number;
}

class SubCommandHandler {
	public commands = new Collection<string, SubCommand>();
	
	private collector : MessageCollector;

  private cooldownHandler : CooldownHandler = new CooldownHandler();

	private filter : CollectorFilter<[Message]>;

	private onCooldown : VoidFunction;

	private prefix : string;

	private timeLimit : number;

	constructor(config : SubCommandHandlerConfig) {
		for (const command of config.commands) {
			this.commands.set(command.name, command)
		}
		this.filter = config.filter;
		this.onCooldown = config.onCooldown;
		this.prefix = config.prefix;
		this.timeLimit = config.timeLimit || 600 * 1000;
	}

	public stopCollector() : void {
		this.collector.stop();
	}

	public async init(interaction : CommandInteraction) : Promise<void> {

		this.collector = interaction.channel.createMessageCollector(
			{
				filter: this.filter,
				time: this.timeLimit,
			},
		);

		return new Promise((resolve) => {
			this.collector.on('collect', (message) => {
				this.onMessage(message);
			})

			this.collector.on('end', () => {
				resolve();
			})
		})
	} 

	private onMessage(message : Message) {
    const content = message.content.trim();
    if (!content.startsWith(this.prefix)) return;

    const commandArgs = content.slice(this.prefix.length).trim().split(/ +/);
    const commandName: string = commandArgs.shift();

    if (!commandName) return;

    const command = this.commands.get(commandName)
      || this.commands.find((cmd : SubCommand) => cmd.aliases.includes(commandName));
    if (command) {
      const cooldownData = this.cooldownHandler.getCooldownData(command, message.member.user);
      if (cooldownData) {
				this.onCooldown();
      }
    }
  }
}

export { SubCommandHandler, SubCommand, SubCommandHandlerConfig }