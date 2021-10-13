import i18n from 'i18next';
import YahtzeeCategory from './YahtzeeCategory';
import { Distribution } from './types';
import { getRandomInt } from '../../helpers';

type DiceNum = 1 | 2 | 3 | 4 | 5 | 6;

interface Categories {
  [key: string]: YahtzeeCategory
}

interface Rolls {
  [key: number]: DiceNum;
}

function countSameRoll(distribution: Distribution, num: number) {
  return (distribution[num] ?? 0) * num;
}

function countStraightLength(distribution: Distribution) {
  let longestLength = 0;
  let local = 1;
  const keys = Object.keys(distribution).map((key) => parseInt(key, 10));
  for (let i = 1; i < keys.length; i += 1) {
    if (keys[i] === keys[i - 1] + 1) {
      local += 1;
    } else {
      local = 1;
    }
    longestLength = Math.max(local, longestLength);
  }
  return longestLength;
}

function sumRolls(distribution: Distribution) {
  let sum = 0;
  Object.entries(distribution).forEach(([roll, total]) => {
    sum += parseInt(roll, 10) * parseInt(total, 10);
  });
  return sum;
}

function isOfKind(distribution: Distribution, n: number) {
  return Object.values(distribution).some((val: number) => val >= n);
}

class YahtzeeScoreSheet {
  private _upperScore = 0;

  private _hasUpperBonus = false;

  private _totalScore = 0;

  private _distribution : Distribution;

  private _rerolls = 3;

  private _rolls : Rolls = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  };

  private _categories : Categories = {
    1: new YahtzeeCategory({
      name: i18n.t('yahtzee.categoryOnes'),
      rollEval: (distribution) => countSameRoll(distribution, 1),
    }),
    2: new YahtzeeCategory({
      name: i18n.t('yahtzee.categoryTwos'),
      rollEval: (distribution) => countSameRoll(distribution, 2),
    }),
    3: new YahtzeeCategory({
      name: i18n.t('yahtzee.categoryThrees'),
      rollEval: (distribution) => countSameRoll(distribution, 3),
    }),
    4: new YahtzeeCategory({
      name: i18n.t('yahtzee.categoryFours'),
      rollEval: (distribution) => countSameRoll(distribution, 4),
    }),
    5: new YahtzeeCategory({
      name: i18n.t('yahtzee.categoryFives'),
      rollEval: (distribution) => countSameRoll(distribution, 5),
    }),
    6: new YahtzeeCategory({
      name: i18n.t('yahtzee.categorySixes'),
      rollEval: (distribution) => countSameRoll(distribution, 6),
    }),
    7: new YahtzeeCategory({
      name: i18n.t('yahtzee.categoryThreeOfAKind'),
      rollEval: (distribution) => (isOfKind(distribution, 3) ? sumRolls(distribution) : 0),
    }),
    8: new YahtzeeCategory({
      name: i18n.t('yahtzee.categoryFourOfAKind'),
      rollEval: (distribution) => (isOfKind(distribution, 4) ? sumRolls(distribution) : 0),
    }),
    9: new YahtzeeCategory({
      name: i18n.t('yahtzee.categoryFullHouse'),
      rollEval: (distribution) => {
        const values = Object.values(distribution);
        if (values.every((val) => ![1, 4, 5].includes(val))) {
          return 25;
        }
        return 0;
      },
    }),
    10: new YahtzeeCategory({
      name: i18n.t('yahtzee.categoryFourOfAKind'),
      rollEval: (distribution: Distribution) => (countStraightLength(distribution) >= 4 ? 30 : 0),
    }),
    11: new YahtzeeCategory({
      name: i18n.t('yahtzee.categoryLargeStraight'),
      rollEval: (distribution: Distribution) => (countStraightLength(distribution) >= 5 ? 40 : 0),
    }),
    12: new YahtzeeCategory({
      name: i18n.t('yahtzee.categoryChance'),
      rollEval: (distribution: Distribution) => sumRolls(distribution),
    }),
    13: new YahtzeeCategory({
      name: i18n.t('yahtzee.name'),
      rollEval: (distribution: Distribution) => (Object.values(distribution)[0] === 5 ? 50 : 0),
    }),
  };

  get upperScore() : number {
    return this._upperScore;
  }

  get hasUpperBonus() : boolean {
    return this._hasUpperBonus;
  }

  get rolls() : Rolls {
    return this._rolls;
  }

  get rerolls() : number {
    return this._rerolls;
  }

  get totalScore() : number {
    return this._totalScore;
  }

  get distribution() : Distribution {
    return this._distribution;
  }

  get categories() : Categories {
    return this._categories;
  }

  private updateDistribution() : void {
    const distribution : Distribution = {};

    Object.values(this._rolls).forEach((num) => {
      distribution[num] = distribution[num] + 1 || 1;
    });
    this._distribution = distribution;
  }

  public selectCategory(categoryId: string) : void {
    const category = this.categories[categoryId];
    category.mark(this.distribution);
    this._totalScore += category.value;
    const parsedCategoryId = parseInt(categoryId, 10);
    if (parsedCategoryId >= 1 && parsedCategoryId <= 6) {
      this._upperScore += category.value;
      if (this._upperScore >= 63 && !this.hasUpperBonus) {
        this._totalScore += 35;
        this._hasUpperBonus = true;
      }
    }
  }

  public rerollAll() : void {
    this.reroll([1, 2, 3, 4, 5]);
  }

  public reroll(selections: number[]) : void {
    this._rerolls -= 1;
    selections.forEach((roll) => {
      this._rolls[roll] = getRandomInt(1, 6) as DiceNum;
    });
    this.updateDistribution();
  }

  public reset() : void {
    this._rerolls = 3;
    this.rerollAll();
  }
}

export { YahtzeeScoreSheet };
