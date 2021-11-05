import { APIMessage } from 'discord-api-types';
import {
  CollectorFilter,
  Message,
  EmbedField,
  MessageEmbed,
  MessageButtonOptions,
  MessageActionRowOptions,
  ButtonInteraction,
  InteractionCollectorOptions,
  AwaitMessagesOptions,
} from 'discord.js';
import i18n from 'i18next';
import {
  Game,
  GameConfig,
} from '../../structures';
import BlackjackCard from './BlackjackCard';
import BlackjackPlayer from './BlackjackPlayer';
import BlackjackPlayerBase from './BlackjackPlayerBase';

const BLACKJACK_BUTTONS = {
  HIT: 'HIT',
  STAND: 'STAND',
  DOUBLE_DOWN: 'DOUBLE_DOWN',
  END_GAME: 'END_GAME',
} as const;

type BlackjackButton = keyof typeof BLACKJACK_BUTTONS;

type BlackjackPhase = 'BETTING' | 'PLAYING';

class Blackjack extends Game {
  private phase : BlackjackPhase = 'BETTING';

  private round = 0;

  private rounds: number;

  private reshuffle : number;

  private dealer : BlackjackPlayerBase = new BlackjackPlayerBase();

  private dealerStaysOn : number;

  private player : BlackjackPlayer;

  private message : Message;

  private cards : BlackjackCard[] = [];

  constructor(config : GameConfig) {
    super(config, { timeLimit: 30 * 1000 });
  }

  protected async play(): Promise<void | Message | APIMessage> {
    await this.initialize();
    while (!this.terminal()) {
      this.round += 1;

      if (this.round % this.reshuffle === 0) {
        this.cards = BlackjackCard.generateDeck();
      }

      this.phase = 'BETTING';
      this.renderBettingEmbed();
      await this.awaitBet();

      if (this.hasEnded) {
        return;
      }

      this.phase = 'PLAYING';
      this.dealCards();

      this.renderEmbed();
      await this.awaitBlackjackRound();

      if (this.hasEnded) {
        return;
      }
      await Game.sleep(5000);

      if (this.terminal()) {
        this.hasEnded = true;
        return this.renderEmbed(i18n.t('blackjack.winMessage', {
          amount: this.player.money,
        }),
        true);
      }

      if (!this.player.canBet) {
        this.hasEnded = true;
        return this.renderEmbed(i18n.t('blackjack.canNoLongerBet', {
          amount: this.player.money,
        }),
        true);
      }

      this.player.restart();
      this.dealer.restart();
    }
  }

  private terminal() {
    return this.round === this.rounds;
  }

  protected async initialize(): Promise<void> {
    this.dealerStaysOn = this.getOptionValue<number>('stay') || 16;
    this.rounds = this.getOptionValue<number>('rounds') || 5;
    this.reshuffle = this.getOptionValue<number>('reshuffle') || 3;
    const minBet = this.getOptionValue<number>('bet') || 5;
    const money = this.getOptionValue<number>('money') || 100;
    this.message = await this.interaction.fetchReply() as Message;
    this.player = new BlackjackPlayer(money, minBet);
    this.cards = BlackjackCard.generateDeck();
  }

  private dealCards() {
    for (let i = 0; i < 4; i++) {
      const card = this.cards.pop();
      if (i % 2 == 0) {
        this.player.addCard(card);
      } else {
        this.dealer.addCard(card);
      }
    }
  }

  private renderBettingEmbed(info = '** **') {
    const fields: EmbedField[] = [
      {
        name: i18n.t('blackjack.name'),
        value: i18n.t('blackjack.placeBets', {
          amount: this.player.money,
        }),
        inline: false,
      },
      {
        name: i18n.t('blackjack.minBet'),
        value: i18n.t('blackjack.money', {
          amount: this.player.minBet,
        }),
        inline: false,
      },
      {
        name: i18n.t('game.logs'),
        value: info,
        inline: false,
      },
    ];

    const timeLimitText = i18n.t('timeLimitText', {
      timeLimit: this.timeLimit / 1000,
    });

    const roundText = i18n.t('game.round', {
      round: `${this.round}/${this.rounds}`,
    });

    const data: MessageEmbed = new MessageEmbed({
      title: roundText,
      color: this.client.colors.primary,
      fields,
      footer: {
        text: timeLimitText,
        iconURL: this.interaction.user.avatarURL(),
      },
      timestamp: Date.now(),
    });

    return this.interaction.editReply({ embeds: [data], components: [this.createBlackjackActionRow()] });
  }

