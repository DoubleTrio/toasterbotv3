import {
  MessageEmbedOptions,
  EmbedFieldData,
  InteractionCollectorOptions,
  ButtonInteraction,
  CommandInteraction,
  MessageEmbedFooter,
  MessageActionRowOptions,
  MessageButtonOptions,
  InteractionCollector,
  MessageActionRow,
  SelectMenuInteraction,
  Message,
} from 'discord.js';
import i18n from 'i18next';
import { SubCommand, SubCommandHandler } from '../structures/handlers';

interface PaginatedEmbedOptions<T> {
  items: T[],
  embedData?: Omit<MessageEmbedOptions, 'footer'>
  transform: (item: T, index: number) => EmbedFieldData;
  perPage?: number,
  buttonCollectorOptions?: InteractionCollectorOptions<ButtonInteraction>;
  components?: MessageActionRow[] | MessageActionRowOptions[]
}

const PAGINATED_COMMANDS = {
  FIRST: 'FIRST',
  BACK: 'BACK',
  NEXT: 'NEXT',
  LAST: 'LAST',
  TRASH: 'TRASH',
} as const;

type PaginatedCommands = keyof typeof PAGINATED_COMMANDS;

class PaginatedEmbed<T> {
  private currentPage = 1;

  private totalPages: number;

  private count: number;

  private interaction: CommandInteraction;

  private items: EmbedFieldData[];

  private embedData: Omit<MessageEmbedOptions, 'footer'>;

  private transform: (item: T, index: number) => EmbedFieldData;

  private perPage: number;

  private buttonCollectorOptions: InteractionCollectorOptions<ButtonInteraction>;

  private collector: InteractionCollector<ButtonInteraction>;

  private components: MessageActionRow[] | MessageActionRowOptions[];

  private message : Message;

  private subCommandHandler : SubCommandHandler;

  constructor(interaction: CommandInteraction, options: PaginatedEmbedOptions<T>) {
    this.interaction = interaction;
    this.items = options.items.map((item, index) => options.transform(item, index));
    this.embedData = options.embedData || {
      fields: [],
    };
    this.transform = options.transform;
    this.perPage = options.perPage ?? 10;
    this.components = options.components || [];
    this.buttonCollectorOptions = options.buttonCollectorOptions || {
      time: 25 * 1000,
      filter: (btnInteraction) => btnInteraction.user.id === interaction.user.id
        && btnInteraction.message.id === this.message.id,
      componentType: 'BUTTON',
    };
  }

  private initCommands() {
    const commands : SubCommand[] = [
      {
        name: 'goto',
        description: 'Goto that page',
        execute: (message, args) => {
          if (!args.length) return;
          const arg = args[0] as string;
          console.log(arg);
          const num = parseInt(arg);
          this.currentPage = num;
          this.interaction.editReply({
            embeds: [this.paginatedEmbed(this.items)],
            components: [this.createActionButtonRow(), ...this.components],
          });
        },
        aliases: ['page'],
        cooldown: 2 * 1000,
        args: 'Number',
      }
    ]

    this.subCommandHandler = new SubCommandHandler(
      {
        commands,
        onCooldown: () => { 'a' },
        prefix: 'tb.',
        filter: (message) => message.member.id === this.interaction.user.id,
      }
    )
  }
  public async create() : Promise<void> {
    this.message = await this.interaction.fetchReply() as Message;
    this.count = this.items.length;
    this.totalPages = Math.ceil(this.count / this.perPage);
    this.initCommands();

    return new Promise((resolve) => {
      this.subCommandHandler.init(this.interaction);
      this.interaction.editReply({
        embeds: [this.paginatedEmbed(this.items)],
        components: [this.createActionButtonRow(), ...this.components],
      });

      this.collector = this.interaction.channel.createMessageComponentCollector(
        this.buttonCollectorOptions,
      );

      this.collector.on('collect', async (btnInteraction: ButtonInteraction) => {
        this.collector.resetTimer();
        const customId = btnInteraction.customId as PaginatedCommands;
        this.updatePage(customId);
        if (customId !== 'TRASH') {
          await btnInteraction.update({
            embeds: [this.paginatedEmbed(this.items)],
            components: [this.createActionButtonRow(), ...this.components],
          });
        }
      });

      this.collector.on('end', async () => {
        this.subCommandHandler.stopCollector();
        this.message.delete();
        resolve();
      });
    });
  }

  public update(menuInteraction: SelectMenuInteraction, newItems: T[]) : void {
    this.collector.resetTimer();
    this.items = newItems.map((item, index) => this.transform(item, index));
    this.count = newItems.length;
    this.totalPages = Math.ceil(this.count / this.perPage);
    this.currentPage = 1;
    menuInteraction.update({
      embeds: [this.paginatedEmbed(this.items)],
      components: [this.createActionButtonRow(), ...this.components],
    });
  }

  private footer() : MessageEmbedFooter {
    return {
      iconURL: this.interaction.user.avatarURL(),
      text: i18n.t('paginatedEmbedFooter', {
        timeLimit: this.buttonCollectorOptions.time / 1000,
        user: this.interaction.user,
      }),
    };
  }

  private updatePage(customId: PaginatedCommands) : void {
    switch (customId) {
      case 'FIRST':
        this.currentPage = 1;
        break;
      case 'BACK':
        this.currentPage = Math.max(this.currentPage - 1, 1);
        break;
      case 'NEXT':
        this.currentPage = Math.min(this.currentPage + 1, this.totalPages);
        break;
      case 'LAST':
        this.currentPage = this.totalPages;
        break;
      case 'TRASH':
        this.collector.stop();
        break;
      default:
        break;
    }
  }

  private paginatedEmbed(data: EmbedFieldData[]) : MessageEmbedOptions {
    const endIndex = this.perPage * this.currentPage;
    const start = endIndex - this.perPage;
    const end = endIndex;
    const pageText = i18n.t('paginatedEmbedPages', {
      currentPage: this.currentPage,
      totalPages: this.totalPages || 1,
    });

    const embedData : MessageEmbedOptions = {
      ...this.embedData,
      footer: this.footer(),
      title: this.embedData.title ? `${this.embedData.title} | ${pageText}` : pageText,
      fields: [...this.embedData?.fields || [], ...data.slice(start, end)],
    };
    return embedData;
  }

  private createActionButtonRow() : MessageActionRowOptions {
    const backPageDisabled = this.currentPage === 1;
    const nextPageDisabled = this.currentPage === this.totalPages;

    const buttons : MessageButtonOptions[] = [
      {
        style: 'PRIMARY',
        label: '<<',
        customId: PAGINATED_COMMANDS.FIRST,
        type: 'BUTTON',
        disabled: backPageDisabled,
      },
      {
        style: 'PRIMARY',
        label: '<',
        customId: PAGINATED_COMMANDS.BACK,
        type: 'BUTTON',
        disabled: backPageDisabled,
      },
      {
        style: 'PRIMARY',
        label: '>',
        customId: PAGINATED_COMMANDS.NEXT,
        type: 'BUTTON',
        disabled: nextPageDisabled,
      },
      {
        style: 'PRIMARY',
        label: '>>',
        customId: PAGINATED_COMMANDS.LAST,
        type: 'BUTTON',
        disabled: nextPageDisabled,
      },
      {
        style: 'DANGER',
        label: 'Trash',
        customId: PAGINATED_COMMANDS.TRASH,
        type: 'BUTTON',
        disabled: false,
      },
    ];
    return {
      type: 'ACTION_ROW',
      components: buttons,
    };
  }
}

export { PaginatedCommands, PaginatedEmbed, PAGINATED_COMMANDS };
