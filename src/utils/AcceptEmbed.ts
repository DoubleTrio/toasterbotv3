import {
  MessageButtonOptions,
  MessageActionRowOptions,
  MessageEmbedOptions,
  ButtonInteraction,
  CommandInteraction,
} from 'discord.js';
import i18n from 'i18next';

interface AcceptEmbedConfig {
  acceptText?: string;
  declineText?: string;
  title?: string;
  timeLimit?: number;
}

const ACCEPT_EMBED_BUTTONS = {
  ACCEPT: 'ACCEPT',
  DECLINE: 'DECLINE',
} as const;

type AcceptEmbedButton = keyof typeof ACCEPT_EMBED_BUTTONS;

class AcceptEmbed {
  readonly interaction: CommandInteraction;

  private acceptText: string;

  private declineText: string;

  private embedOptions: MessageEmbedOptions;

  private timeLimit: number;

  constructor(
    interaction: CommandInteraction,
    embedOptions: MessageEmbedOptions,
    options: AcceptEmbedConfig = {},
  ) {
    this.acceptText = options.acceptText || i18n.t('acceptEmbedAccept');
    this.declineText = options.declineText || i18n.t('acceptEmbedDecline');
    this.embedOptions = embedOptions;
    this.interaction = interaction;

    this.timeLimit = options.timeLimit || 30000;
  }

  public awaitResponse(id: string) : Promise<boolean> {
    const embed: MessageEmbedOptions = {
      ...this.embedOptions,
      footer: {
        iconURL: this.interaction.user.avatarURL(),
        text: i18n.t('paginatedEmbedFooter', {
          user: this.interaction.user,
          timeLimit: this.timeLimit / 1000,
        }),
      },
    };

    const filter = (btnInteraction: ButtonInteraction) => btnInteraction.user.id === id;
    this.interaction.followUp({
      embeds: [embed],
      components: [this.component()],
    });

    return new Promise((resolve) => {
      const stop = (outcome : boolean) => {
        resolve(outcome);
        collector.stop();
      };

      const collector = this.interaction.channel.createMessageComponentCollector(
        {
          filter,
          time: this.timeLimit,
          maxUsers: 1,
          max: 1,
        },
      );

      collector.on('collect', (btnInteraction: ButtonInteraction) => {
        btnInteraction.deferUpdate();
        const customId = btnInteraction.customId as AcceptEmbedButton;
        switch (customId) {
          case 'ACCEPT':
            stop(true);
            break;
          case 'DECLINE':
            stop(false);
            break;
          default:
            stop(false);
        }
      });

      collector.on('end', () => {
        resolve(false);
      });
    });
  }

  private component() {
    const buttons: MessageButtonOptions[] = [
      {
        style: 'SUCCESS',
        label: this.acceptText,
        customId: ACCEPT_EMBED_BUTTONS.ACCEPT,
        type: 'BUTTON',
      },
      {
        style: 'DANGER',
        label: this.declineText,
        customId: ACCEPT_EMBED_BUTTONS.DECLINE,
        type: 'BUTTON',
      },
    ];

    const actionComponent: MessageActionRowOptions = {
      components: buttons,
      type: 'ACTION_ROW',
    };

    return actionComponent;
  }
}

export default AcceptEmbed;
