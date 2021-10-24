import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
} from 'discord.js';
import { generateIntegerChoices, to } from '../../helpers';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';

class CommandBase extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'base',
      aliases: [],
      enabled: false,
      botPermissions: [],
      memberPermissions: [],
      nsfw: false,
      cooldown: 10 * 1000,
      ownerOnly: true,
      guildOnly: true,
      options: [
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
      ],
    });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage | void> {
    const [ err ] = await to(new Promise((resolve) => resolve('start')));
    if (err) {
      console.log(err);
      this.client.logError(this, err);
    }
  }
}

export default CommandBase;
