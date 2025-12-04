import Papa from 'papaparse';
import { FlashcardData } from '../types';

export const parseCSV = (file: File): Promise<FlashcardData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false, // We assume col 1 is Q, col 2 is A, regardless of header name
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as string[][];
          
          // Remove potential header row if it looks like "Question, Answer"
          let dataToProcess = rawData;
          if (rawData.length > 0) {
             const firstRow = rawData[0].map(c => c.toLowerCase().trim());
             if (firstRow.includes('question') && (firstRow.includes('answer') || firstRow.includes('flashcard'))) {
                dataToProcess = rawData.slice(1);
             }
          }

          const cards: FlashcardData[] = dataToProcess.map((row, index) => {
            if (row.length < 2) return null;
            return {
              id: `card-${index}-${Date.now()}`,
              question: row[0],
              answer: row[1]
            };
          }).filter((item): item is FlashcardData => item !== null);

          resolve(cards);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => {
        reject(err);
      }
    });
  });
};