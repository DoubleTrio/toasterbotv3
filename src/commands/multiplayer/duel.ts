import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
} from 'discord.js';
import Duel from '../../games/Duel/Duel';
import { generateIntegerChoices, to } from '../../helpers';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';

class DuelCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'duel',
      enabled: true,
      cooldown: 10 * 1000,
      guildOnly: true,
      options: [
        {
          name: 'challenger',
          type: 'USER',
          required: false,
          description: 'The user to challenge',
        },
        {
          name: 'wins',
          type: 'INTEGER',
          required: false,
          description: 'The amount of wins required (default: 1)',
          choices: generateIntegerChoices(7),
        },
        {
          name: 'time',
          type: 'INTEGER',
          required: false,
          description: 'The amount of time each round to select an option (default: 20 seconds)',
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
          name: 'swords',
          description: 'The total amount of swords each player has (default: 1)',
          choices: generateIntegerChoices(3),
        },
        {
          type: 'INTEGER',
          name: 'spells',
          description: 'The total amount of spells each player has (default: 1)',
          choices: generateIntegerChoices(3),
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
    const duel = new Duel({
      command: this,
      interaction,
    });
    const [err] = await to(duel.start());
    if (err) {
      console.log(err);
      duel.removeAllPlayers();
      this.client.logError(this, err);
    }
  }
}

export default DuelCommand;
