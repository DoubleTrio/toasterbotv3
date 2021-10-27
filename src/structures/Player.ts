import { ExtendedUser } from '.';

interface PlayerConfig {
  nickname?: string;
  playerId?: number;
}

abstract class Player {
  readonly extendedUser: ExtendedUser;

  readonly playerId: number;

  readonly nickname?: string;

  constructor(user: ExtendedUser, config: PlayerConfig) {
    this.extendedUser = user;
    this.playerId = config.playerId || null;
  }
}

export { PlayerConfig, Player };
