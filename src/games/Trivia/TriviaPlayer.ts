import { User } from 'discord.js';
import { Player } from '../../structures';
import { TriviaLetter } from './types';

class TriviaPlayer extends Player {
  private _answer? : TriviaLetter = null;

  private _score = 0;

  get answer() : TriviaLetter {
    return this._answer;
  }

  get score() : number {
    return this._score;
  }

  constructor(user: User) {
    super(user, {});
  }

  public earnPoints(points: number) : void {
    this._score += points;
  }

  public setAnswer(answer: TriviaLetter) : void {
    this._answer = answer;
  }

  public removeAnswer() : void {
    this._answer = null;
  }
}

export default TriviaPlayer;
