import { Awaited } from 'discord.js';
import { ToasterBot, ToasterBotEvent } from '../structures';

class ReadyEvent extends ToasterBotEvent {
  constructor() {
    super({
      name: 'ready',
      once: true,
    });
  }

  execute(client: ToasterBot) : Awaited<void> {
    client.commandHandler.commands.forEach(async (command) => {
      if (command.enabled) {
        await client.createGuildCommand(command, process.env.TESTING_SERVER_ID);
      }
    });
    client.user.setActivity({ type: 'PLAYING', name: 'Being refactored...' });
  }
}

export default ReadyEvent;
