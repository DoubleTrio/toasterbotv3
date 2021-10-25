import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
  MessageEmbedOptions,
  EmbedFieldData,
  MessageReaction,
  WebhookEditMessageOptions,
  Collection,
  GuildMember,
  CollectorFilter,
  User,
} from 'discord.js';
import i18n from 'i18next';
import { EMOJI_TO_ALPHANUMERIC } from '../../constants';
import { addReactions } from '../../helpers';
import { Game, ToasterBot, UserOption } from '../../structures';
import { Board } from '../../types';
import { AcceptEmbed } from '../../utils';
import Connect4Player from './Connect4Player';

const CONNECT4_TOKENS = ['⚫', '🔴', '🔵'];

const CONNECT4_REACTIONS = [
  '1⃣',
  '2⃣',
  '3⃣',
  '4⃣',
  '5⃣',
  '6⃣',
  '7⃣',
  '8⃣',
  '9⃣',
];

const MAX = 1023;

class Connect4 extends Game {
  private board : Board<number>;

  private challenger: UserOption;

  private isChallengeAccepted : boolean;

  private playerData = new Collection<number, Connect4Player>();

  private reactions : string[];

  private rowToWin = 4;

  private message: Message;

  private turn = 1;

  constructor(client: ToasterBot, interaction: CommandInteraction) {
    super(client, interaction, { timeLimit: 60000 });
  }

  protected async play() : Promise<void | Message | APIMessage> {
    this.challenger = this.getUserValue('challenger');
    if (this.challenger.user.bot) {
      return this.interaction.followUp(i18n.t('game.cannotChallengeBot'));
    }

    if (this.challenger.user.id === this.interaction.user.id) {
      return this.interaction.followUp(i18n.t('game.cannotChallengeYourself'));
    }

    await this.initialize();
    if (this.isChallengeAccepted) {
      addReactions(this.message, this.reactions);
      const firstPlayer = this.playerData.get(1);
      const firstPlayerMessage = i18n.t('connect4.turnMessage', {
        token: CONNECT4_TOKENS[firstPlayer.playerId],
        player: firstPlayer,
      });
      await this.renderEmbed(firstPlayerMessage);

      while (this.turn < MAX) {
        const currentPlayer = this.player(this.turn + 1);
        const nextPlayer = this.player(this.turn);
        this.turn += 1;
        await this.awaitDropTile(currentPlayer, nextPlayer);
        if (this.hasEnded) {
          return;
        }
      }
    } else {
      return this.interaction.followUp({
        content: i18n.t('game.declineMessage', {
          player: this.playerData.get(2),
        }),
      });
    }
  }

  protected async initialize() : Promise<void> {
    const width = this.getOptionValue<number>('width') ?? 7;
    const height = this.getOptionValue<number>('height') ?? 6;
    this.board = Game.generateBoard<number>({
      width,
      height,
      map: () => 0,
    });
    this.setPlayers();

    const title = i18n.t('game.challengeMessage', {
      player: this.playerData.get(1),
      otherPlayer: this.playerData.get(2),
      gameName: i18n.t('connect4.name'),
    });

    this.isChallengeAccepted = await new AcceptEmbed(
      this.interaction,
      {
        color: this.client.colors.primary,
        title,
      },
    ).awaitResponse(this.challenger.user.id);
    this.reactions = CONNECT4_REACTIONS.slice(0, width);
    this.message = await this.interaction.fetchReply() as Message;
  }

  private checkWin(board: Board<number>, value: number, column: number) : boolean {
    const isWinningStreak = (
      numArr: number[],
      rowToWin: number,
      value: number,
    ) => {
      let max = 0;
      let counter = 0;
      for (const num of numArr) {
        if (num === value) {
          counter += 1;
          max = Math.max(max, counter);
        } else {
          counter = 0;
        }
      }
      return max >= rowToWin;
    };

    const areaToWin = this.rowToWin - 1;
    let row: number;
    for (let r = 0; r < board.length; r++) {
      if (board[r][column]) {
        row = r;
        break;
      }
    }
    const winStreaks: number[][] = [[], [], [], []];
    for (let i = areaToWin * -1; i < this.rowToWin; i++) {
      // Vertical
      winStreaks[0].push((board[row + i] || [])[column] || 0);

      // Horizontal
      winStreaks[1].push((board[row] || [])[column + i] || 0);

      // Left Diagonal
      winStreaks[2].push((board[row + i] || [])[column + i] || 0);

      // Right Disgonal
      winStreaks[3].push((board[row + i] || [])[column - i] || 0);
    }

    return winStreaks.some((numArr) => isWinningStreak(numArr, this.rowToWin, value));
  }

