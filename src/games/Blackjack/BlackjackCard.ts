import { Card, CardConfig } from "../../structures/";

class BlackjackCard extends Card {
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