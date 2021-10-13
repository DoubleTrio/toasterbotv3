import _ = require('lodash');
import { ALL_WORDS, ALPHANUMERIC_TO_EMOJI } from '../../constants';

interface Distribution {
  [key: string]: number;
}

const LETTER_DISTRIBUTION = 'aaaaaaaaabbccddddeeeeeeeeeeeeffggghhiiiiiiiiijkllllmmnnnnnnooooooooppqrrrrrrssssttttttuuuuvvwwxyyz!!'.split(
  '',
);
interface ScrabbleValues {
  [key: string]: number;
}

const LETTER_VALUES : ScrabbleValues = {
  a: 1,
  b: 3,
  c: 3,
  d: 2,
  e: 1,
  f: 4,
  g: 2,
  h: 4,
  i: 1,
  j: 8,
  k: 5,
  l: 1,
  m: 3,
  n: 1,
  o: 1,
  p: 3,
  q: 10,
  r: 1,
  s: 1,
  t: 1,
  u: 1,
  v: 4,
  w: 4,
  x: 8,
  y: 4,
  z: 10,
  '!': 0,
} as const;

class ScrabbleLetterSystem {
  private distribution : Distribution;

  private start = 0;

  private end : number;

  private lettersPerRound : number;

  private roundLetters : string[];

  private shouldSortLetters : boolean;

  private shuffledLetters : string[];

  public calculateWordScore(word: string) : number {
    let score = 0;
    for (const letter of word) {
      score += LETTER_VALUES[letter];
    }

    score *= word.length;
    if (word.length === this.lettersPerRound) {
      score += 50;
    }
    return score;
  }

  constructor(lettersPerRound : number, shouldSortLetters : boolean) {
    this.lettersPerRound = lettersPerRound;
    this.shouldSortLetters = shouldSortLetters;
    this.initialize();
  }

  public isValidWord(word: string) : boolean {
    const distribution = _.cloneDeep(this.distribution);
    const keys = Object.keys(distribution);
    for (const letter of word) {
      if (keys.includes(letter)) {
        if (distribution[letter] === 0 && keys.includes('!')) {
          distribution['!'] -= 1;
        } else {
          distribution[letter] -= 1;
        }
      } else if (keys.includes('!')) {
        distribution['!'] -= 1;
      } else {
        return false;
      }
    }

    const isLettersInDistribution = !Object.values(distribution).some(
      (letterVal) => letterVal < 0,
    );

    return isLettersInDistribution && ALL_WORDS.includes(word);
  }

  private initialize() : void {
    this.end = this.lettersPerRound - 1;
    this.shuffledLetters = _.shuffle(LETTER_DISTRIBUTION);
    this.getNextLetters();
  }

  public getNextLetters() : void {
    this.roundLetters = this.shuffledLetters.slice(this.start, this.end);
    if (this.shouldSortLetters) {
      this.roundLetters.sort();
    }
    this.start += this.lettersPerRound;
    this.end += this.lettersPerRound;
    this.getDistribution();
  }

  public getLettersDisplay() : string {
    return this.roundLetters
      .map((letter) => (letter === '!' ? '🟨' : ALPHANUMERIC_TO_EMOJI[letter]))
      .join('  ');
  }

  private getDistribution() : void {
    this.distribution = this.roundLetters.reduce((unique, letter) => {
      const isDuplicateLetter = Object.keys(unique).includes(letter);
      return {
        ...unique,
        [letter]: isDuplicateLetter ? (unique[letter] += 1) : 1,
      };
    }, {} as Distribution);
  }
}

export default ScrabbleLetterSystem;
