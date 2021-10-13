import { Awaited, ClientEvents, Guild } from 'discord.js';
import { ToasterBot, ToasterBotEvent } from '../structures';

class GuildDeleteEvent extends ToasterBotEvent {
  constructor() {
    super({
      name: 'guildDelete',
      once: false,
    });
  }

  execute(client: ToasterBot, ...args: ClientEvents['guildDelete']) : Awaited<void> {
    const guild : Guild = args[0];
    console.log(guild);
  }
}

export default GuildDeleteEvent;
