import _ = require('lodash');
import {
  Card, CardConfig, CardSuit, CardValue,
} from '../../structures';

class BlackjackCard extends Card {
  static generateDeck() : BlackjackCard[] {
    const cards : BlackjackCard[] = [];
    const suits : CardSuit[] = ['♠️', '♣️', '♦️', '❤️'];
    const values : CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    for (const value of values) {
      for (const suit of suits) {
        let gameValue;

        if (['J', 'Q', 'K'].includes(value)) {
          gameValue = 10;
        } else if (value === 'A') {
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

  private _gameValue : number;

  get gameValue() : number {
    return this._gameValue;
  }

  constructor(config: CardConfig, gameValue: number) {
    super(config);

    this._gameValue = gameValue;
  }
}

export default BlackjackCard;
