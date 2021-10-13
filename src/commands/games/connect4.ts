import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
} from 'discord.js';
import Connect4 from '../../games/Connect4/Connect4';
import { generateIntegerChoices } from '../../helpers';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';

class Connect4Command extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'connect4',
      aliases: ['c4'],
      enabled: true,
      options: [
        {
          name: 'challenger',
          type: 'USER',
          required: true,
          description: 'The user to challenge',
        },
        {
          type: 'INTEGER',
          name: 'width',
          description: 'Width of the board (default: 7)',
          choices: generateIntegerChoices(3, (n) => {
            const value = n + 7;
            return {
              name: value.toString(),
              value,
            };
          }),
        },
        {
          type: 'INTEGER',
          name: 'height',
          description: 'Height of the board (default: 6)',
          choices: generateIntegerChoices(4, (n) => {
            const value = n + 6;
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
    const connect4 = new Connect4(this.client, interaction);
    return connect4.start();
  }
}

export default Connect4Command;
