import { Collection, User } from 'discord.js';
import { Command } from '..';
import { SubCommand } from '../../utils';

interface CooldownData {
  command: Command | SubCommand;
  timeLeft: number;
}

class CooldownHandler {
  public cooldowns = new Collection<string, Collection<string, number>>();

  public getCooldownData(commandBase : Command | SubCommand, user: User) : CooldownData | null {
    const { name } = commandBase;
    if (!this.cooldowns.has(name)) {
      this.cooldowns.set(name, new Collection());
    }
    const now = Date.now();
    const timestamps = this.cooldowns.get(name);
    const cooldownAmount = commandBase.cooldown;
    if (timestamps?.has(user.id)) {
      const cooldown = timestamps.get(user.id);
      if (cooldown) {
        const expirationTime = cooldown + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return {
            command: commandBase,
            timeLeft,
          };
        }
      }
    }
    timestamps?.set(user.id, now);
    setTimeout(() => timestamps?.delete(user.id), cooldownAmount);
    return null;
  }
}

export default CooldownHandler;
