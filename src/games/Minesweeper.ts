import { APIMessage } from 'discord-api-types';
import {
  ButtonInteraction,
  InteractionCollectorOptions,
  Message,
  MessageActionRowOptions,
  MessageButtonOptions,
  MessageEmbedOptions,
} from 'discord.js';
import _ = require('lodash');
import i18n from 'i18next';
import { ALPHANUMERIC_TO_EMOJI } from '../constants';
import { Game, GameConfig } from '../structures';
import { Board } from '../types';

const MINEWEEPER_BUTTONS = {
  SAFE: 'SAFE',
  MINE: 'MINE',
  GIVE_UP: 'GIVE_UP',
  REFRESH_TIMER: 'REFRESH_TIMER',
} as const;

type MinesweeperButton = keyof typeof MINEWEEPER_BUTTONS;

type Positions = Array<[number, number]>;

interface Explored {
  [key: string]: boolean
}

function createMinesweeperActionRow(disabled = false) : MessageActionRowOptions {
  const buttons : MessageButtonOptions[] = [
    {
      style: 'SUCCESS',
      label: i18n.t('minesweeper.btnRevealSafe'),
      customId: MINEWEEPER_BUTTONS.SAFE,
      type: 'BUTTON',
      disabled,
    },
    {
      style: 'PRIMARY',
      label: i18n.t('minesweeper.btnRevealMine'),
      customId: MINEWEEPER_BUTTONS.MINE,
      type: 'BUTTON',
      disabled,
    },
    {
      style: 'DANGER',
      label: i18n.t('game.giveUp'),
      customId: MINEWEEPER_BUTTONS.GIVE_UP,
      type: 'BUTTON',
      disabled,
    },
    {
      style: 'SECONDARY',
      label: i18n.t('minesweeper.btnRefreshTimer'),
      customId: MINEWEEPER_BUTTONS.REFRESH_TIMER,
      type: 'BUTTON',
      disabled,
    },
  ];
  return {
    type: 'ACTION_ROW',
    components: buttons,
  };
}

class Minesweeper extends Game {
  private board : Board<number>;

  private minePositions : Positions = [];

  private safePositions : Positions = [];

  private shouldReveal : boolean;

  private revealedPositions : Positions;

  private logsMessage : Message;

  constructor(config : GameConfig) {
    super(config, { timeLimit: 180 * 1000 });
  }

  protected async play(): Promise<void | Message | APIMessage> {
    await this.initialize();
    if (this.hasEnded) {
      return;
    }
    return this.awaitMinesweeperGame();
  }

