import { APIMessage } from 'discord-api-types';
import { CommandInteraction, Message } from 'discord.js';
import { Command, CommandInfo, ToasterBot } from '../../structures';

class PingCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client,
      info, {
        name: 'ping',
        enabled: true,
        aliases: ['pong'],
        cooldown: 10 * 1000,
      });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage> {
    return interaction.followUp('Pong');
  }
}

export default PingCommand;
