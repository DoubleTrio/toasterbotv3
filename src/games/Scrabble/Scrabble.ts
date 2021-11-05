import { APIMessage } from 'discord-api-types';
import {
  CollectorFilter,
  Message,
  MessageEmbedOptions,
  Collection,
  User,
  EmbedFieldData,
} from 'discord.js';
import i18n from 'i18next';
import { ExtendedUser, Game, GameConfig } from '../../structures';
import ScrabblePlayer from './ScrabblePlayer';
import ScrabbleLetterSystem from './ScrabbleLetterSystem';

interface UniqueMessages {
  [key: string]: {
    content: string;
    nickname: string;
    author: User;
  };
}

interface RoundHistory {
  score: number;
  word: string;
  display: string;
}

type ScrabbleMode = 'SOLO' | 'MULTIPLAYER';

class Scrabble extends Game {
  private intermediateTime : number;

  private isSoloMode : boolean;

  private round = 0;

  private roundHistory : RoundHistory[] = [];

  private playerData = new Collection<string, ScrabblePlayer>();

  private scrabbleLetterSystem : ScrabbleLetterSystem;

  private totalRounds: number;

  constructor(config : GameConfig) {
    super(config, { timeLimit: 30 * 1000 });
  }

  protected async play(): Promise<void | Message | APIMessage> {
    await this.initialize();
    while (!this.terminal()) {
      this.round += 1;
      this.renderLettersEmbed();
      await this.awaitRound();
      if (this.hasEnded) {
        return;
      }
      this.updateRoundHistory();
      this.renderStandingsEmbed();
      if (this.terminal()) {
        await Game.sleep(this.intermediateTime);
        this.renderAllLettersEmbed();
        this.renderEndMessage();
        return;
      }
      this.restartRound();
      await Game.sleep(this.intermediateTime);
    }
  }

  private terminal() {
    return this.round === this.totalRounds;
  }

  protected async initialize(): Promise<void> {
    const lettersPerRound = this.getOptionValue<number>('letters') ?? 10;
    const shouldSortLetters = this.getOptionValue<boolean>('sort') ?? false;
    this.isSoloMode = (this.getOptionValue<string>('mode') as ScrabbleMode ?? 'SOLO') === 'SOLO';
    this.timeLimit = this.getOptionValue<number>('time') ?? 30 * 1000;
    this.totalRounds = this.getOptionValue<number>('rounds') ?? 10;
    this.intermediateTime = this.getOptionValue<number>('intermediate') ?? this.isSoloMode ? 1 * 1000 : 5 * 1000;

    this.scrabbleLetterSystem = new ScrabbleLetterSystem(lettersPerRound, shouldSortLetters);
  }

  private restartRound() : void {
    this.playerData.forEach((player) => {
      player.deselect();
    });
    this.scrabbleLetterSystem.getNextLetters();
  }

  private renderStandingsEmbed() {
    const turnText = i18n.t('game.turn', {
      turn: `${this.round}/${this.totalRounds}`,
    });

    const gameStandingsText = i18n.t('game.standings');
    const embed : MessageEmbedOptions = {
      color: this.client.colors.primary,
      title: `${gameStandingsText} | ${turnText}`,
      fields: this.playerData.sort((playerA, playerB) => playerA.score - playerB.score).map((player) => {
        const { score, gain, word } = player;
        const { nickname } = player.extendedUser;
        return {
          name: `${nickname}: ${score} (+${gain || 0}) | ${word || 'NA'}`,
          value: '** **',
          inline: true,
        };
      }),
      timestamp: Date.now(),
    };

    return this.interaction.editReply({ embeds: [embed] });
  }

  private async renderLettersEmbed() {
    const lettersString = this.scrabbleLetterSystem.getLettersDisplay();
    const turnText = i18n.t('game.turn', {
      turn: `${this.round}/${this.totalRounds}`,
    });

    const isFirstRound = this.round === 1;

    const lettersText = i18n.t('scrabble.lettersText');

    const fields : EmbedFieldData[] = [
      {
        name: lettersText,
        value: lettersString,
      },
    ];

    if (isFirstRound) {
      const reminder = i18n.t('scrabble.reminderText');
      fields.push({
        name: '** **',
        value: reminder,
      });
    }

    const embed: MessageEmbedOptions = {
      title: turnText,
      color: this.client.colors.primary,
      fields,
      footer: {
        text: i18n.t('timeLimitText', {
          timeLimit: this.timeLimit / 1000,
        }),
        iconURL: this.interaction.user.avatarURL(),
      },
      timestamp: Date.now(),
    };

    return this.interaction.editReply({ embeds: [embed] });
  }

