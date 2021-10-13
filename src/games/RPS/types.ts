import { Collection } from 'discord.js';
import i18n from 'i18next';

const RPS_MATCHUPS = {
  ROCK: {
    label: i18n.t('rps.choiceRock'),
    emoji: '✊',
    wins: new Collection<RPSChoice, string>(
      [
        ['SCISSORS', i18n.t('rps.choiceRockWin')],
        ['LIZARD', i18n.t('rps.choiceRockWin')],
      ],
    ),
  },
  PAPER: {
    label: i18n.t('rps.choicePaper'),
    emoji: '✋',
    wins: new Collection<RPSChoice, string>(
      [
        ['ROCK', i18n.t('rps.choicePaperWinRock')],
        ['SPOCK', i18n.t('rps.choicePaperWinSpock')],
      ],
    ),
  },
  SCISSORS: {
    label: i18n.t('rps.choiceScissors'),
    emoji: '✌',
    wins: new Collection<RPSChoice, string>(
      [
        ['PAPER', i18n.t('rps.choiceScissorsWinPaper')],
        ['LIZARD', i18n.t('rps.choiceScissorsWinLizard')],
      ],
    ),
  },
  LIZARD: {
    label: i18n.t('rps.choiceLizard'),
    emoji: '🤏',
    wins: new Collection<RPSChoice, string>(
      [
        ['SPOCK', i18n.t('rps.choiceLizardWinSpock')],
        ['PAPER', i18n.t('rps.choiceLizardWinPaper')],
      ],
    ),
  },
  SPOCK: {
    label: i18n.t('rps.choiceSpock'),
    emoji: '🖖',
    wins: new Collection<RPSChoice, string>(
      [
        ['ROCK', i18n.t('rps.choiceSpockWinRock')],
        ['SCISSORS', i18n.t('rps.choiceSpockWinScissors')],
      ],
    ),
  },
};

const RPS_CHOICES = {
  ROCK: 'ROCK',
  PAPER: 'PAPER',
  SCISSORS: 'SCISSORS',
  LIZARD: 'LIZARD',
  SPOCK: 'SPOCK',
} as const;

type RPSChoice = keyof typeof RPS_CHOICES;

export { RPS_CHOICES, RPS_MATCHUPS, RPSChoice };
