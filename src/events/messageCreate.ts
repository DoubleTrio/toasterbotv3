import { ClientEvents, Message } from 'discord.js';
import { ToasterBot, ToasterBotEvent } from '../structures';

class MessageCreateEvent extends ToasterBotEvent {
  constructor() {
    super({
      name: 'messageCreate',
      once: false,
    });
  }

  async execute(client: ToasterBot, ...args: ClientEvents['messageCreate']) : Promise<Message | void> {
    const message: Message = args[0];
    if (message.author.bot) return;
    if (!message.content.startsWith(client.prefix)) return;
  }
}

export default MessageCreateEvent;
