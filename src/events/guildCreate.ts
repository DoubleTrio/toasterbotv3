import { Awaited, ClientEvents, Guild } from 'discord.js';
import { ToasterBot, ToasterBotEvent } from '../structures';

class GuildCreateEvent extends ToasterBotEvent {
  constructor() {
    super({
      name: 'guildCreate',
      once: false,
    });
  }

  execute(client: ToasterBot, ...args: ClientEvents['guildCreate']) : Awaited<void> {
    const guild : Guild = args[0];
    console.log(guild);
  }
}

export default GuildCreateEvent;
