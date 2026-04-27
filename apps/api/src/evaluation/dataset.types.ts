export type DatasetQuestion = {
  id: string;
  question: string;
  expectedAnswer: string;
  referenceChunks: string[];
  category: string;
};

export type EvaluationDataset = {
  version: string;
  name: string;
  description: string;
  questions: DatasetQuestion[];
};
