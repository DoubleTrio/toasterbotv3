class Point<T> {
  private _row : number;

  private _column: number;

  public value : T;

  get row() : number {
    return this._row;
  }

  get column() : number {
    return this._column;
  }

  constructor(row : number, column : number, value: T) {
    this._row = row;
    this._column = column;
    this.value = value;
  }

  public isEqual(point : Point<T>) : boolean {
    return point.column === this._column && point.row === this._row;
  }
}

export default Point;