  protected async initialize(): Promise<void> {
    this.shouldReveal = this.getOptionValue<boolean>('reveal') ?? true;
    const width = this.getOptionValue<number>('width') ?? 8;
    const height = this.getOptionValue<number>('height') ?? 8;
    const mines = this.getOptionValue<number>('mines') ?? 13;

    if (width * height <= mines) {
      this.interaction.followUp(i18n.t('minesweeper.tooManyMines'));
      this.hasEnded = true;
      return;
    }

    if (mines <= 0) {
      this.interaction.followUp(i18n.t('minesweeper.tooLittleMines'));
      this.hasEnded = true;
      return;
    }

    this.board = Game.generateBoard(
      {
        width,
        height,
        map: () => 0,
      },
    );

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        this.safePositions.push([i, j]);
      }
    }

    this.safePositions = _.shuffle(this.safePositions);

    for (let i = 0; i < mines; i += 1) {
      const minePos = this.safePositions.pop();
      const column = minePos[0];
      const width = minePos[1];
      this.board[column][width] = -1;
      this.minePositions.push([column, width]);
    }

    for (let x = 0; x < this.board.length; x++) {
      for (let y = 0; y < this.board[x].length; y++) {
        if (this.board[x][y] === -1) continue;

        const tl = (this.board[x - 1] || [])[y + 1];
        const tm = (this.board[x] || [])[y + 1];
        const tr = (this.board[x + 1] || [])[y + 1];

        const ml = (this.board[x - 1] || [])[y];
        const mr = (this.board[x + 1] || [])[y];

        const bl = (this.board[x - 1] || [])[y - 1];
        const bm = (this.board[x] || [])[y - 1];
        const br = (this.board[x + 1] || [])[y - 1];

        const around = [tl, tm, tr, ml, mr, bl, bm, br];
        const count = around.reduce((acc: number, curr: number) => {
          if (curr === -1) {
            acc++;
          }
          return acc;
        }, 0);

        this.board[x][y] = count;
      }
    }

    const generationText = i18n.t('minesweeper.generationText', {
      height,
      width,
      mines,
    });

    this.revealedPositions = this.findLargestSafeRegion();

    for (const pos of this.revealedPositions) {
      for (let i = 0; i < this.safePositions.length; i++) {
        const safe = this.safePositions[i];
        if (safe != null && safe[0] === pos[0] && safe[1] === pos[1]) {
          this.safePositions[i] = null;
        }
      }
    }

    this.safePositions = this.safePositions.filter((pos) => pos !== null);

    await this.renderBoard(true);
    this.logsMessage = await this.renderEmbed(generationText) as Message;
  }

  private renderEmbed(message = '** **') : Promise<APIMessage | Message> {
    const embed : MessageEmbedOptions = {
      color: this.client.colors.primary,
      fields: [
        {
          name: `**${i18n.t('game.logs')}**`,
          value: message,
        },
      ],
      footer: {
        text: i18n.t('timeLimitText', {
          timeLimit: this.timeLimit / 1000,
          iconURL: this.interaction.user.avatarURL(),
        }),
      },
      timestamp: Date.now(),
    };

    if (this.logsMessage) {
      return this.logsMessage.edit({
        embeds: [embed],
        components: [createMinesweeperActionRow(this.hasEnded)],
      });
    }

    return this.interaction.channel.send(
      {
        embeds: [embed],
        components: [createMinesweeperActionRow(this.hasEnded)],
      },
    );
  }

  private async renderBoard(withSpoiler = true) : Promise<APIMessage | Message> {
    let stringBoard = '';
    for (let row = 0; row < this.board.length; row += 1) {
      for (let column = 0; column < this.board[0].length; column += 1) {
        const value = this.board[row][column];
        const char = value === -1 ? '💣' : ALPHANUMERIC_TO_EMOJI[value];
        if (withSpoiler && (!this.shouldReveal || !this.inRevealed(row, column))) {
          stringBoard += `||${char}||`;
        } else {
          stringBoard += char;
        }
      }
      stringBoard += '\n';
    }

    const embed : MessageEmbedOptions = {
      color: this.client.colors.secondary,
      fields: [
        {
          name: `**${i18n.t('minesweeper.name')}**`,
          value: stringBoard,
        },
      ],
      footer: {
        text: i18n.t('timeLimitText', {
          timeLimit: this.timeLimit / 1000,
          iconURL: this.interaction.user.avatarURL(),
        }),
      },

      timestamp: Date.now(),
    };

    return this.interaction.editReply({
      embeds: [embed],
    });
  }

  private async awaitMinesweeperGame() : Promise<void> {
    const buttonOptions : InteractionCollectorOptions<ButtonInteraction> = {
      time: this.timeLimit,
      filter: (btnInteraction: ButtonInteraction) => this.interaction.user.id === btnInteraction.user.id && btnInteraction.message.id === this.logsMessage.id,

      componentType: 'BUTTON',
    };

    const buttonCollector = this.interaction.channel.createMessageComponentCollector(
      buttonOptions,
    );

    return new Promise((resolve) => {
      buttonCollector.on('end', (collected) => {
        if (!collected.size) {
          this.hasEnded = true;
          return resolve();
        }
      });

      buttonCollector.on('collect', async (btnInteraction) => {
        btnInteraction.deferUpdate();
        buttonCollector.resetTimer();
        switch (btnInteraction.customId as MinesweeperButton) {
          case 'SAFE': {
            if (this.safePositions.length) {
              const safePosition = this.safePositions.pop();
              const onSafeRevealMessage = i18n.t('minesweeper.onSafeReveal', {
                row: safePosition[0] + 1,
                column: safePosition[1] + 1,
              });

              this.renderEmbed(onSafeRevealMessage);
            }
            break;
          }

          case 'MINE': {
            if (this.minePositions.length) {
              const minePosition = this.minePositions.pop();
              const onMineRevealMessage = i18n.t('minesweeper.onMineReveal', {
                row: minePosition[0] + 1,
                column: minePosition[1] + 1,
              });

              this.renderEmbed(onMineRevealMessage);
            }
            break;
          }

          case 'GIVE_UP': {
            this.hasEnded = true;
            this.renderEmbed(i18n.t('minesweeper.onGiveUp'));
            this.renderBoard(false);
            buttonCollector.stop();
            break;
          }

          case 'REFRESH_TIMER': {
            this.renderEmbed(i18n.t('minesweeper.onRefreshTimer'));
            break;
          }
        }
      });
    });
  }

  private findLargestSafeRegion() : Positions {
    let bestPositions : Positions = [];
    let localPositions : Positions = [];
    const explored : Explored = {};

    const rows = this.board.length;
    const columns = this.board[0].length;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        if (explored[i.toString() + j] || this.board[i][j] !== 0) {
          continue;
        }

        dfs(this.board, i, j);

        if (bestPositions.length < localPositions.length) {
          bestPositions = _.cloneDeep(localPositions);
        }
        localPositions = [];
      }
    }

    function dfs(board : Board<number>, r : number, c : number) {
      if (explored[r.toString() + c]) {
        return;
      }

      const spaceIsZero = board[r][c] === 0;

      if (spaceIsZero) {
        explored[r.toString() + c] = true;
        localPositions.push([r, c]);
        if (r >= 1) dfs(board, r - 1, c);
        if (r + 1 < rows) dfs(board, r + 1, c);
        if (c >= 1) dfs(board, r, c - 1);
        if (c + 1 < columns) dfs(board, r, c + 1);

        if (r >= 1 && c >= 1) dfs(board, r - 1, c - 1);
        if (r >= 1 && c + 1 < columns) dfs(board, r - 1, c + 1);
        if (r + 1 < rows && c >= 1) dfs(board, r + 1, c - 1);
        if (r + 1 < rows && c + 1 < columns) dfs(board, r + 1, c + 1);
      } else {
        localPositions.push([r, c]);
      }
    }

    return bestPositions;
  }

  private inRevealed(row : number, column : number) {
    for (const pos of this.revealedPositions) {
      if (pos[0] == row && pos[1] === column) {
        return true;
      }
    }
  }
}

export default Minesweeper;
