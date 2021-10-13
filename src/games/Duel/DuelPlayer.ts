import { User } from 'discord.js';
import { Player, PlayerConfig } from '../../structures';
import {
  DuelChoice, DUEL_CHOICES, Gun, Mirror, Protection, Shield, Spell, Sword, Weapon,
} from './types';

interface DuelPlayerConfig {
  swords: number,
  spells: number,
}

function itemFactory(choice: DuelChoice) : Weapon | Protection {
  switch (choice) {
    case 'GUN':
      return new Gun();
    case 'SWORD':
      return new Sword();
    case 'SPELL':
      return new Spell();
    case 'SHIELD':
      return new Shield();
    default:
      return new Mirror();
  }
}

class DuelPlayer extends Player {
  private _wins = 0;

  private _choice?: DuelChoice = null;

  private _protection?: Protection;

  private _weapon? : Weapon;

  private _reloaded = false;

  private _hasAmmo = false;

  private _swords : number;

  private _spells : number;

  private _shields = 3;

  private _mirrors = 3;

  private _config : DuelPlayerConfig;

  get wins() : number {
    return this._wins;
  }

  get choice() : DuelChoice {
    return this._choice;
  }

  get reloaded() : boolean {
    return this._reloaded;
  }

  get swords() : number {
    return this._swords;
  }

  get spells() : number {
    return this._spells;
  }

  get shields() : number {
    return this._shields;
  }

  get mirrors() : number {
    return this._mirrors;
  }

  get weapon() : Weapon {
    return this._weapon;
  }

  get protection() : Protection {
    return this._protection;
  }

  get hasWeapon() : boolean {
    return this._weapon !== null;
  }

  get hasProtection() : boolean {
    return this._protection !== null;
  }

  get hasAmmo() : boolean {
    return this._hasAmmo;
  }

  constructor(user: User, config: PlayerConfig, gameConfig: DuelPlayerConfig) {
    super(user, config);
    this._config = gameConfig;
    this._swords = gameConfig.swords;
    this._spells = gameConfig.spells;
  }

  public select(duelChoice: DuelChoice) : void {
    this.deselect();
    this._choice = duelChoice;
  }

  private assignChoice(duelChoice: DuelChoice) {
    const weaponsLists : DuelChoice[] = ['GUN', 'SWORD', 'SPELL'];
    if (weaponsLists.includes(duelChoice)) {
      const weapon = itemFactory(duelChoice) as Weapon;
      this.assignWeapon(weapon);
    } else {
      const protection = itemFactory(duelChoice) as Protection;
      this.assignProtection(protection);
    }
  }

  public confirmChoice() : void {
    this.assignChoice(this._choice);
    switch (this._choice) {
      case 'GUN':
        if (!this.hasAmmo) {
          this._hasAmmo = true;
          this._reloaded = true;
        } else {
          this._hasAmmo = false;
        }
        break;
      case 'SWORD':
        this._swords -= 1;
        break;
      case 'SPELL':
        this._spells -= 1;
        break;
      case 'SHIELD':
        this._shields -= 1;
        break;
      case 'MIRROR':
        this._mirrors -= 1;
    }
  }

  public deselect() : void {
    this._choice = null;
    this._weapon = null;
    this._protection = null;
    this._reloaded = false;
  }

  public win() : void {
    this._wins += 1;
  }

  public winRoundMessage(other: DuelPlayer) : string {
    // const text = DUEL_CHOICES[this.choice];
    // return `**${this.nickname}'s** ${this.choice.toLowerCase()} ${text} **${other.nickname}'s** ${other.choice.toLowerCase()}`;
    return '';
  }

  public winGameMessage(otherPlayer: DuelPlayer) : string {
    // return `**${this.nickname}** has masterfully won RPS!\n\n${this.winRoundMessage(otherPlayer)}`;
    return '';
  }

  public hasWon(requiredWins: number) : boolean {
    return this.wins === requiredWins;
  }

  public reload() : void {
    this._reloaded = true;
  }

  public shoot() : void {
    this._reloaded = false;
  }

  public restart() : void {
    this.deselect();
    this._reloaded = false;
    this._spells = this._config.spells;
    this._swords = this._config.swords;
    this._shields = 3;
    this._spells = 3;
    this._hasAmmo = false;
  }

  private assignWeapon(weapon: Weapon) : void {
    this._weapon = weapon;
  }

  private assignProtection(protection: Protection) : void {
    this._protection = protection;
  }
}

export default DuelPlayer;
