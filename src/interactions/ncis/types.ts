export interface QuestionCollection {
  categories: QuestionCollectionCategoriesObject;
}

export type QuestionCollectionCategories = "main" | "characters" | "episodes" | "quotes";

export type QuestionCollectionCategoriesObject = {
  [key in QuestionCollectionCategories]: QuestionCollectionDescription;
};

export interface QuestionCollectionDescription {
  link: string;
  info: SingleQuestionCollection[];
}

export type DateString = string;

export function parseDateString(input: DateString) {
  return new Date(input);
}

export type possibleDigits = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type IDString = string;
// `${possibleDigits}${possibleDigits}${possibleDigits}${possibleDigits}${possibleDigits}${possibleDigits}`;

export type QuestionDifficulty =
  | "Average"
  | "Easier"
  | "Tough"
  | "Very Easy"
  | "Difficult"
  | "Very Difficult";

export type QuestionRating = "top 10%" | "top 5%" | "top 20%" | "well" | "not rated";

// well == "top 35%" ????!

export type URLString = string;

export interface SingleQuestionCollection {
  description: string;
  name: string;
  id: IDString;
  link: URLString;
  difficulty: QuestionDifficulty;
  author: string;
  questionsNumber: number;
  amountOfPlays: number;
  rating: QuestionRating;
  parsed: DateString;
}

// TODO questions types
