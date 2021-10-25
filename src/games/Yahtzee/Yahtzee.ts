import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
  MessageEmbedOptions,
  EmbedFieldData,
  MessageActionRowOptions,
  MessageButtonOptions,
  MessageSelectOptionData,
  ButtonInteraction,
  InteractionCollectorOptions,
  MessageReaction,
  SelectMenuInteraction,
  WebhookEditMessageOptions,
  MessageActionRow,
  MessageSelectMenu,
} from 'discord.js';
import i18n from 'i18next';
import { ALPHANUMERIC_TO_EMOJI, EMOJI_TO_ALPHANUMERIC } from '../../constants';
import { addReactions } from '../../helpers';
import { Game, ToasterBot } from '../../structures';
import YahtzeeCategory from './YahtzeeCategory';
import YahtzeePlayer from './YahtzeePlayer';

enum YahtzeeStatus {
  ROLLING,
  CATEGORIES,
}

type YahtzeeActions = 'REROLL' | 'PLAY';

const YAHTZEE_REACTIONS = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣'];

const YAHTZEE_GAME_INACTIVITY_MESSAGE = i18n.t('game.inactivityMessage', {
  gameName: 'Yahtzee',
});

const YAHTZEE_SELECT_CATEGORY_TEXT = i18n.t('yahtzee.selectCategoryText');

class Yahtzee extends Game {
  private message: Message;

  private player = new YahtzeePlayer();

  private status = YahtzeeStatus.ROLLING;

  private turn = 1;

  constructor(client: ToasterBot, interaction: CommandInteraction) {
    super(client, interaction, { timeLimit: 60000 });
  }

  protected async play() : Promise<void | Message | APIMessage> {
    await this.initialize();
    while (!this.terminal()) {
      await this.awaitDiceRolls();
      if (this.hasEnded) {
        return this.renderEmbed(YAHTZEE_GAME_INACTIVITY_MESSAGE);
      }

      await this.selectCategory();
      if (this.hasEnded) {
        return this.renderEmbed(YAHTZEE_GAME_INACTIVITY_MESSAGE);
      }

      if (!this.terminal()) {
        this.turn += 1;
        this.player.scoreSheet.reset();
      }

      this.status = YahtzeeStatus.ROLLING;
      if (!this.terminal()) {
        this.renderEmbed();
      } else {
        this.renderEmbed(
          i18n.t('yahtzee.winMessage', {
            score: this.player.scoreSheet.totalScore.toString(),
          }),
        );
      }
    }
  }

  private terminal() {
    return Object.values(this.player.scoreSheet.categories).every((category) => category.isMarked);
  }

  protected async initialize() : Promise<void> {
    this.player.scoreSheet.rerollAll();
    this.message = await this.interaction.fetchReply() as Message;
    this.renderEmbed();
    addReactions(this.message, YAHTZEE_REACTIONS);
  }

  private async awaitDiceRolls() : Promise<void> {
    this.player.refreshRerolls();
    const buttonOptions : InteractionCollectorOptions<ButtonInteraction> = {
      time: this.timeLimit,
      filter: (btnInteraction: ButtonInteraction) => this.interaction.user.id
        === btnInteraction.user.id,
      componentType: 'BUTTON',
    };

    const buttonCollector = this.interaction.channel.createMessageComponentCollector(
      buttonOptions,
    );

    const endTurn = () => {
      this.status = YahtzeeStatus.CATEGORIES;
      this.renderEmbed(YAHTZEE_SELECT_CATEGORY_TEXT);
      buttonCollector.stop();
    };

    return new Promise((resolve) => {
      buttonCollector.on('end', (collected) => {
        if (!collected.size) {
          this.hasEnded = true;
        }
        resolve();
      });

      buttonCollector.on('collect', async (btnInteraction) => {
        btnInteraction.deferUpdate();
        const customId = btnInteraction.customId as YahtzeeActions;
        if (customId === 'REROLL') {
          const m = btnInteraction.message as Message;
          const message = await m.fetch();
          for (const reaction of message.reactions.cache.values()) {
            const hasUser = await this.reactionHasUser(reaction);
            const emojiName = reaction.emoji.name;
            if (hasUser) {
              const diceNumber = EMOJI_TO_ALPHANUMERIC[emojiName];
              this.player.keepRoll(diceNumber as number);
            }
          }

          const rerollList = this.player.getRerollList();
          this.player.scoreSheet.reroll(rerollList);
          if (!this.player.canReroll) {
            endTurn();
          } else {
            this.renderEmbed();
          }
        } else if (customId === 'PLAY') {
          endTurn();
        }
      });
    });
  }

