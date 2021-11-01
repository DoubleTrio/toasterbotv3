import {
  MessageButtonOptions,
  MessageActionRowOptions,
  MessageEmbedOptions,
  ButtonInteraction,
  CommandInteraction,
  Collection,
  GuildMember,
  Message,
  User,
} from 'discord.js';
import i18n from 'i18next';
import { ExtendedUser, ToasterBot } from '../structures';
import { CooldownHandler } from '../structures/handlers';

interface MultiplayerEmbedConfig {
  title?: string;
  timeLimit?: number;
  min: number;
  max: number;
}

interface SubCommand {
  cooldown : number;
  name : string;
  aliases?: string[];
  execute : (message : Message, arg: unknown[]) => void;
  description: string;
  args: string
}

type MultiplayerButtonCommands = 'JOIN' | 'LEAVE' | 'START' | 'END';

class MultiplayerEmbed {
  readonly interaction: CommandInteraction;

  readonly client : ToasterBot;

  public players: Collection<string, ExtendedUser> = new Collection();

  private cooldownHandler = new CooldownHandler();

  private commands = new Collection<string, SubCommand>();

  private endText = i18n.t('game.multiplayerEmbed.btnEndGameText');

  private startText = i18n.t('game.multiplayerEmbed.btnStartGameText');

  private joinText = i18n.t('game.multiplayerEmbed.btnJoinText');

  private leaveText = i18n.t('game.multiplayerEmbed.btnLeaveText');

  private embedOptions: MessageEmbedOptions;

  private kickedUsers: string[] = [];

  private max : number;

  private min : number;

  private timeLimit: number;

  constructor(
    client : ToasterBot,
    interaction: CommandInteraction,
    embedOptions: MessageEmbedOptions,
    options: MultiplayerEmbedConfig = {
      min: 2,
      max: 4,
    },
  ) {
    this.client = client;
    this.embedOptions = embedOptions;
    this.interaction = interaction;
    this.max = options.max;
    this.min = options.min;
    this.timeLimit = options.timeLimit || 120 * 1000;
  }

  private isHost(id : string) : boolean {
    return id === this.interaction.user.id;
  }

  private canStart() : boolean {
    return this.players.size >= this.min && this.players.size <= this.max;
  }

  private willOverMaxPlayers() {
    return this.players.size + 1 > this.max;
  }

  private renderEmbed(info = '** **') : void {
    const embed: MessageEmbedOptions = {
      ...this.embedOptions,
      fields: [
        {
          name: i18n.t('game.multiplayerEmbed.minPlayers'),
          value: this.min.toString(),
          inline: true,
        },
        {
          name: i18n.t('game.multiplayerEmbed.maxPlayers'),
          value: this.max.toString(),
          inline: true,
        },
        {
          name: i18n.t('game.multiplayerEmbed.canBegin'),
          value: this.canStart() ? `✅ ${this.interaction.user.toString()}` : '❌',
          inline: true,
        },
        {
          name: i18n.t('game.multiplayerEmbed.currentPlayers', {
            total: this.players.size,
          }),
          value: this.players.map((player) => {
            const isHost = this.isHost(player.user.id);
            return `➼ \`${player.nickname}#${player.user.discriminator}\` ${isHost ? '👑' : ''}`;
          }).join('\n'),
          inline: false,
        },
        {
          name: i18n.t('game.multiplayerEmbed.hostCommands', {
            prefix: this.client.prefix,
          }),
          value: this.commands.map((cmd) => {
            const aliases = cmd.aliases.map((a) => `\`${a}\``).join(' ');
            const aliasesText = i18n.t('game.multiplayerEmbed.aliases', {
              aliasesText: aliases,
            });
            const commandText = i18n.t('game.multiplayerEmbed.commandFormat', {
              cmd,
            });
            return `${commandText}\n${aliasesText}\n`;
          }).join('\n'),
          inline: false,
        },
        {
          name: `**${i18n.t('game.logs')}**`,
          value: info,
        },
      ],
      footer: {
        iconURL: this.interaction.user.avatarURL(),
        text: i18n.t('paginatedEmbedFooter', {
          timeLimit: this.timeLimit / 1000,
          user: this.interaction.user,
        }),
      },
    };

    this.interaction.editReply({
      embeds: [embed],
      components: [this.component()],
    });
  }

