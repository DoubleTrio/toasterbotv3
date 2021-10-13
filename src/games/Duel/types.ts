import DuelPlayer from './DuelPlayer';

const DUEL_CHOICES = {
  GUN: {
    emoji: '🔫',
    label: 'Gun',
    id: 'GUN',
  },
  SWORD: {
    emoji: '⚔️',
    label: 'Sword',
    id: 'SWORD',
  },
  SPELL: {
    emoji: '✨',
    label: 'Spell',
    id: 'SPELL',
  },
  SHIELD: {
    emoji: '🛡️',
    label: 'Shield',
    id: 'SHIELD',
  },
  MIRROR: {
    emoji: '🪞',
    label: 'Mirror',
    id: 'MIRROR',
  },
} as const;

type DuelChoice = keyof typeof DUEL_CHOICES;

interface WeaponConfig {
  speed: number,
  hasToReload: boolean,
}

abstract class Item {
  readonly id: DuelChoice;

  constructor(id: DuelChoice) {
    this.id = id;
  }

  static getEmoji(choice: DuelChoice) : string {
    return DUEL_CHOICES[choice].emoji;
  }

  static getId(choice: DuelChoice) : string {
    return DUEL_CHOICES[choice].id;
  }

  static getLabel(choice: DuelChoice) : string {
    return DUEL_CHOICES[choice].label;
  }
}

abstract class Weapon extends Item {
  readonly speed : number;

  readonly hasToReload : boolean;

  constructor(id: DuelChoice, config: WeaponConfig) {
    super(id);
    this.speed = config.speed;
    this.hasToReload = config.hasToReload;
  }

  // abstract attack(other: DuelPlayer) : unknown;
}

class Gun extends Weapon {
  constructor() {
    super('GUN', { speed: 3, hasToReload: true });
  }
}

class Sword extends Weapon {
  constructor() {
    super('SWORD', { speed: 2, hasToReload: false });
  }
}

class Spell extends Weapon {
  constructor() {
    super('SPELL', { speed: 1, hasToReload: false });
  }
}

interface ProtectionConfig {
  reflects: DuelChoice[];
  defends: DuelChoice[];
  destroyedBy: DuelChoice[];
}

abstract class Protection extends Item {
  readonly reflects: DuelChoice[];

  readonly defends: DuelChoice[];

  readonly destroyedBy: DuelChoice[];

  constructor(id: DuelChoice, config: ProtectionConfig) {
    super(id);
    this.reflects = config.reflects;
    this.defends = config.defends;
    this.destroyedBy = config.destroyedBy;
  }
}

class Shield extends Protection {
  constructor() {
    super('SHIELD', { reflects: [], defends: ['GUN', 'SWORD'], destroyedBy: ['SPELL'] });
  }
}

class Mirror extends Protection {
  constructor() {
    super('MIRROR', { reflects: ['GUN'], defends: ['SPELL'], destroyedBy: ['SWORD'] });
  }
}

export {
  DUEL_CHOICES, DuelChoice, Spell, Sword, Gun, Mirror, Shield, Item, Protection, Weapon,
};
