import { User } from 'discord.js';
import { Player, PlayerConfig } from '../../structures';

class Connect4Player extends Player {
  constructor(user: User, config: PlayerConfig) {
    super(user, config);
  }
}

export default Connect4Player;