  private player(turn: number) : Connect4Player {
    return this.playerData.get(
      (turn % this.playerData.size) + 1,
    );
  }

  private renderEmbed(info = '') {
    const fields: EmbedFieldData[] = [
      {
        name: i18n.t('game.detailsText'),
        value: this.stringifyBoard(info),
      },
    ];

    const titleText = i18n.t('connect4.name');
    const turnText = i18n.t('game.turn', {
      turn: `${this.turn}`,
    });

    const title = `**${titleText} | ${turnText}**`;
    const embedData : MessageEmbedOptions = {
      color: this.client.colors.secondary,
      title,
      fields,
      footer: {
        text: i18n.t('timeLimitText', {
          timeLimit: this.timeLimit / 1000,
        }),
      },
      timestamp: Date.now(),
    };

    const payload : WebhookEditMessageOptions = {
      embeds: [embedData],
      components: [],
    };

    return this.interaction.editReply(payload);
  }

  private stringifyBoard(info = '') : string {
    let boardString = '';
    for (let row = 0; row < this.board.length; row++) {
      for (let col = 0; col < this.board[row].length; col++) {
        const val = this.board[row][col];
        boardString += `${CONNECT4_TOKENS[val]}`;
      }
      boardString += '\n';
    }
    boardString += `\n${info}`;
    return boardString;
  }

  private async awaitDropTile(player : Connect4Player, nextPlayer : Connect4Player) : Promise<void> {
    const filter: CollectorFilter<[MessageReaction, User]> = (reaction: MessageReaction, user: User) => {
      const isPlayer = user.id === player.user.id;
      const isBot = user.bot;
      const isValid = this.reactions.includes(reaction.emoji.name) && !isBot && isPlayer;
      return isValid;
    };

    const collector = this.message.createReactionCollector(
      {
        dispose: true,
        filter,
        max: 1,
        time: this.timeLimit,
      },
    );

    return new Promise((resolve) => {
      const onReaction = (reaction: MessageReaction) => {
        const { name } = reaction.emoji;
        const column = (EMOJI_TO_ALPHANUMERIC[name] as number) - 1;
        this.dropTile(player.playerId, column);

        if (this.isColumnFull(column)) {
          const index = this.reactions.indexOf(name);
          this.reactions.splice(index, 1);
        }

        if (this.checkWin(this.board, player.playerId, column)) {
          this.hasEnded = true;
          const winMessage = i18n.t('connect4.winMessage', {
            token: CONNECT4_TOKENS[player.playerId],
            player,
          });

          this.renderEmbed(winMessage);
        } else {
          const nextPlayerMessage = i18n.t('connect4.turnMessage', {
            token: CONNECT4_TOKENS[nextPlayer.playerId],
            player: nextPlayer,
          });
          this.renderEmbed(nextPlayerMessage);
        }

        return resolve();
      };

      collector.on('collect', (reaction) => {
        onReaction(reaction);
      });

      collector.on('dispose', (reaction) => {
        onReaction(reaction);
      });

      collector.on('end', (reactions) => {
        if (!reactions.size) {
          this.hasEnded = true;
          this.renderEmbed(i18n.t('game.inactivityMessage', {
            gameName: 'connect4.name',
          }));
          resolve();
        }
      });
    });
  }

  private dropTile(val: number, column: number) : void {
    const size = this.board.length - 1;
    for (let i = size; i >= 0; i--) {
      if (!this.board[i][column]) {
        this.board[i][column] = val;
        break;
      }
    }
  }

  private setPlayers() : void {
    this.playerData.set(
      1,
      new Connect4Player(
        this.interaction.user,
        {
          playerId: 1,
          nickname: (this.interaction.member as GuildMember).nickname,
        },
      ),
    );
    this.playerData.set(
      2,
      new Connect4Player(
        this.challenger.user,
        {
          playerId: 2,
          nickname: this.challenger.member.nickname,
        },
      ),
    );
  }

  private isColumnFull = (column: number): boolean => {
    if (this.board[0][column]) {
      return true;
    }
    return false;
  };
}

export default Connect4;
