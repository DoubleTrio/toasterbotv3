import { ExtendedUser } from '.';

interface PlayerConfig {
  playerId?: number;
}

abstract class Player {
  readonly extendedUser: ExtendedUser;

  readonly playerId: number;

  constructor(user: ExtendedUser, config: PlayerConfig = {}) {
    this.extendedUser = user;
    this.playerId = config.playerId || null;
  }
}

export { PlayerConfig, Player };
