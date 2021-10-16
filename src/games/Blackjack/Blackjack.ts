import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
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
import _ = require('lodash');
import i18n from 'i18next';
import { Game, ToasterBot, CardSuit, CardValue } from '../../structures';
import BlackjackCard from './BlackjackCard';

type BlackjackButtonAction = 'HIT' | 'STAND' | 'DOUBLE_DOWN' | 'END_GAME';

function generateBlackJackCards() {
	const cards : BlackjackCard[] = [];
	const suits : CardSuit[] = ['♠️', '♣️', '♦️', '❤️'];
	const values : CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
	for (const value of values) {
		for (const suit of suits) {
			let gameValue;

			if (['J', 'Q', 'K'].includes(value)) {
				gameValue = 10;
			} else if ('A' === value) {
				gameValue = 11;
			} else {
				gameValue = Number(value);
			}

			const card = new BlackjackCard({
				value,
				suit,
				display: `**${suit + value}**`,
			}, gameValue);

			cards.push(card);
		}
	}

	return _.shuffle(cards);
} 


function totalAces(cards : BlackjackCard[]) : number {
	return cards.filter((card) => card.value === 'A').length;
}

function calculateHand(cards : BlackjackCard[]) {
	let sum = 0;
	let aces = totalAces(cards);
	for (const card of cards) {
		sum += card.gameValue;
	}

	while (sum > 21 && aces > 0) {
		aces -= 1;
		sum -= 10;
	}

	return sum;
}

class BlackjackPlayerBase {
	private _handValue = 0;

	get handValue() : number {
		return this._handValue;
	}

	get isOver21() : boolean {
		return this._handValue > 21;
	}

	get hasBlackjack() : boolean {
		return this.handValue === 21 && this.hand.length == 2;
	}

	public hand : BlackjackCard[] = [];
	
	public addCard(card : BlackjackCard) {
		this.hand.push(card);
		this._handValue = calculateHand(this.hand);
	}

	public getDisplay(hideLast = true) : string {
		const length = this.hand.length;
		return this.hand.map((card, index) => {
			if (hideLast && index == length - 1) {
				return '**??**'
			}
			return card.display;
		}).join(', ');
	}

	public restart() : void {
		this.hand = [];
		this._handValue = 0;
	}
}


class BlackjackPlayer extends BlackjackPlayerBase {
	private _money : number;
	private _bet : number;

	get money() : number {
		return this._money;
	}

	get bet() : number {
		return this._bet;
	}

	get canBet() : boolean {
		return this._money >= 5;
	}

	get canDoubleDown() : boolean {
		return this._bet * 2 <= this._money;
	}

	constructor(startingMoney : number) {
		super();
		this._money = startingMoney;
	}

	public win() : void {
		this._money += this._bet;
	}

	public lose() : void {
		this._money -= this._bet;
	}

	public isValidBet(bet : number) : boolean {
		return bet <= this._money && bet >= 5;
	}

	public setBet(bet : number) : void {
		this._bet = bet;
	}

	public restart() : void {
		super.restart();
		this._bet = 0;
	}

	public doubleDown() : void {
		this._bet *= 2; 
	}
}

type BlackjackPhase = 'BETTING' | 'PLAYING';

class Blackjack extends Game {

	private phase : BlackjackPhase = 'BETTING';

	private round = 0;

  private rounds: number;

	private reshuffle : number;

	private dealer : BlackjackPlayerBase = new BlackjackPlayerBase();

	private player : BlackjackPlayer;

	private message : Message;

	private cards : BlackjackCard[] = [];

  constructor(client: ToasterBot, interaction: CommandInteraction) {
    super(client, interaction, { timeLimit: 60 * 1000 });
  }

  protected async play(): Promise<void | Message | APIMessage> {
    await this.initialize();
    while (!this.terminal()) {
      this.round += 1;
			if (this.round % this.reshuffle === 0) {
				this.cards = generateBlackJackCards();
			}
			this.phase = 'BETTING'; 
			this.renderBettingEmbed();
			await this.awaitBet();
			
			if (this.hasEnded) {
				return;
			}

			this.dealCards();	
			this.phase = 'PLAYING';

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
					true,
				)
			}

