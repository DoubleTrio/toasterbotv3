import { APIMessage } from 'discord-api-types';
import {
  CollectorFilter,
  Message,
  EmbedField,
  MessageEmbed,
  MessageButtonOptions,
  MessageActionRowOptions,
  ButtonInteraction,
  InteractionCollectorOptions,
} from 'discord.js';
import _ = require('lodash');
import i18n from 'i18next';
import { ALL_WORDS, COMMON_WORDS, WORDNIK_WORDS } from '../constants';
import { Game, GameConfig } from '../structures';

type MastermindDifficulty = 'COMMON' | 'WORDNIK' | 'ALL';

interface MastermindGuess {
  bulls: number;
  cows: number;
  word: string;
}

function calculateMaxTurns(wordLength: number) {
  if (wordLength > 5) {
    return 20;
  } if (wordLength === 5) {
    return 15;
  } if (wordLength === 4) {
    return 11;
  } if (wordLength === 3) {
    return 8;
  }
  throw new Error('Out of word length');
}

function selectSecretWord(wordList: string[], length : number) {
  return _.sample(wordList.filter((word) => word.length === length));
}

class Mastermind extends Game {
  private difficulty: MastermindDifficulty;

  private guesses: MastermindGuess[] = [];

  private maxTurns: number;

  private secretWord: string;

  private secretWordLength: number;

  private turn = 0;

  constructor(config : GameConfig) {
    super(config, { timeLimit: 360 * 1000 });
  }

  protected async play(): Promise<void | Message | APIMessage> {
    await this.initialize();
    while (!this.terminal()) {
      this.turn += 1;
      this.renderEmbed(
        this.turn === 1
          ? i18n.t('mastermind.reminderText', { length: this.secretWordLength })
          : '',
      );
      await this.awaitWord();
      if (this.hasEnded) {
        return;
      }
    }
  }

  private terminal() {
    return this.turn === this.maxTurns;
  }

  protected async initialize(): Promise<void> {
    this.difficulty = this.getOptionValue<string>('difficulty') as MastermindDifficulty ?? 'COMMON';
    this.secretWordLength = this.getOptionValue<number>('length') ?? 5;
    this.maxTurns = this.getOptionValue<number>('turns') ?? calculateMaxTurns(this.secretWordLength);
    switch (this.difficulty) {
      case 'COMMON':
        this.secretWord = selectSecretWord(COMMON_WORDS, this.secretWordLength);
        break;
      case 'WORDNIK':
        this.secretWord = selectSecretWord(WORDNIK_WORDS, this.secretWordLength);
        break;
      case 'ALL':
        this.secretWord = selectSecretWord(ALL_WORDS, this.secretWordLength);
        break;
      default:
        throw new Error('Mastermind word difficulty not found');
    }
    console.log(this.secretWord);
  }

  private renderEmbed(info?: string) {
    const guessFields: EmbedField[] = this.guesses.map((guess, index) => {
      const { bulls, cows, word } = guess;
      const value = i18n.t('mastermind.guessInfo', {
        bulls,
        cows,
        word,
      });
      return {
        name: i18n.t('game.turn', {
          turn: index + 1,
        }),
        value,
        inline: true,
      };
    });

    const fields: EmbedField[] = [...guessFields, {
      name: i18n.t('game.logs'),
      value: info || '** **',
      inline: false,
    }];

    const timeLimitText = i18n.t('timeLimitText', {
      timeLimit: this.timeLimit / 1000,
    });

    const turnText = i18n.t('game.turn', {
      turn: `${this.turn}/${this.maxTurns}`,
    });

    const data: MessageEmbed = new MessageEmbed({
      title: turnText,
      color: this.client.colors.primary,
      fields,
      footer: {
        text: timeLimitText,
        iconURL: this.interaction.user.avatarURL(),
      },
      timestamp: Date.now(),
    });

    return this.interaction.editReply({ embeds: [data], components: [this.createQuitActionRow()] });
  }

