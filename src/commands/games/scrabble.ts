import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
} from 'discord.js';
import Scrabble from '../../games/Scrabble/Scrabble';
import { generateIntegerChoices, to } from '../../helpers';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';

class ScrabbleCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'scrabble',
      enabled: true,
      cooldown: 10 * 1000,
      options: [
        {
          type: 'STRING',
          name: 'mode',
          description: 'Complete with yourself or against others in the guild (default: solo)',
          required: false,
          choices: [
            {
              name: 'Solo',
              value: 'SOLO',
            },
            {
              name: 'Multiplayer',
              value: 'MULTIPLAYER',
            },
          ],
        },
        {
          type: 'INTEGER',
          name: 'rounds',
          description: 'The total number of rounds (default: 10)',
          required: false,
          choices: generateIntegerChoices(10),
        },
        {
          type: 'INTEGER',
          name: 'letters',
          description: 'The total amount of letters per round (default: 10)',
          required: false,
          choices: generateIntegerChoices(4, (n) => {
            const value = n + 7;
            return {
              name: value.toString(),
              value,
            };
          }),
        },
        {
          type: 'BOOLEAN',
          name: 'sort',
          description: 'Whether the letters are sorted alphabetically (default: false)',
          required: false,
        },
        {
          type: 'INTEGER',
          name: 'time',
          description: 'The amount of time each round to enter a word (default: 30 seconds)',
          choices: generateIntegerChoices(11, (n) => {
            const value = (n + 2) * 5;
            return {
              name: value.toString(),
              value: value * 1000,
            };
          }),
        },
        {
          type: 'INTEGER',
          name: 'intermediate',
          description: 'Time between each round (default: 5 seconds)',
          choices: generateIntegerChoices(13, (n) => {
            const value = n + 3;
            return {
              name: value.toString(),
              value: value * 1000,
            };
          }),
        },
      ],
    });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage | void> {
    const scrabble = new Scrabble(this.client, interaction);
    const [ err ] = await to(scrabble.start());
    if (err) {
      console.log(err);
      this.client.logError(this, err);
    }
  }
}

export default ScrabbleCommand;
