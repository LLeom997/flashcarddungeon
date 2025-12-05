
export interface FlashcardData {
  id: string;
  question: string;
  answer: string;
  isTough?: boolean;
}

export interface DeckStats {
  total: number;
  current: number;
}

export enum GameState {
  UPLOAD = 'UPLOAD',
  SHEET_SELECTION = 'SHEET_SELECTION',
  STUDY = 'STUDY',
  LOADING = 'LOADING'
}