  private async awaitWord(): Promise<void> {
    const filter: CollectorFilter<[Message]> = (m: Message): boolean => {
      const { content } = m;
      const isAuthor = m.author.id === this.interaction.user.id;
      const regex = /^[A-Za-z]+$/;
      const isOnlyLetters = regex.test(content);
      return isAuthor && isOnlyLetters;
    };

    const messageCollector = this.interaction.channel.createMessageCollector({
      filter,
      time: this.timeLimit,
    });

    const buttonOptions: InteractionCollectorOptions<ButtonInteraction> = {
      time: this.timeLimit,
      filter: (btnInteraction: ButtonInteraction) => this.interaction.user.id
        === btnInteraction.user.id,
      componentType: 'BUTTON',
      max: 1,
    };

    const buttonCollector = this.interaction.channel.createMessageComponentCollector(
      buttonOptions,
    );

    return new Promise((resolve) => {
      let flag = false;
      let hasQuitted = false;

      buttonCollector.on('collect', (btnInteraction: ButtonInteraction) => {
        btnInteraction.deferUpdate();
      });

      buttonCollector.on('end', (collected) => {
        if (collected.size) {
          hasQuitted = true;
          this.hasEnded = true;
          this.renderEmbed(i18n.t('mastermind.giveUpMessage', {
            word: this.secretWord,
          }));
          messageCollector.stop();
          return resolve();
        }
      });

      messageCollector.on('collect', (message: Message) => {
        messageCollector.resetTimer();
        buttonCollector.resetTimer();
        const content = message.content.toLowerCase();
        const warningMessage = this.getWarningMessage(content);

        if (!warningMessage) {
          flag = true;
          messageCollector.stop();
          buttonCollector.stop();
          resolve();
          if (this.isSecretWord(content)) {
            this.hasEnded = true;
            const winText = i18n.t('mastermind.winMessage', {
              word: this.secretWord,
            });
            this.renderEmbed(winText);
          } else {
            const [bulls, cows] = this.calculateBullsAndCows(content);
            this.guesses.push({
              bulls,
              cows,
              word: content,
            });
            if (this.turn === this.maxTurns) {
              this.hasEnded = true;
              const gameOverText = i18n.t('mastermind.gameOverMessage', {
                word: this.secretWord,
              });
              this.renderEmbed(gameOverText);
            }
          }
        } else {
          this.renderEmbed(warningMessage);
        }
      });

      messageCollector.on('end', () => {
        if (!flag && !hasQuitted) {
          this.hasEnded = true;
          this.renderEmbed(this.inactivityMessage);
        }
        resolve();
      });
    });
  }

  private calculateBullsAndCows(userWord: string): [number, number] {
    let bulls = 0;
    let cows = 0;
    let remainingLetters: string = userWord;
    let remainingLettersFromSecretWord = '';
    for (let i = 0; i < this.secretWord.length; i++) {
      if (userWord[i] === this.secretWord[i]) {
        remainingLetters = remainingLetters.replace(userWord[i], '');
        bulls++;
      } else {
        remainingLettersFromSecretWord += this.secretWord[i];
      }
    }

    [...remainingLettersFromSecretWord].forEach((letter) => {
      if (remainingLetters.includes(letter)) {
        cows++;
        remainingLetters = remainingLetters.replace(letter, '');
      }
    });

    return [bulls, cows];
  }

  private getWarningMessage(userWord: string): string {
    let warning = '';
    const isShorter = userWord.length < this.secretWordLength;
    if (isShorter) {
      warning = i18n.t('mastermind.warningTooShort');
      return warning;
    }

    const isLonger = userWord.length > this.secretWordLength;
    if (isLonger) {
      warning = i18n.t('mastermind.warningTooLong');
      return warning;
    }
    const isInDictionary = ALL_WORDS.includes(userWord);
    if (!isInDictionary) {
      warning = i18n.t('mastermind.warningNotInDictionary');
      return warning;
    }
    return warning;
  }

  private isSecretWord(userWord: string): boolean {
    return userWord === this.secretWord;
  }

  private createQuitActionRow(): MessageActionRowOptions {
    const buttons: MessageButtonOptions[] = [
      {
        style: 'DANGER',
        label: i18n.t('game.giveUp'),
        customId: 'GIVE_UP',
        type: 'BUTTON',
        disabled: this.turn - 1 === this.maxTurns || this.hasEnded,
      },
    ];
    return {
      type: 'ACTION_ROW',
      components: buttons,
    };
  }
}

export default Mastermind;
