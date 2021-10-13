type TriviaType = 'boolean' | 'multiple';
type TriviaDifficulty = 'easy' | 'medium' | 'hard';

const TRIVIA_LETTERS = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
} as const;

type TriviaLetter = keyof typeof TRIVIA_LETTERS;

interface TriviaQuestion {
  category: string;
  type: TriviaType;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  difficulty: TriviaDifficulty;
}

interface TriviaResponse {
  response_code: number;
  results: TriviaQuestion[];
}

interface ModifiedTriviaQuestion {
  category: string;
  question: string;
  shuffledAnswers: string[];
  difficulty: string;
  correctAnswer: TriviaLetter;
  possibleAnswers: TriviaLetter[];
  type: TriviaType;
  points: number;
  correctAnswerString: string;
}

export {
  TRIVIA_LETTERS,
  ModifiedTriviaQuestion,
  TriviaLetter,
  TriviaResponse,
  TriviaQuestion,
  TriviaType,
  TriviaDifficulty,
};
