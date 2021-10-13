import { APIMessage } from 'discord-api-types';
import { CommandInteraction, Message } from 'discord.js';
import { Command, CommandInfo, ToasterBot } from '../../structures';

class Ping extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client,
      info, {
        name: 'ping',
        enabled: false,
        aliases: ['pong'],
      });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage> {
    return interaction.followUp('Pong');
  }
}

export default Ping;
