import { ExtendedUser, Player, PlayerConfig } from '../../structures';

class ScrabblePlayer extends Player {
  private _score = 0;

  private _word? : string = null;

  private _gain? : number = null;

  constructor(user: ExtendedUser, config: PlayerConfig) {
    super(user, config);
  }

  get score() : number {
    return this._score;
  }

  get word() : string {
    return this._word;
  }

  get gain() : number {
    return this._gain;
  }

  public addScore(word: string, value: number) : void {
    this._gain = value;
    this._score += value;
    this._word = word;
  }

  public deselect() : void {
    this._word = null;
    this._gain = null;
  }
}

export default ScrabblePlayer;
