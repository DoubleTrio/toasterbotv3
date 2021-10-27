import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
  MessageEmbedOptions,
  EmbedFieldData,
  MessageReaction,
  WebhookEditMessageOptions,
  CollectorFilter,
  User,
} from 'discord.js';
import i18n from 'i18next';
import { EMOJI_TO_ALPHANUMERIC } from '../../constants';
import { addReactions } from '../../helpers';
import { Game, ToasterBot, ExtendedUser } from '../../structures';
import { Board } from '../../types';

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

  private reactions : string[];

  private rowToWin = 4;

  private message: Message;

  private turn = 1;

  constructor(client: ToasterBot, interaction: CommandInteraction) {
    super(client, interaction, { timeLimit: 60000 });
  }

  protected async play() : Promise<void | Message | APIMessage> {
    await this.initialize();
    addReactions(this.message, this.reactions);
    const firstPlayer = this.players.get(1);
    const firstPlayerMessage = i18n.t('connect4.turnMessage', {
      token: CONNECT4_TOKENS[(this.turn % 2)],
      player: firstPlayer,
    });
    await this.renderEmbed(firstPlayerMessage);

    while (this.turn < MAX) {
      const currentPlayer = this.player(this.turn + 1);
      const nextPlayer = this.player(this.turn);
      this.turn += 1;
      await this.awaitDropTile(currentPlayer, nextPlayer);
      if (this.hasEnded) return;
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

  private player(turn: number) : ExtendedUser {
    return this.players.get(
      (turn % this.players.size) + 1,
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

  private async awaitDropTile(player : ExtendedUser, nextPlayer : ExtendedUser) : Promise<void> {
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
      const playerId = (this.turn % this.players.size) + 1;
      const nextPlayerId = ((this.turn + 1) % this.players.size) + 1;
      const onReaction = (reaction: MessageReaction) => {
        const { name } = reaction.emoji;
        const column = (EMOJI_TO_ALPHANUMERIC[name] as number) - 1;
        this.dropTile(playerId, column);

        if (this.isColumnFull(column)) {
          const index = this.reactions.indexOf(name);
          this.reactions.splice(index, 1);
        }

        if (this.checkWin(this.board, playerId, column)) {
          this.hasEnded = true;
          const winMessage = i18n.t('connect4.winMessage', {
            token: CONNECT4_TOKENS[playerId],
            player,
          });

          this.renderEmbed(winMessage);
        } else {
          const nextPlayerMessage = i18n.t('connect4.turnMessage', {
            token: CONNECT4_TOKENS[nextPlayerId],
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
            gameName: i18n.t('connect4.name'),
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

  private isColumnFull = (column: number): boolean => {
    if (this.board[0][column]) {
      return true;
    }
    return false;
  };
}

export default Connect4;
