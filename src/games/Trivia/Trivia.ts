import axios from 'axios';
import {
  CommandInteraction,
  Collection,
  EmbedFieldData,
  MessageEmbedOptions,
  MessageActionRowOptions,
  MessageButtonOptions,
  InteractionCollectorOptions,
  ButtonInteraction,
  Message,
} from 'discord.js';
import he = require('he');
import i18n from 'i18next';
import _ = require('lodash');
import { Game, ToasterBot } from '../../structures';
import TriviaPlayer from './TriviaPlayer';
import {
  ModifiedTriviaQuestion,
  TriviaDifficulty,
  TriviaLetter,
  TriviaResponse,
  TriviaType,
  TRIVIA_LETTERS,
} from './types';

const BORDER = '**-----------------------------------------------------------------------**';

function calculatePointCost(type: TriviaType, difficulty: TriviaDifficulty) : number {
  if (type === 'boolean') {
    return 1;
  }

  const pointValues = {
    easy: 1,
    medium: 2,
    hard: 3,
  };

  return pointValues[difficulty];
}

function getLetterLabel(letter : TriviaLetter) {
  return i18n.t(`trivia.${letter}`);
}

const BUTTON_OPTIONS: MessageButtonOptions[] = [
  {
    style: 'PRIMARY',
    label: getLetterLabel(TRIVIA_LETTERS.A),
    customId: TRIVIA_LETTERS.A,
    type: 'BUTTON',
  },
  {
    style: 'DANGER',
    label: getLetterLabel(TRIVIA_LETTERS.B),
    customId: TRIVIA_LETTERS.B,
    type: 'BUTTON',
  },
  {
    style: 'SUCCESS',
    label: getLetterLabel(TRIVIA_LETTERS.C),
    customId: TRIVIA_LETTERS.C,
    type: 'BUTTON',
  },
  {
    style: 'SECONDARY',
    label: getLetterLabel(TRIVIA_LETTERS.D),
    customId: TRIVIA_LETTERS.D,
    type: 'BUTTON',
  },
];

class Trivia extends Game {
  private axios = axios.create({
    baseURL: 'https://opentdb.com',
  });

  private category : number;

  private currentTurn = 0;

  private currentQuestion: ModifiedTriviaQuestion;

  private difficulty? : string;

  private intermediateTime : number;

  private messageId : string;

  private questions : ModifiedTriviaQuestion[];

  private scoreData = new Collection<string, TriviaPlayer>();

  private totalRounds : number;

  constructor(client: ToasterBot, interaction: CommandInteraction) {
    super(client, interaction, { timeLimit: 30000 });
  }

  protected async play() : Promise<void> {
    await this.initialize();
    while (this.currentTurn < this.totalRounds) {
      this.currentQuestion = this.questions[this.currentTurn];
      this.currentTurn += 1;
      this.renderEmbed();
      await this.awaitAnswers();
      if (this.hasEnded) {
        return;
      }
      await Game.sleep(this.intermediateTime);
    }
  }

  protected async initialize() : Promise<void> {
    this.category = this.getOptionValue<number>('category') ?? 0;
    this.difficulty = this.getOptionValue<string>('difficulty') ?? null;
    this.intermediateTime = this.getOptionValue<number>('intermediate') ?? 5000;
    this.timeLimit = this.getOptionValue<number>('time') ?? 20000;
    this.totalRounds = this.getOptionValue<number>('rounds') ?? 1;
    this.questions = await this.fetchTriviaQuestions();
    const message = await this.interaction.fetchReply() as Message;
    this.messageId = message.id;
  }

  private async renderScoreEmbed(message: string) {
    const winnersField : EmbedFieldData = {
      name: '** **',
      value: message,
    };

    const userScoreField: EmbedFieldData[] = Array.from(this.scoreData.values()).map(
      (player) => ({
        name: `${player.user.username} (${player.answer ? player.answer : i18n.t('trivia.noAnswer')})`,
        value: `${player.score}`,
        inline: true,
      }),
    );

    const sortedUserScoreField = userScoreField.sort((a, b) => Number(a.value) - Number(b.value));

    const scoreText = i18n.t('game.scores');
    const turnText = i18n.t('game.turn', {
      turn: `${this.currentTurn}/${this.totalRounds}`,
    });
    const titleString = `\`\`${scoreText} | ${turnText}\`\``;

    const data: MessageEmbedOptions = {
      title: titleString,
      color: this.client.colors.secondary,
      fields: [...sortedUserScoreField, winnersField],
      timestamp: Date.now(),
    };

    return this.interaction.editReply({
      embeds: [data],
      components: [],
    });
  }

