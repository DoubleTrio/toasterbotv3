import { User } from 'discord.js';

interface PlayerConfig {
  nickname?: string;
  playerId?: number;
}

abstract class Player {
  readonly user: User;

  readonly playerId: number;

  readonly nickname?: string;

  constructor(user: User, config: PlayerConfig) {
    this.user = user;
    this.playerId = config.playerId || null;
    this.nickname = config.nickname || user.username;
  }
}

export { PlayerConfig, Player };
