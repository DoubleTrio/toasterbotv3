type CardValue = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

type CardSuit = '♠️' | '♣️' | '♦️' | '❤️';

type CardColor = 'B' | 'R';

interface CardConfig {
	value: CardValue,
	suit: CardSuit,
	display: string,
}

class Card {
	private _value : CardValue;
	private _suit : CardSuit;
	private _display : string;
	private _color : CardColor;

	get value() : CardValue {
		return this._value;
	}

	get suit() : CardSuit {
		return this._suit;
	}

	get display() : string {
		return this._display;
	}

	get color() : CardColor {
		return this._color;
	}

	constructor(config: CardConfig) {
		this._value = config.value;
		this._suit = config.suit;
		this._display = config.display;
		this._color = ['♠️', '♣️'].includes(this._suit) ? 'B' : 'R';
	}
}

export { Card, CardValue, CardSuit, CardColor, CardConfig };