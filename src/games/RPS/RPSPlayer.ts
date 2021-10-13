import { User } from 'discord.js';
import i18n from 'i18next';
import { Player, PlayerConfig } from '../../structures';
import { RPSChoice, RPS_MATCHUPS } from './types';

class RPSPlayer extends Player {
  private _wins = 0;

  private _choice?: RPSChoice = null;

  get wins() : number {
    return this._wins;
  }

  get choice() : RPSChoice {
    return this._choice;
  }

  constructor(user: User, config: PlayerConfig) {
    super(user, config);
  }

  public select(rpsChoice: RPSChoice) : void {
    this._choice = rpsChoice;
  }

  public deselect() : void {
    this._choice = null;
  }

  public win() : void {
    this._wins += 1;
  }

  public winRoundMessage(other: RPSPlayer) : string {
    const action = RPS_MATCHUPS[this.choice].wins.get(other.choice);
    return i18n.t('rps.playerWinRoundMessage', {
      player: this,
      playerChoice: this.choice.toLowerCase(),
      action,
      other,
      otherChoice: other.choice.toLowerCase(),
    });
  }

  public winGameMessage(otherPlayer: RPSPlayer) : string {
    return `${i18n.t('rps.playerWinMessage', { player: this })}\n\n${this.winRoundMessage(otherPlayer)}`;
  }

  public hasWon(requiredWins: number) : boolean {
    return this.wins === requiredWins;
  }
}

export default RPSPlayer;