  private initCommands() : void {
    const commandList : SubCommand[] = [
      {
        name: 'invite',
        cooldown: 10000,
        aliases: ['inv', 'add'],
        description: i18n.t('game.multiplayerEmbed.commands.invite.description'),
        args: i18n.t('game.multiplayerEmbed.commands.userArg'),
        execute: (message) : void => {
          const user = message.mentions.users.first();
          if (this.willOverMaxPlayers()) {
            const failMessage = i18n.t('game.multiplayerEmbed.commands.invite.onFail', {
              user: ExtendedUser.formatUser(user),
            });
            return this.renderEmbed(failMessage);
          }
          const invited = this.invite(user);
          if (invited) {
            const successMessage = i18n.t('game.multiplayerEmbed.commands.invite.onSuccess', {
              user: ExtendedUser.formatUser(user),
            });
            return this.renderEmbed(successMessage);
          }
        },
      },
      {
        name: 'kick',
        cooldown: 10000,
        aliases: ['k', 'remove', 'blacklist'],
        description: i18n.t('game.multiplayerEmbed.commands.kick.description'),
        args: i18n.t('game.multiplayerEmbed.commands.userArg'),
        execute: (message) : void => {
          const user = message.mentions.users.first();
          const kicked = this.kick(user.id, true);
          if (kicked) {
            const successMessage = i18n.t('game.multiplayerEmbed.commands.kick.onSuccess', {
              user: ExtendedUser.formatUser(user),
            });
            return this.renderEmbed(successMessage);
          }
        },
      },
      {
        name: 'unkick',
        cooldown: 10000,
        aliases: ['uk', 'whitelist'],
        description: i18n.t('game.multiplayerEmbed.commands.unkick.description'),
        args: i18n.t('game.multiplayerEmbed.commands.userArg'),
        execute: (message) : void => {
          const user = message.mentions.users.first();
          const unkicked = this.unkick(user);
          if (unkicked) {
            const successMessage = i18n.t('game.multiplayerEmbed.commands.unkick.onSuccess', {
              user: ExtendedUser.formatUser(user),
            });
            return this.renderEmbed(successMessage);
          }
        },
      },
    ];

    const commands = new Collection<string, SubCommand>();

    commandList.forEach((command) => {
      commands.set(command.name, command);
    });

    this.commands = commands;
  }

  private onMessage(message : Message) {
    const content = message.content.trim();
    const { prefix } = this.client;
    if (!content.startsWith(prefix)) return;

    const commandArgs = content.slice(prefix.length).trim().split(/ +/);
    const commandName: string = commandArgs.shift();

    if (!commandName) return;

    const command = this.commands.get(commandName)
      || this.commands.find((cmd : SubCommand) => cmd.aliases.includes(commandName));
    if (command) {
      const cooldownData = this.cooldownHandler.getCooldownData(command, message.member.user);
      if (cooldownData) {
        this.renderEmbed(i18n.t('commandOnCooldown', {
          timeLeft: cooldownData.timeLeft.toFixed(1),
          command,
        }));
        return;
      }
      command.execute(message, commandArgs);
    }
  }

