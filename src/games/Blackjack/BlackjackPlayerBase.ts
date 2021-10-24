import BlackjackCard from "./BlackjackCard";

function calculateHand(cards : BlackjackCard[]) {
  let sum = 0;
	let aces = cards.filter((card) => card.value === 'A').length;
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

	public addCard(card : BlackjackCard) : void {
		this.hand.push(card);
		this._handValue = calculateHand(this.hand);
	}

	public getDisplay(hideLast = true) : string {
		const { length } = this.hand;
		return this.hand.map((card, index) => {
			if (hideLast && index == length - 1) {
				return '**??**';
			}
			return card.display;
		}).join(', ');
	}

	public restart() : void {
		this.hand = [];
		this._handValue = 0;
	}
}

export default BlackjackPlayerBase;