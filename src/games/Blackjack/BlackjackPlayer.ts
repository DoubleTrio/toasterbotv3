import BlackjackPlayerBase from "./BlackjackPlayerBase";

class BlackjackPlayer extends BlackjackPlayerBase {

  private _bet : number;

  private _minBet : number;
  
  private _money : number;

  get minBet() : number {
    return this._minBet;
  }

  get money() : number {
    return this._money;
  }

  get bet() : number {
    return this._bet;
  }

  get canBet() : boolean {
    return this._money >= this._minBet;
  }

  get canDoubleDown() : boolean {
    return this._bet * 2 <= this._money;
  }

  constructor(startingMoney : number, minBet : number) {
    super();
    this._money = startingMoney;
    this._minBet = minBet;
  }

  public win() : void {
    this._money += this._bet;
  }

  public lose() : void {
    this._money -= this._bet;
  }

  public isValidBet(bet : number) : boolean {
    return bet <= this._money && bet >= this._minBet;
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

export default BlackjackPlayer;