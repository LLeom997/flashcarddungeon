export interface FlashcardData {
  id: string;
  question: string;
  answer: string;
}

export interface DeckStats {
  total: number;
  current: number;
}

export enum GameState {
  UPLOAD = 'UPLOAD',
  STUDY = 'STUDY',
  LOADING = 'LOADING'
}