  private renderEmbed(info?: string, showDealerHand = false) {
    function renderCardField(player : BlackjackPlayerBase, name : string, isDealer : boolean) : EmbedField {
      return {
        name: `${name} \`\`[${!isDealer || showDealerHand ? player.handValue : `${player.hand[0].gameValue}+?`}]\`\``,
        value: player.getDisplay(isDealer && !showDealerHand),
        inline: true,
      };
    }

    const playerMoneyText = i18n.t('blackjack.money', {
      amount: this.player.bet,
    });

    const dealerStaysOnText = i18n.t('blackjack.dealerStaysOn', {
      value: this.dealerStaysOn,
    });

    const fields: EmbedField[] = [
      renderCardField(this.player, i18n.t('blackjack.playerHand'), false),
      renderCardField(this.dealer, i18n.t('blackjack.dealerHand'), true),
      {
        name: i18n.t('blackjack.totalMoney'),
        value: i18n.t('blackjack.money', {
          amount: this.player.money,
        }),
        inline: false,
      },
      {
        name: i18n.t('blackjack.yourBet'),
        value: `${playerMoneyText}\n\n${dealerStaysOnText}`,
        inline: false,
      },
      {
        name: i18n.t('game.logs'),
        value: info || '** **',
        inline: false,
      },
    ];

    const timeLimitText = i18n.t('timeLimitText', {
      timeLimit: this.timeLimit / 1000,
    });

    const turnText = i18n.t('game.turn', {
      turn: `${this.round}/${this.rounds}`,
    });

    const data: MessageEmbed = new MessageEmbed({
      title: turnText,
      color: this.client.colors.primary,
      fields,
      footer: {
        text: timeLimitText,
        iconURL: this.interaction.user.avatarURL(),
      },
      timestamp: Date.now(),
    });

    return this.interaction.editReply({ embeds: [data], components: [this.createBlackjackActionRow()] });
  }

  private async awaitBet() : Promise<void> {
    const filter : CollectorFilter<Message[]> = (m: Message): boolean => {
      const { content } = m;
      const isAuthor = m.author.id === this.interaction.user.id && !m.author.bot;
      const regex = /^[0-9]+$/;
      const isOnlyNumbers = regex.test(content.trim());
      return isAuthor && isOnlyNumbers;
    };

    const options: AwaitMessagesOptions = {
      time: this.timeLimit,
      filter,
    };

    const collector = this.interaction.channel.createMessageCollector(options);

    return new Promise((resolve) => {
      let flag = false;
      collector.on('collect', (message) => {
        collector.resetTimer();
        const bet = Number(message.content.toLowerCase());

        if (this.player.isValidBet(bet)) {
          this.player.setBet(bet);
          flag = true;
          collector.stop();
          resolve();
        } else if (bet < this.player.minBet) {
          this.renderBettingEmbed(i18n.t('blackjack.betTooLow', {
            min: this.player.minBet,
          }));
        } else {
          this.renderBettingEmbed(i18n.t('blackjack.betTooHigh', {
            max: this.player.money,
          }));
        }
      });

      collector.on('end', () => {
        if (!flag) {
          this.hasEnded = true;
          this.renderBettingEmbed(this.inactivityMessage);
        }
        resolve();
      });
    });
  }

  private hit(player : BlackjackPlayerBase) {
    const card = this.cards.pop();
    player.addCard(card);
  }

