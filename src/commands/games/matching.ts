import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
} from 'discord.js';
import Matching from '../../games/Matching/Matching';
import { generateIntegerChoices, to } from '../../helpers';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';

class MatchingCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'matching',
      aliases: ['match', 'memory'],
      enabled: true,
      nsfw: false,
      cooldown: 10 * 1000,
      ownerOnly: true,
      guildOnly: true,
      options: [
        {
          name: 'width',
          type: 'INTEGER',
          required: false,
          description: 'The width of the board (default: 4)',
          choices: generateIntegerChoices(5, (n) => {
            const value = n + 4;
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
          description: 'The height of the board (default: 4)',
          choices: generateIntegerChoices(5, (n) => {
            const value = n + 4;
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
    const matching = new Matching(this.client, interaction);
    const [err] = await to(matching.start());
    if (err) {
      console.log(err);
      this.client.logError(this, err);
    }
  }
}

export default MatchingCommand;
