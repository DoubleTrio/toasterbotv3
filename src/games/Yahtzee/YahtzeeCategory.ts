import { Distribution } from './types';

type RollEval = (distribution: Distribution) => number;

interface YahtzeeCategoryConfig {
  rollEval: RollEval
  name: string;
}

class YahtzeeCategory {
  readonly name : string;

  private rollEval : RollEval;

  private _isMarked = false;

  private _value = 0;

  get isMarked() : boolean {
    return this._isMarked;
  }

  get value() : number {
    return this._value;
  }

  constructor(config: YahtzeeCategoryConfig) {
    this.name = config.name;
    this.rollEval = config.rollEval;
  }

  public mark(distribution: Distribution) : void {
    this._isMarked = true;
    this._value = this.getDisplayValue(distribution);
  }

  public getDisplayValue(distribution: Distribution) : number {
    return this.rollEval(distribution);
  }
}

export default YahtzeeCategory;
