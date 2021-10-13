import * as fs from 'fs';
import { ToasterBot } from '..';

class EventHandler {
  public loadEvents(client: ToasterBot) : void {
    const eventFiles = fs.readdirSync('./dist/src/events').filter((file) => file.endsWith('.js'));
    eventFiles.forEach(async (file) => {
      const eventFile = await import(`../../events/${file}`);
      const event = new eventFile.default();
      if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
      } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
      }
    });
  }
}

export default EventHandler;