  public awaitResponse() : Promise<boolean> {
    this.players.set(
      this.interaction.user.id,
      ExtendedUser.fromMember(this.interaction.user, this.interaction.member as GuildMember),
    );

    this.initCommands();
    this.renderEmbed();

    const buttonFilter = (btnInteraction: ButtonInteraction) => !this.kickedUsers.includes(
      btnInteraction.user.id,
    ) && !btnInteraction.user.bot;

    const messageFilter = (message : Message) => message.member.id === this.interaction.user.id;

    return new Promise((resolve) => {
      const buttonCollector = this.interaction.channel.createMessageComponentCollector(
        {
          filter: buttonFilter,
          time: this.timeLimit,
        },
      );

      const messageCollector = this.interaction.channel.createMessageCollector(
        {
          filter: messageFilter,
          time: this.timeLimit,
        },
      );

      const stop = (outcome : boolean) => {
        resolve(outcome);
        buttonCollector.stop();
        messageCollector.stop();
      };

      messageCollector.on('collect', (message : Message) => {
        this.onMessage(message);
      });

      buttonCollector.on('collect', (btnInteraction: ButtonInteraction) => {
        btnInteraction.deferUpdate();
        const userId = btnInteraction.user.id;
        const customId = btnInteraction.customId as MultiplayerButtonCommands;

        switch (customId) {
          case 'JOIN': {
            if (!this.players.get(userId) && !this.willOverMaxPlayers()) {
              this.players.set(userId, ExtendedUser.fromMember(btnInteraction.user, btnInteraction.member as GuildMember));
              const joinMessage = i18n.t('game.multiplayerEmbed.btnCommandOnJoin', {
                user: ExtendedUser.formatUser(btnInteraction.user),
              });
              this.renderEmbed(joinMessage);
            }
            break;
          }

          case 'LEAVE': {
            if (this.players.get(userId) && !this.isHost(userId)) {
              this.kick(userId);
              const leaveMessage = i18n.t('game.multiplayerEmbed.btnCommandOnLeave', {
                user: ExtendedUser.formatUser(btnInteraction.user),
              });
              this.renderEmbed(leaveMessage);
            }
            break;
          }

          case 'START': {
            if (this.isHost(userId) && this.canStart()) {
              stop(true);
            }
            break;
          }
          case 'END': {
            if (this.isHost(userId)) {
              const endMessage = i18n.t('game.multiplayerEmbed.btnCommandOnEnd', {
                nickname: this.players.get(this.interaction.user.id).nickname,
                gameName: i18n.t(`${this.interaction.commandName}.name`),
              });
              this.renderEmbed(endMessage);
              stop(false);
            }
            break;
          }

          default: {
            stop(false);
          }
        }
      });

      buttonCollector.on('end', () => {
        stop(false);
      });
    });
  }

  private invite(user : User) : boolean {
    if (user.bot) return;
    const n = this.players.size;
    const member = this.interaction.guild.members.cache.get(user.id);
    this.players.set(user.id, ExtendedUser.fromMember(user, member));
    return n !== this.players.size;
  }

  private kick(userId : string, kicked = false) : boolean {
    if (this.players.get(userId) && !this.isHost(userId)) {
      this.players.delete(userId);
      if (kicked) {
        this.kickedUsers.push(userId);
        return true;
      }
    }

    return false;
  }

  private unkick(user : User) : boolean {
    if (user.bot) return;
    const n = this.kickedUsers.length;
    this.kickedUsers = this.kickedUsers.filter((userId) => user.id !== userId);
    return n !== this.kickedUsers.length;
  }

  private component() {
    const buttons: MessageButtonOptions[] = [
      {
        style: 'SUCCESS',
        label: this.joinText,
        customId: 'JOIN',
        type: 'BUTTON',
      },
      {
        style: 'DANGER',
        label: this.leaveText,
        customId: 'LEAVE',
        type: 'BUTTON',
      },
      {
        style: 'SECONDARY',
        label: this.startText,
        customId: 'START',
        type: 'BUTTON',
        disabled: !this.canStart(),
      },
      {
        style: 'SECONDARY',
        label: this.endText,
        customId: 'END',
        type: 'BUTTON',
      },
    ];

    const actionComponent: MessageActionRowOptions = {
      components: buttons,
      type: 'ACTION_ROW',
    };

    return actionComponent;
  }
}

export { MultiplayerEmbed, SubCommand };
