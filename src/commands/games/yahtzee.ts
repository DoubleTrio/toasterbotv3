import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction, Message,
} from 'discord.js';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';
import Yahtzee from '../../games/Yahtzee/Yahtzee';
import { to } from '../../helpers';

class YahtzeeCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'yahtzee',
      enabled: true,
      aliases: ['yz'],
      botPermissions: [
        'VIEW_CHANNEL', 
        'SEND_MESSAGES', 
        'ADD_REACTIONS', 
        'USE_EXTERNAL_EMOJIS',
      ],
      memberPermissions: [
        'VIEW_CHANNEL', 
        'SEND_MESSAGES', 
        'ADD_REACTIONS', 
      ],
    });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage | void> {
    const yahtzee = new Yahtzee(this.client, interaction);
    const [ err ] = await to(yahtzee.start());
    if (err) {
      console.log(err);
      this.client.logError(this, err);
    }
  }
}

export default YahtzeeCommand;
