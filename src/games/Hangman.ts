import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction, CollectorFilter, Message, AwaitMessagesOptions, MessageEmbedOptions,
} from 'discord.js';
import _ = require('lodash');
import i18n from 'i18next';
import axios from 'axios';
import {
  ALL_WORDS, AlphanumericKey, ALPHANUMERIC_TO_EMOJI, COMMON_WORDS,
} from '../constants';
import { Game, ToasterBot } from '../structures';

type HangmanDifficulty = 'COMMON' | 'WORDNIK' | 'ALL';

interface WordnikRandomWordResponse {
  canonicalForm?: string,
  id: number,
  originalWord?: string,
  suggestions?: string[],
  vulgar?: string,
  word: string,
}

class Hangman extends Game {
  private axios = axios.create({
    baseURL: 'https://api.wordnik.com/v4',
  });

  private difficulty : HangmanDifficulty;

  private lettersGuessed : AlphanumericKey[] = [];

  private lives : number;

  private secretWord: string;

  constructor(client: ToasterBot, interaction: CommandInteraction) {
    super(client, interaction, { timeLimit: 30 * 1000 });
  }

  protected async play() : Promise<void | Message | APIMessage> {
    await this.initialize();
    if (this.hasEnded) {
      return;
    }
    while (!this.terminal()) {
      this.renderEmbed();
      await this.awaitUserLetter();
      if (this.hasEnded) {
        return;
      }
    }
  }

  protected async initialize() : Promise<void> {
    this.lives = this.getOptionValue<number>('lives') ?? 8;
    this.difficulty = this.getOptionValue<string>('difficulty') as HangmanDifficulty || 'COMMON';
    const max = this.getOptionValue<number>('max') ?? 63;
    const min = this.getOptionValue<number>('min') ?? 0;

    if (min && max && min > max) {
      this.hasEnded = true;
      this.interaction.followUp('hangman.unboundLengthWarning');
      return;
    }

    switch (this.difficulty) {
      case 'COMMON': {
        this.secretWord = _.sample(COMMON_WORDS.filter((word) => word.length >= min && word.length <= max));
        break;
      }
      case 'WORDNIK': {
        const params = {
          api_key: process.env.WORDNIK_TOKEN,
          maxLength: max,
          minLength: min,
        };
        const { data } = await this.axios.get<WordnikRandomWordResponse>('/words.json/randomWord', {
          params,
        });
        this.secretWord = data.word.toLowerCase();
        break;
      }
      case 'ALL': {
        this.secretWord = _.sample(ALL_WORDS.filter((word) => word.length >= min && word.length <= max));
        break;
      }
      default:
        throw new Error('Undefined hangman difficulty');
    }

    console.log(this.secretWord);
  }

  private terminal() {
    return (
      this.isGameOver()
      || this.isSecretWordGuessed()
    );
  }

  private isGameOver() {
    return this.lives <= 0;
  }

  private renderEmbed(info?: string) {
    const livesString = `${i18n.t('hangman.lives', {
      lives: this.lives,
    })}\n`;

    const lettersGuessedString = this.lettersGuessed.length
      ? `\`${this.lettersGuessed.join(' ')}\n` + '`'
      : '';
    const displayLine = `\n${this.getDisplay()}`;
    const fields = [
      {
        name: i18n.t('game.detailsText'),
        value: livesString,
      },
      {
        name: i18n.t('hangman.lettersGuessed'),
        value: lettersGuessedString + displayLine,
      },
    ];

    let data: MessageEmbedOptions = {
      fields,
      color: this.embedColor,
      footer: {
        text: i18n.t('timeLimitText', {
          timeLimit: this.timeLimit / 1000,
        }),
        iconURL: this.interaction.user.avatarURL(),                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
      },
      timestamp: Date.now(),
    };

    if (info) {
      data = {
        ...data,
        title: info,
      };
    }

    if (this.interaction.replied) {
      return this.interaction.editReply({ embeds: [data] });
    }
    return this.interaction.followUp({ embeds: [data] });
  }

  private getDisplay() : string {
    const display = [];
    const symbols = [' ', ',', '\'', '-', '+'];
    for (const letter of this.secretWord) {
      if (letter === ' ') {
        display.push('➖ ');
      } else if (symbols.includes(letter)) {
        display.push(`${letter} `);
      } else {
        display.push(
          this.lettersGuessed.includes(letter as AlphanumericKey)
            ? `${ALPHANUMERIC_TO_EMOJI[letter.toLowerCase() as AlphanumericKey]} `
            : '🔵 ',
        );
      }
    }
    return display.join('');
  }

  private async awaitUserLetter() : Promise<void> {
    const filter : CollectorFilter<Message[]> = (m: Message): boolean => {
      const { content } = m;
      const isAuthor = m.author.id === this.interaction.user.id && !m.author.bot;
      const regex = /^[A-Za-z]+$/;
      const isOnlyLetters = regex.test(content.trim());
      const isSingleLength = content.length === 1;
      return isAuthor && isOnlyLetters && isSingleLength;
    };

    const options: AwaitMessagesOptions = {
      time: this.timeLimit,
      filter,
    };

    const collector = this.interaction.channel.createMessageCollector(options);

    return new Promise((resolve) => {
      let flag = false;
      collector.on('collect', (message) => {
        this.embedColor = this.client.colors.primary;
        const letter = message.content.toLowerCase();
        if (this.isValidInput(letter)) {
          this.lettersGuessed.push(letter);
          if (!this.letterInSecretWord(letter)) {
            this.embedColor = this.client.colors.error;
            this.lives -= 1;
            if (this.isGameOver()) {
              const gameOverMessage = i18n.t('hangman.gameOverMessage', {
                word: this.secretWord,
              });
              this.renderEmbed(gameOverMessage);
            }
          } else {
            this.embedColor = this.client.colors.success;
            if (this.isSecretWordGuessed()) {
              const winMessage = i18n.t('hangman.winMessage', {
                word: this.secretWord,
              });
              this.renderEmbed(winMessage);
            }
          }
          flag = true;
          collector.stop();
          resolve();
        } else {
          this.setEmbedColor(this.client.colors.error);
          this.renderEmbed(i18n.t('hangman.alreadyGuessedLetterMessage'));
        }
      });

      collector.on('end', () => {
        if (!flag) {
          this.hasEnded = true;
          this.embedColor = this.client.colors.warning;
          const inactivityMessage = i18n.t('game.inactivityMessage', {
            gameName: i18n.t('hangman.name'),
          });
          this.renderEmbed(inactivityMessage);
        }
        resolve();
      });
    });
  }

  private letterInSecretWord(letter: AlphanumericKey) : boolean {
    return [...this.secretWord].includes(letter as string);
  }

  private isValidInput(letter: AlphanumericKey): boolean {
    return !this.lettersGuessed.includes(letter);
  }

  private isSecretWordGuessed(): boolean {
    const symbols = [' ', ',', '\'', '-', '+'];
    return (
      [...this.secretWord].filter(
        (letter) => this.lettersGuessed.includes(letter as AlphanumericKey) || symbols.includes(letter),
      ).length === this.secretWord.length
    );
  }
}

export default Hangman;