  private async fetchTriviaQuestions() {
    const params = {
      category: this.category,
      amount: this.totalRounds,
      difficulty: this.difficulty,
    };

    const { data } = await this.axios.get<TriviaResponse>('/api.php', {
      params,
    });

    if (data.response_code === 0) {
      const questions = data.results.map((triviaQuestion) : ModifiedTriviaQuestion => {
        const correctAnswer = he.decode(triviaQuestion.correct_answer);
        const incorrectAnswers = triviaQuestion.incorrect_answers.map(
          (answer) => he.decode(answer),
        );
        const shuffledAnswers = _.shuffle([...incorrectAnswers, correctAnswer]);
        const possibleAnswers: Partial<TriviaLetter[]> = shuffledAnswers.length === 2
          ? [TRIVIA_LETTERS.A, TRIVIA_LETTERS.B]
          : [TRIVIA_LETTERS.A, TRIVIA_LETTERS.B, TRIVIA_LETTERS.C, TRIVIA_LETTERS.D];

        const correctAnswerLetter = possibleAnswers[shuffledAnswers.indexOf(correctAnswer)];
        return {
          category: triviaQuestion.category,
          question: he.decode(triviaQuestion.question),
          shuffledAnswers,
          difficulty: triviaQuestion.difficulty,
          correctAnswer: correctAnswerLetter,
          possibleAnswers,
          type: triviaQuestion.type,
          points: calculatePointCost(triviaQuestion.type, triviaQuestion.difficulty),
          correctAnswerString: correctAnswer,
        };
      });
      return questions;
    }
    throw new Error(
      'Looks like there are not enough questions for this specific category, or the api server is down, try again with another category',
    );
  }

  private renderButtons() : MessageActionRowOptions {
    const buttons = this.currentQuestion.type === 'multiple'
      ? BUTTON_OPTIONS
      : BUTTON_OPTIONS.slice(0, 2);

    return {
      type: 'ACTION_ROW',
      components: buttons,
    };
  }

  private async awaitAnswers() {
    const options : InteractionCollectorOptions<ButtonInteraction> = {
      time: this.timeLimit,
      filter: (btnInteraction: ButtonInteraction) => !btnInteraction.user.bot && btnInteraction.message.id === this.messageId,
      componentType: 'BUTTON',
    };

    const collector = this.interaction.channel.createMessageComponentCollector(
      options,
    );

    return new Promise((resolve) => {
      collector.on('collect', (btnInteraction: ButtonInteraction) => {
        btnInteraction.deferUpdate();
        const { user } = btnInteraction;
        const answer = btnInteraction.customId as TriviaLetter;
        const player = this.scoreData.get(user.id);
        if (player) {
          player.setAnswer(answer);
        } else {
          const newPlayer = new TriviaPlayer(user);
          newPlayer.setAnswer(answer);
          this.scoreData.set(user.id, newPlayer);
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          const inactivityMesage = i18n.t('game.inactivityMessage', {
            gameName: i18n.t('trivia.name'),
          });
          resolve(this.interaction.followUp(inactivityMesage));
          this.hasEnded = true;
        } else {
          const correctUsers : string[] = [];
          for (const player of this.scoreData.values()) {
            if (player.answer === this.currentQuestion.correctAnswer) {
              correctUsers.push(player.user.username);
              player.earnPoints(this.currentQuestion.points);
            }
          }

          const answerText = i18n.t('trivia.answerText');
          const questionText = i18n.t('trivia.questionText');
          const answerString = `\n\n${questionText} *${this.currentQuestion.question}*\n${answerText} *${this.currentQuestion.correctAnswerString}* **(${getLetterLabel(this.currentQuestion.correctAnswer)})**`;
          if (correctUsers.length) {
            const winnersString = correctUsers
              .map((user) => `**${user}**`)
              .join(', ');
            const correctUsersText = i18n.t('trivia.correctUsersText', {
              winners: winnersString,
            });
            this.renderScoreEmbed(`${correctUsersText} ${answerString}`);
          } else {
            const incorrectText = i18n.t('trivia.incorrectAnswerText');
            this.renderScoreEmbed(`${incorrectText} ${answerString}`);
          }
          for (const player of this.scoreData.values()) {
            if (player.answer === this.currentQuestion.correctAnswer) {
              player.removeAnswer();
            }
          }

          resolve(null);
        }
      });
    });
  }

  private renderEmbed() {
    const {
      question,
      shuffledAnswers,
      category,
      difficulty,
      possibleAnswers,
      points,
    } = this.currentQuestion;

    const possibleAnswersText = i18n.t('trivia.possibleAnswersText', {
      points,
    });

    const timeLimitText = i18n.t('timeLimitText', {
      timeLimit: this.timeLimit / 1000,
    });

    const embed : MessageEmbedOptions = {
      color: this.embedColor,
      title: question,
      fields: [
        {
          name: possibleAnswersText,
          value: shuffledAnswers.map((answer, index) => {
            let line = `**${possibleAnswers[
              index
            ].toUpperCase()}:** *${answer}*`;
            if (index === shuffledAnswers.length - 1) {
              line = `${line}\n${BORDER}`;
            }

            if (index === 0) {
              line = `${BORDER}\n${line}`;
            }
            return line;
          }).join('\n'),
        },
      ],
      footer: {
        text: `${category} - ${this.client.capitalize(difficulty)} | ${timeLimitText}`,
      },
      timestamp: Date.now(),
    };

    return this.interaction.editReply({ embeds: [embed], components: [this.renderButtons()] });
  }
}

export default Trivia;
