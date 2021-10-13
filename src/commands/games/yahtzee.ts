import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction, Message,
} from 'discord.js';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';
import Yahtzee from '../../games/Yahtzee/Yahtzee';

class YahtzeeCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'yahtzee',
      enabled: true,
      aliases: ['yz'],
    });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage | void> {
    const yahtzee = new Yahtzee(this.client, interaction);
    return yahtzee.start();
  }
}

export default YahtzeeCommand;
