import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction, Message, MessageEmbedOptions,
} from 'discord.js';
import i18n from 'i18next';
import { Game, ToasterBot } from '../../structures';

class Matching extends Game {
  constructor(client: ToasterBot, interaction: CommandInteraction) {
    super(client, interaction);
  }

  protected async play() : Promise<void | Message | APIMessage> {
    await this.initialize();
    if (this.hasEnded) {
      return;
    }
    while (!this.terminal()) {
      this.renderEmbed();
      if (this.hasEnded) {
        return;
      }
    }
  }

  protected async initialize() : Promise<void> {
    console.log('initialize');
  }

  private terminal() {
    return true;
  }

  private renderEmbed(info?: string) {
    // const fields = [
    //   {
    //     name: i18n.t('game.detailsText'),
    //     value: livesString,
    //   },
    //   {
    //     name: i18n.t('hangman.lettersGuessed'),
    //     value: lettersGuessedString + displayLine,
    //   },
    // ];
    let data: MessageEmbedOptions = {
      color: this.embedColor,
      footer: {
        text: i18n.t('timeLimitText', {
          timeLimit: this.timeLimit / 1000,
        }),
        iconURL: this.interaction.user.avatarURL(),
      },
      timestamp: Date.now(),
    };

    if (info) {
      data = {
        ...data,
        title: info,
      };
    }

    if (this.interaction.replied) {
      return this.interaction.editReply({ embeds: [data] });
    }
    return this.interaction.followUp({ embeds: [data] });
  }
}

export default Matching;
