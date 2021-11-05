import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction, Message,
} from 'discord.js';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';
import Minesweeper from '../../games/Minesweeper';
import { generateIntegerChoices, to } from '../../helpers';

class MinesweeperCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'minesweeper',
      enabled: true,
      aliases: ['ms', 'sweep'],
      cooldown: 5 * 1000,
      options: [
        {
          name: 'width',
          type: 'INTEGER',
          required: false,
          description: 'The width of the board (default: 8)',
          choices: generateIntegerChoices(8, (n) => {
            const value = n + 2;
            return {
              name: value.toString(),
              value,
            };
          }),
        },
        {
          name: 'height',
          type: 'INTEGER',
          required: false,
          description: 'The height of the board (default: 8)',
          choices: generateIntegerChoices(8, (n) => {
            const value = n + 2;
            return {
              name: value.toString(),
              value,
            };
          }),
        },
        {
          name: 'mines',
          type: 'INTEGER',
          required: false,
          description: 'The amount of mines placed on the board (default: 13)',
        },
        {
          name: 'reveal',
          type: 'BOOLEAN',
          required: false,
          description: 'Whether to reveal the largest open area for minesweeper (default: true)',
        },
      ],
    });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage | void> {
    const minesweeper = new Minesweeper({
      command: this,
      interaction,
    });

    const [err] = await to(minesweeper.start());
    if (err) {
      console.log(err);
      minesweeper.removeAllPlayers();
      this.client.logError(this, err);
    }
  }
}

export default MinesweeperCommand;
