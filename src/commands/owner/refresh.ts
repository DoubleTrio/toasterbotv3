import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
} from 'discord.js';
import i18n from 'i18next';
import {
  Command, CommandInfo, Game, ToasterBot,
} from '../../structures';

class RefreshCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'refresh',
      aliases: [],
      enabled: true,
      nsfw: false,
      ownerOnly: true,
      options: [
        {
          name: 'rate',
          type: 'NUMBER',
          description: 'The refresh rate for when players can host or join games (default: 180 seconds)',
        },
      ],
    });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage | void> {
    const rate = interaction.options.getNumber('rate') * 1000 || this.client.playerClearTimerRate;
    Game.startClearTimer(rate);

    if (rate < 20 * 1000) {
      return;
    }

    const refreshMessage = i18n.t(`${this.name}.refreshMessage`, {
      rate: rate / 1000,
    });

    interaction.editReply(refreshMessage);
  }
}

export default RefreshCommand;
