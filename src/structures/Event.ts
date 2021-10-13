import { ClientEvents } from 'discord.js';
import { ToasterBot } from '.';

interface ToasterEventOptions {
  name: keyof ClientEvents,
  once: boolean,
}

abstract class ToasterBotEvent {
  readonly name: keyof ClientEvents;

  readonly once: boolean;

  constructor(options: ToasterEventOptions) {
    this.name = options.name;
    this.once = options.once;
  }

  abstract execute(client: ToasterBot, ...args: unknown[]) : unknown | Promise<unknown>;
}

export { ToasterBotEvent, ToasterEventOptions };
