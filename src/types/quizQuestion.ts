export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  category: string;
  imagePath?: string;
};
