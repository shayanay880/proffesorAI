export interface Reference {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  references?: Reference[];
}

export interface Flashcard {
  type: 'basic' | 'cloze';
  question: string;
  answer: string;
  tags: string[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  flashcards?: Flashcard[];
  createdAt: number;
  updatedAt: number;
}

export type AppMode = 'ED' | 'Study' | 'Exam';

export interface Settings {
  mode: AppMode;
  studyLoad: 'light' | 'standard' | 'deep';
  strictMode: boolean;
}