  private async selectCategory() : Promise<void> {
    const filter = (currentInteraction: SelectMenuInteraction) => currentInteraction.user.id === this.interaction.user.id
      && this.message.id === currentInteraction.message.id;

    const collector = this.interaction.channel.createMessageComponentCollector({
      filter,
      componentType: 'SELECT_MENU',
      time: this.timeLimit,
      max: 1,
    });

    return new Promise((resolve) => {
      collector.on('collect', (menuInteraction: SelectMenuInteraction) => {
        menuInteraction.deferUpdate();
        const [categoryId] = menuInteraction.values;
        this.player.scoreSheet.selectCategory(categoryId);
        return resolve();
      });

      collector.on('end', (collected) => {
        if (!collected.size) {
          this.hasEnded = true;
          return resolve();
        }
      });
    });
  }

  private renderEmbed(info?: string) {
    const {
      rolls,
      rerolls,
      categories,
      totalScore,
      distribution,
      hasUpperBonus,
      upperScore,
    } = this.player.scoreSheet;

    const rollsDisplay = `**${Object.values(rolls)
      .map((roll) => ALPHANUMERIC_TO_EMOJI[roll])
      .join('  ')}**`;

    const fields: EmbedFieldData[] = [
      {
        name: i18n.t('yahtzee.yourRolls'),
        value: rollsDisplay,
        inline: true,
      },

      {
        name: i18n.t('yahtzee.rerollsLeft'),
        value: `**${rerolls}**`,
        inline: true,
      },

      { name: i18n.t('yahtzee.totalPoints'), value: `**${totalScore}**`, inline: true },

      { name: '\u200b', value: '\u200b' },
    ];

    for (const [id, category] of Object.entries<YahtzeeCategory>(categories)) {
      const markedEmoji = category.isMarked ? '✅' : '❌';
      const addedScoreString = !category.isMarked
        ? `(+${category.getDisplayValue(distribution)})`
        : '';

      fields.push({
        name: `**#${id}: ${category.name} ${markedEmoji}**`,
        value: i18n.t('game.scoreValue', {
          value: `${category.value ?? '0'} ${addedScoreString}`,
        }),
        inline: true,
      });
    }

    fields.push({
      name: i18n.t('yahtzee.upperBonus', {
        emoji: hasUpperBonus ? '✅' : '❌',
      }),
      value: `${
        hasUpperBonus ? i18n.t('game.scoreValue', { value: 35 }) : `(${upperScore}/63) (+35)`
      }`,
    });

    if (info) {
      fields.push({
        name: '** **',
        value: info,
      });
    }

    const scoreSheetTitle = i18n.t('yahtzee.scoreSheetTitle');
    const turnText = i18n.t('game.turn', {
      turn: `${this.turn}/${
        Object.keys(categories).length
      }`,
    });

    const title = `**${scoreSheetTitle} | ${turnText}**`;
    const embedData : MessageEmbedOptions = {
      color: this.client.colors.secondary,
      title,
      fields,
      footer: {
        iconURL: this.interaction.user.avatarURL(),
        text: i18n.t('timeLimitText', {
          timeLimit: this.timeLimit / 1000,
        }),
      },
      timestamp: Date.now(),
    };

    const payload : WebhookEditMessageOptions = {
      embeds: [embedData],
      components: this.status === YahtzeeStatus.CATEGORIES
        ? [this.createCategoryActionRow()]
        : [this.createRollDiceActionRow()],
    };

    return this.interaction.editReply(payload);
  }

  private async reactionHasUser(reaction : MessageReaction) : Promise<string> {
    const users = await reaction.users.fetch();
    const interactionUser = users
      .filter((user) => user.id === this.interaction.user.id)
      .first();
    return interactionUser?.id;
  }

  private createCategoryActionRow() : MessageActionRowOptions {
    const categoryOptions: MessageSelectOptionData[] = Object.entries(this.player.scoreSheet.categories)
      .filter(([, category]) => !category.isMarked)
      .map(([id, category]) => ({
        label: i18n.t('yahtzee.categoryId', {
          id,
        }),
        value: id,
        description: category.name,
      }));

    const component = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('category-menu')
        .setPlaceholder(i18n.t('yahtzee.categoryPlaceholder'))
        .addOptions(categoryOptions),
    );

    return component;
  }

  private createRollDiceActionRow() : MessageActionRowOptions {
    const buttons : MessageButtonOptions[] = [
      {
        style: 'SECONDARY',
        label: i18n.t('yahtzee.rerollButtonText'),
        customId: 'REROLL',
        type: 'BUTTON',
        disabled: !this.player.canReroll,
      },
      {
        style: 'PRIMARY',
        label: i18n.t('yahtzee.playButtonText'),
        customId: 'PLAY',
        type: 'BUTTON',
      },
    ];
    return {
      type: 'ACTION_ROW',
      components: buttons,
    };
  }
}

export default Yahtzee;
