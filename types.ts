export interface Reference {
  /**
   * Canonical URL for the cited source.
   * @deprecated `uri` is kept for backward compatibility and normalized to `url` in code.
   */
  uri?: string;
  /** Human-friendly title for the source. */
  title: string;
  /** Fully-qualified URL for the source. */
  url: string;
  /** Optional snippet or description of the source content. */
  snippet: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
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