import Point from './Point';

class ExplorePoint<T> extends Point<T> {
  private _explored = false;

  get explored() : boolean {
    return this._explored;
  }

  constructor(row : number, column : number, value: T) {
    super(row, column, value);
  }

  public setExplored() : void {
    this._explored = true;
  }
}

export default ExplorePoint;