  private renderAllLettersEmbed() {
    const embed: MessageEmbedOptions = {
      title: i18n.t('scrabble.endSummaryTitle'),
      color: this.client.colors.secondary,
      fields: this.roundHistory.map((round, index) => {
        const roundText = i18n.t('scrabble.endRoundText', {
          round: index + 1,
          word: round.word,
          score: round.score,
        });
        return {
          name: roundText,
          value: round.display,
        };
      }),
      timestamp: Date.now(),
    };

    return this.interaction.editReply({ embeds: [embed] });
  }

  private renderEndMessage() : void {
    let message : string;
    if (this.isSoloMode) {
      message = i18n.t('scrabble.winSoloMessage', {
        score: this.playerData.get(this.interaction.user.id).score,
      });
    } else {
      let best : ScrabblePlayer = null;
      let winners : string[] = [];
      for (const player of this.playerData.values()) {
        if (!best) {
          best = player;
          winners = [player.extendedUser.nickname];
        } else if (player.score === best.score) {
          winners.push(player.extendedUser.nickname);
        } else if (player.score > best.score) {
          best = player;
          winners = [player.extendedUser.nickname];
        }
      }
      message = i18n.t('scrabble.winMultiplayerMessage', {
        winners: winners.join(', '),
        score: best.score,
      });
    }
    this.interaction.followUp(message);
  }

  private updateRoundHistory() : void {
    let highest : ScrabblePlayer;
    for (const player of this.playerData.values()) {
      if (!highest) {
        highest = player;
      } else if (player.score > highest.score) {
        highest = player;
      }
    }

    this.roundHistory.push({
      word: highest.word || i18n.t('notAvailableShort'),
      score: highest.gain || 0,
      display: this.scrabbleLetterSystem.getLettersDisplay(),
    });
  }

  private filterUniqueMessages(
    messages: Collection<string, Message>,
  ): UniqueMessages {
    const unique: UniqueMessages = {};
    for (const m of messages.values()) {
      const { content, author, member } = m;
      unique[author.id] = {
        content,
        author,
        nickname: member.nickname || author.username,
      };
    }
    return unique;
  }

  private updateStanding(uniqueMessages : UniqueMessages) {
    for (const [id, message] of Object.entries(uniqueMessages)) {
      const word = message.content.toLowerCase();
      const isValidWord = this.scrabbleLetterSystem.isValidWord(word);
      const score = isValidWord
        ? this.scrabbleLetterSystem.calculateWordScore(word)
        : 0;
      if (this.playerData.has(id)) {
        this.playerData.get(id).addScore(word, score);
      } else {
        const extendedUser = new ExtendedUser(message.author, message.nickname);
        this.playerData.set(id, new ScrabblePlayer(extendedUser));
        this.playerData.get(id).addScore(word, score);
      }
    }
  }

  private async awaitRound(): Promise<void> {
    const filter: CollectorFilter<[Message]> = (m: Message): boolean => {
      const content = m.content.toLowerCase().trim();
      const isAuthor = m.author.id === this.interaction.user.id;
      const regex = /^[A-Za-z]+$/;
      const isOnlyLetters = regex.test(content);
      const isValidLength = content.length >= 3;
      return (isAuthor || !this.isSoloMode) && isOnlyLetters && isValidLength;
    };

    const messages = await this.interaction.channel.awaitMessages({
      filter,
      time: this.timeLimit,
      max: this.isSoloMode ? 1 : 1000,
    });

    if (!messages.size) {
      this.hasEnded = true;
      this.interaction.followUp(this.inactivityMessage);
      return;
    }

    const filteredMessages = this.filterUniqueMessages(messages);
    this.updateStanding(filteredMessages);
  }
}

export default Scrabble;
