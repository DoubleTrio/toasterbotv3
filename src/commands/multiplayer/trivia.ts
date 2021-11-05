import { APIMessage } from 'discord-api-types';
import {
  ApplicationCommandOptionChoice,
  CommandInteraction,
  Message,
} from 'discord.js';
import Trivia from '../../games/Trivia/Trivia';
import { generateIntegerChoices, to } from '../../helpers';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';

const categories = [
  'Random',
  'General Knowledge',
  'Entertainment: Books',
  'Entertainment: Film',
  'Entertainment: Music',
  'Entertainment: Musical Theatres',
  'Entertainment: Television',
  'Entertainment: Video Games',
  'Entertainment: Board Games',
  'Science & Nature',
  'Science: Computers',
  'Science: Mathematics',
  'Mythology',
  'Sports',
  'Geography',
  'History',
  'Politics',
  'Art',
  'Celebrities',
  'Animals',
  'Vehicles',
  'Entertainment: Comics',
  'Science: Gadgets',
  'Entertainment: Japanese Anime & Manga',
  'Entertainment: Cartoon & Animations',
];

const difficulties = [
  'Easy',
  'Medium',
  'Hard',
];

class TriviaCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'trivia',
      enabled: true,
      cooldown: 10 * 1000,
      options: [
        {
          type: 'INTEGER',
          name: 'rounds',
          description: 'The total number of rounds (default: 1)',
          required: false,
          choices: generateIntegerChoices(25),
        },
        {
          type: 'STRING',
          name: 'difficulty',
          description: 'The difficulty of the questions (default: Random)',
          required: false,
          choices: [
            ...difficulties.map((difficulty) : ApplicationCommandOptionChoice => ({
              name: difficulty,
              value: difficulty.toLowerCase(),
            })),
          ],
        },
        {
          type: 'INTEGER',
          name: 'category',
          description: 'The category of the trivia questions (default: Random)',
          choices: [
            ...categories.map((category, index) : ApplicationCommandOptionChoice => ({
              name: category,
              value: category === 'Random' ? 0 : index + 8,
            })),
          ],
        },
        {
          type: 'INTEGER',
          name: 'time',
          description: 'How long will each question last (default: 20 seconds)',
          choices: generateIntegerChoices(12, (n) => {
            const value = (n + 1) * 5;
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
    const trivia = new Trivia({
      command: this,
      interaction,
    });

    const [err] = await to(trivia.start());
    if (err) {
      console.log(err);
      trivia.removeAllPlayers();
      this.client.logError(this, err);
    }
  }
}

export default TriviaCommand;
