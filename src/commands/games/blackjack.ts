import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
} from 'discord.js';
import Blackjack from '../../games/Blackjack/Blackjack';
import { generateIntegerChoices } from '../../helpers';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';

class BlackjackCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'blackjack',
      aliases: ['bj', '21'],
      enabled: true,
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
          name: 'reshuffle',
          description: 'The deck reshuffles every n round (default: 3)',
          choices: generateIntegerChoices(3),
        },
      ],
    });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage | void> {
    const blackjack = new Blackjack(this.client, interaction);
    return blackjack.start();
  }
}

export default BlackjackCommand;