			if (!this.player.canBet) {
				this.hasEnded = true;
				return this.renderEmbed(i18n.t('blackjack.canNoLongerBet', {
					amount: this.player.money,
				}),
					true,
				)
			}

			this.player.restart();
			this.dealer.restart();
    }
  }

  private terminal() {
    return this.round === this.rounds;
  }

  protected async initialize(): Promise<void> {
    this.rounds = this.getOptionValue<number>('rounds') || 5;
		this.reshuffle = this.getOptionValue<number>('reshuffle') || 3;
		const money = this.getOptionValue<number>('money') || 100;

		this.message = await this.interaction.fetchReply() as Message;
		this.player = new BlackjackPlayer(money);
		this.cards = generateBlackJackCards();
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
				name: i18n.t('game.logs'),
				value: info,
				inline: false,
			}
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
			}
		}

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
				value: i18n.t('blackjack.money', {
					amount: this.player.bet,
				}),
				inline: false,
			},
			{
				name: i18n.t('game.logs'),
				value: info || '** **',
				inline: false,
			}
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
        } else {
					if (bet < 5) {
						this.renderBettingEmbed(i18n.t('blackjack.betTooLow', {
							min: 5,
						}));
					} else {
						this.renderBettingEmbed(i18n.t('blackjack.betTooHigh', {
							max: this.player.money,
						}));
					}
        }
      });

      collector.on('end', () => {
        if (!flag) {
          this.hasEnded = true;
          this.embedColor = this.client.colors.warning;
          const inactivityMessage = i18n.t('game.inactivityMessage', {
            gameName: i18n.t('blackjack.name'),
          });
          this.renderBettingEmbed(inactivityMessage);
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
      filter: (btnInteraction: ButtonInteraction) => 
				this.interaction.user.id === btnInteraction.user.id && 
				btnInteraction.message.id === this.message.id,

      componentType: 'BUTTON',
    };

    const buttonCollector = this.interaction.channel.createMessageComponentCollector(
      buttonOptions,
    );

    return new Promise((resolve) => {

			const stand = () : void => {
				while (this.dealer.handValue < 16) {
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
				} else {
					if (this.player.hasBlackjack && this.dealer.hasBlackjack) {
						this.renderEmbed(i18n.t('blackjack.onDraw'), true);
					} else if (this.player.hasBlackjack) {
						this.renderEmbed(i18n.t('blackjack.onPlayerBlackjackWin'));	
					} else if (this.dealer.hasBlackjack) {
						this.renderEmbed(i18n.t('blackjack.onDealerBlackjackWin'));	
					} else {
						this.renderEmbed(i18n.t('blackjack.onDraw'), true);
					}
				}
				buttonCollector.stop();
				resolve();
			}
			
			const onLose = () => {
				this.player.lose();
				this.renderEmbed(i18n.t('blackjack.onPlayerHitBust'), true);
				resolve();
				buttonCollector.stop();
			}
			
      buttonCollector.on('end', (collected) => {
        if (!collected.size) {
          this.hasEnded = true;
          return resolve();
        }
      });

      buttonCollector.on('collect', async (btnInteraction) => {
        btnInteraction.deferUpdate();
        buttonCollector.resetTimer();
        switch (btnInteraction.customId as BlackjackButtonAction) {
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
						resolve();
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
        customId: 'HIT',
        type: 'BUTTON',
        disabled: isDisabled,
      },
      {
        style: 'PRIMARY',
        label: i18n.t('blackjack.btnStand'),
        customId: 'STAND',
        type: 'BUTTON',
				disabled: isDisabled,
      },
			{
        style: 'SECONDARY',
        label: i18n.t('blackjack.btnDoubleDown'),
        customId: 'DOUBLE_DOWN',
        type: 'BUTTON',
				disabled: isDisabled || !this.player.canDoubleDown,
      },
			{
        style: 'DANGER',
        label: i18n.t('blackjack.btnEndGame'),
        customId: 'END_GAME',
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
