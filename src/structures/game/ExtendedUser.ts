import { GuildMember, User } from 'discord.js';

class ExtendedUser {
  readonly user : User;

  readonly nickname : string;

  static fromMember(user : User, member : GuildMember) : ExtendedUser {
    const { nickname } = member;
    return new this(user, nickname);
  }

  static formatUser(user: User) : string {
    return `${user.username}#${user.discriminator}`;
  }

  constructor(user : User, nickname : string) {
    this.user = user;
    this.nickname = nickname ?? user.username;
  }

  public formatUser() : string {
    return `${this.nickname}#${this.user.discriminator}`;
  }
}

export default ExtendedUser;
