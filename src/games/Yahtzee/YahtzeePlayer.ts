import { YahtzeeScoreSheet } from './YahtzeeScoreSheet';

type RerollOptions = {
  [key: number]: boolean
};

class YahtzeePlayer {
  private _diceToReroll : RerollOptions = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  };

  public refreshRerolls() : void {
    this._diceToReroll = {
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
    };
  }

  public keepRoll(value : number) : void {
    this._diceToReroll[value] = true;
  }

  public getRerollList() : Array<number> {
    const rerollKeys = Object.keys(this._diceToReroll);
    const rerollList = rerollKeys.filter((key) => {
      const shouldReroll = this._diceToReroll[parseInt(key)] === false;
      return shouldReroll;
    }).map(Number);
    return rerollList;
  }

  get canReroll() : boolean {
    return this.scoreSheet.rerolls > 0;
  }

  public scoreSheet: YahtzeeScoreSheet = new YahtzeeScoreSheet();
}

export default YahtzeePlayer;
