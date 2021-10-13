import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
} from 'discord.js';
import Mastermind from '../../games/Mastermind';
import { generateIntegerChoices } from '../../helpers';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';

class MastermindCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'mastermind',
      aliases: ['wm'],
      enabled: true,
      options: [
        {
          name: 'difficulty',
          type: 'STRING',
          required: false,
          description: 'The difficulty of the secret word based on how common it appears (default: common)',
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
          type: 'INTEGER',
          name: 'length',
          description: 'The length of the secret word (default: 5)',
          choices: generateIntegerChoices(11, (n) => {
            const value = n + 4;
            return {
              name: value.toString(),
              value,
            };
          }),
        },
        {
          type: 'INTEGER',
          name: 'turns',
          description: 'The amount of turns (default: dependent on secret word length)',
          choices: generateIntegerChoices(15, (n) => {
            const value = ((n + 2) * 2);
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
    const mastermind = new Mastermind(this.client, interaction);
    return mastermind.start();
  }
}

export default MastermindCommand;
