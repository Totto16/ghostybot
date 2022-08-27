export interface QuizCollection {
  categories: QuizCollectionCategoriesObject;
}

export type QuizCollectionCategories = "main" | "characters" | "episodes" | "quotes";

export type QuizCollectionCategoriesObject = {
  [key in QuizCollectionCategories]: QuizCollectionDescription;
};

export interface QuizCollectionDescription {
  link: string;
  info: SingleQuizCollection[];
}

export type DateString = string;

export function parseDateString(input: DateString): Date {
  return new Date(input);
}

export function parseURLString(input: URLString): URL {
  return new URL(input);
}

export type IDString = string;

export type QuizDifficulty =
  | "Average"
  | "Easier"
  | "Tough"
  | "Very Easy"
  | "Difficult"
  | "Very Difficult";

export interface QuizRatingMap {
  detail: "top 35%";
  overview: "well";
}

export type QuizRating<K extends keyof QuizRatingMap> =
  | "top 5%"
  | "top 10%"
  | "top 20%"
  | QuizRatingMap[K]
  | "not rated";

export type URLString = string;

export interface SingleQuizCollection {
  description: string;
  name: string;
  id: IDString;
  link: URLString;
  difficulty: QuizDifficulty;
  author: string;
  questionsNumber: number;
  amountOfPlays: number;
  rating: QuizRating<"overview">;
  parsed: DateString;
}

export interface Quiz {
  info: QuizInfo;
  questions: QuizDetails<keyof QuizTypeMap>[];
}

export interface QuizInfo {
  description: string;
  id: IDString;
  link: URLString;
  difficulty: QuizDifficulty;
  author: string;
  questionsNumber: number;
  amountOfPlays: number;
  rating: QuizRating<"detail">;
  updated: DateString;
  score: QuizScore;
  parsed: DateString;
}

export interface QuizScore {
  reached: number;
  max: number;
}

export interface QuizDetails<T extends keyof QuizTypeMap> {
  number: number;
  text: string;
  answers: QuizTypeMap[T];
  type: T;
  response: QuizResponse;
}

export interface QuizSelectAnswer {
  text: string;
  value: string;
  index: number;
  isCorrect: boolean;
}

export interface QuizTextfieldAnswer {
  hint: string;
  index: 0;
}

export interface QuizTypeMap {
  select: QuizSelectAnswer[];
  textfield: [QuizTextfieldAnswer];
}

export interface QuizResponse {
  correct: string;
  info: string | null;
}
