import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction, Message,
} from 'discord.js';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';
import Hangman from '../../games/Hangman';
import { generateIntegerChoices } from '../../helpers';

class HangmanCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'hangman',
      enabled: true,
      aliases: ['hm'],
      options: [
        {
          name: 'difficulty',
          type: 'STRING',
          required: false,
          description: 'The difficulty of the word (default: common)',
          choices: [
            {
              name: 'Common (~2k words)',
              value: 'COMMON',
            },
            {
              name: 'Wordnik (~190K words)',
              value: 'WORDNIK',
            },
            {
              name: 'All (~370K words)',
              value: 'ALL',
            },
          ],
        },
        {
          name: 'min',
          type: 'INTEGER',
          required: false,
          description: 'The minimum word length',
          choices: generateIntegerChoices(13, (n) => {
            const value = n + 2;
            return {
              name: value.toString(),
              value,
            };
          }),
        },
        {
          name: 'max',
          type: 'INTEGER',
          required: false,
          description: 'The max word length',
          choices: generateIntegerChoices(13, (n) => {
            const value = n + 3;
            return {
              name: value.toString(),
              value,
            };
          }),
        },
        {
          name: 'lives',
          type: 'INTEGER',
          required: false,
          description: 'The amount of lives',
          choices: generateIntegerChoices(10, (n) => {
            const value = n + 1;
            return {
              name: value.toString(),
              value,
            };
          }),
        },
      ],
    });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage | void> {
    const hangman = new Hangman(this.client, interaction);
    return hangman.start();
  }
}

export default HangmanCommand;
