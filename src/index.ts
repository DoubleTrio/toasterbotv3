import * as sourceMap from 'source-map-support';
import * as dotenv from 'dotenv';
import { Intents } from 'discord.js';
import * as Sentry from '@sentry/node';
import {
  CommandHandler, EventHandler, InternalizationHandler, ToasterBot,
} from './structures';

sourceMap.install();
dotenv.config();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

const transaction = Sentry.startTransaction({
  op: 'test',
  name: 'My First Test Transaction',
});

setTimeout(() => {
  try {
    const toasterbot = new ToasterBot(
      {
        intents: [
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.GUILD_MESSAGES,
          Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        ],
      },
      {
        commandHandler: new CommandHandler(),
        eventHandler: new EventHandler(),
        internalizationHandler: new InternalizationHandler(),
        debug: process.argv.includes('debug'),
        prefix: 'tb.',
      },
    );
    toasterbot.initialize();
  } catch (e) {
    Sentry.captureException(e);
  } finally {
    transaction.finish();
  }
}, 99);
