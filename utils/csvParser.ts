import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FlashcardData } from '../types';

export interface ParseResult {
  type: 'cards' | 'workbook';
  data?: FlashcardData[];
  workbook?: any;
  sheets?: string[];
}

const processRawRows = (rows: string[][]): FlashcardData[] => {
  // Remove potential header row if it looks like "Question, Answer"
  let dataToProcess = rows;
  if (rows.length > 0) {
     const firstRow = rows[0].map(c => String(c).toLowerCase().trim());
     if (firstRow.includes('question') && (firstRow.includes('answer') || firstRow.includes('flashcard'))) {
        dataToProcess = rows.slice(1);
     }
  }

  return dataToProcess.map((row, index) => {
    if (row.length < 2) return null;
    return {
      id: `card-${index}-${Date.now()}`,
      question: String(row[0]),
      answer: String(row[1])
    };
  }).filter((item): item is FlashcardData => item !== null);
};

export const parseFile = (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const isCsv = file.name.endsWith('.csv');

    if (isCsv) {
      // Use PapaParse for CSV
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rawData = results.data as string[][];
            const cards = processRawRows(rawData);
            resolve({ type: 'cards', data: cards });
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => reject(err)
      });
    } else {
      // Use SheetJS for Excel
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetNames = workbook.SheetNames;

          if (sheetNames.length === 1) {
             // If only one sheet, process it immediately
             const sheet = workbook.Sheets[sheetNames[0]];
             const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
             const cards = processRawRows(rows);
             resolve({ type: 'cards', data: cards });
          } else {
             // Multiple sheets found
             resolve({ 
               type: 'workbook', 
               workbook: workbook, 
               sheets: sheetNames 
             });
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    }
  });
};

export const parseSpecificSheet = (workbook: any, sheetName: string): FlashcardData[] => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
  return processRawRows(rows);
};

export const fetchGoogleSheet = async (url: string): Promise<ParseResult> => {
  // Basic regex to extract the ID from a typical Google Sheet URL
  const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!matches || !matches[1]) {
    throw new Error("Invalid Google Sheet URL. Could not find Sheet ID.");
  }
  const sheetId = matches[1];
  
  // Use the export endpoint to get it as XLSX
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

  try {
    let blob: Blob;

    try {
        // Attempt 1: Direct Fetch
        const response = await fetch(exportUrl);
        if (!response.ok) throw new Error("Direct fetch failed");
        blob = await response.blob();
    } catch (e) {
        // Attempt 2: CORS Proxy
        console.log("Direct fetch blocked by CORS, attempting via proxy...");
        // using api.allorigins.win as a free CORS proxy
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(exportUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Proxy fetch failed");
        blob = await response.blob();
    }

    // Convert blob to File to reuse existing logic
    const file = new File([blob], "google_sheet_export.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    return parseFile(file);

  } catch (error: any) {
    console.error(error);
    if (error.message && error.message.includes('fetch')) {
        throw new Error("Unable to load sheet. Please ensure the Google Sheet is visible to 'Anyone with the link'.");
    }
    throw error;
  }
};