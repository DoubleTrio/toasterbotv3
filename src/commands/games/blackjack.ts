import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
} from 'discord.js';
import Blackjack from '../../games/Blackjack/Blackjack';
import { generateIntegerChoices, to } from '../../helpers';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';

class BlackjackCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'blackjack',
      aliases: ['bj', '21'],
      enabled: true,
      cooldown: 10 * 1000,
      options: [
        {
          type: 'INTEGER',
          name: 'money',
          description: 'The starting amount of money (default: 100)',
          choices: generateIntegerChoices(10, (n) => {
            const value = 50 + (50 * n);
            return {
              name: value.toString(),
              value,
            };
          }),
        },
        {
          type: 'INTEGER',
          name: 'rounds',
          description: 'The total amount of rounds (default: 5)',
          choices: generateIntegerChoices(8, (n) => {
            const value = 3 + (n * 2);
            return {
              name: value.toString(),
              value,
            };
          }),
        },
        {
          type: 'INTEGER',
          name: 'bet',
          description: 'The minimum bet per round (default: 5)',
          choices: generateIntegerChoices(10, (n) => {
            const value = 5 * (n + 1);
            return {
              name: value.toString(),
              value,
            };
          }),
        },
        {
          type: 'INTEGER',
          name: 'stay',
          description: 'Dealer stays on n (default: 16)',
          choices: generateIntegerChoices(3, (n) => {
            const value = 15 + n;
            return {
              name: value.toString(),
              value,
            };
          }),
        },
        {
          type: 'INTEGER',
          name: 'reshuffle',
          description: 'The deck shuffles every n round (default: 3)',
          choices: generateIntegerChoices(3),
        },
      ],
    });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage | void> {
    const blackjack = new Blackjack({
      command: this,
      interaction,
    });

    const [err] = await to(blackjack.start());
    if (err) {
      console.log(err);
      blackjack.removeAllPlayers();
      this.client.logError(this, err);
    }
  }
}

export default BlackjackCommand;