  private awaitBlackjackRound() : Promise<void> {
    const buttonOptions : InteractionCollectorOptions<ButtonInteraction> = {
      time: this.timeLimit,
      filter: (btnInteraction: ButtonInteraction) => this.interaction.user.id === btnInteraction.user.id
				&& btnInteraction.message.id === this.message.id,

      componentType: 'BUTTON',
    };

    const buttonCollector = this.interaction.channel.createMessageComponentCollector(
      buttonOptions,
    );

    return new Promise((resolve) => {
      const stand = () : void => {
        while (this.dealer.handValue < this.dealerStaysOn) {
          this.hit(this.dealer);
        }

        if (this.dealer.isOver21) {
          this.player.win();
          this.renderEmbed(i18n.t('blackjack.onDealerBust'), true);
        } else if (this.dealer.handValue > this.player.handValue) {
          this.player.lose();
          this.renderEmbed(i18n.t('blackjack.onDealerWin'), true);
        } else if (this.player.handValue > this.dealer.handValue) {
          this.player.win();
          this.renderEmbed(i18n.t('blackjack.onPlayerWin'), true);
        } else if (this.player.hasBlackjack && this.dealer.hasBlackjack) {
          this.renderEmbed(i18n.t('blackjack.onDraw'), true);
        } else if (this.player.hasBlackjack) {
          this.renderEmbed(i18n.t('blackjack.onPlayerBlackjackWin'));
        } else if (this.dealer.hasBlackjack) {
          this.renderEmbed(i18n.t('blackjack.onDealerBlackjackWin'));
        } else {
          this.renderEmbed(i18n.t('blackjack.onDraw'), true);
        }
        buttonCollector.stop();
      };

      const onLose = () => {
        this.player.lose();
        this.renderEmbed(i18n.t('blackjack.onPlayerHitBust'), true);
        buttonCollector.stop();
      };

      buttonCollector.on('end', (collected) => {
        if (!collected.size) {
          this.hasEnded = true;
        }
        resolve();
      });

      buttonCollector.on('collect', async (btnInteraction) => {
        btnInteraction.deferUpdate();
        buttonCollector.resetTimer();
        switch (btnInteraction.customId as BlackjackButton) {
          case 'HIT': {
            this.hit(this.player);
            if (this.player.isOver21) {
              onLose();
            } else {
              this.renderEmbed();
            }
            break;
          }

          case 'STAND': {
            stand();
            break;
          }

          case 'DOUBLE_DOWN': {
            this.player.doubleDown();
            this.hit(this.player);
            if (this.player.isOver21) {
              onLose();
            } else {
              stand();
            }
            break;
          }

          case 'END_GAME': {
            this.renderEmbed(i18n.t('blackjack.onEndGame'), true);
            this.hasEnded = true;
            buttonCollector.stop();
            break;
          }
        }
      });
    });
  }

  private createBlackjackActionRow() : MessageActionRowOptions {
    const isDisabled = this.phase === 'BETTING' || this.hasEnded;
    const buttons : MessageButtonOptions[] = [
      {
        style: 'SUCCESS',
        label: i18n.t('blackjack.btnHit'),
        customId: BLACKJACK_BUTTONS.HIT,
        type: 'BUTTON',
        disabled: isDisabled,
      },
      {
        style: 'PRIMARY',
        label: i18n.t('blackjack.btnStand'),
        customId: BLACKJACK_BUTTONS.STAND,
        type: 'BUTTON',
        disabled: isDisabled,
      },
      {
        style: 'SECONDARY',
        label: i18n.t('blackjack.btnDoubleDown'),
        customId: BLACKJACK_BUTTONS.DOUBLE_DOWN,
        type: 'BUTTON',
        disabled: isDisabled || !this.player.canDoubleDown,
      },
      {
        style: 'DANGER',
        label: i18n.t('blackjack.btnEndGame'),
        customId: BLACKJACK_BUTTONS.END_GAME,
        type: 'BUTTON',
        disabled: isDisabled,
      },
    ];
    return {
      type: 'ACTION_ROW',
      components: buttons,
    };
  }
}

export default Blackjack;
