/**
 * File: src/logic/csvParser.ts
 * Project: Vibe Coding Simulator (MVP)
 * Description: Handles parsing of CSV data into JavaScript objects. Uses PapaParse library.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import Papa from 'papaparse';

/**
 * Parses a CSV string into an array of objects.
 * Assumes the first row is the header.
 * @param {string} csvString - The raw CSV data as a string.
 * @returns {Promise<Array<Object>>} - A promise that resolves with an array of objects.
 */
export const parseCsvData = (csvString: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (!csvString || typeof csvString !== 'string') {
      // console.warn("parseCsvData: Input is not a valid string, returning empty array.");
      return resolve([]); // Handle empty or invalid input gracefully
    }
    Papa.parse(csvString, {
      header: true,       // Treat the first row as headers
      skipEmptyLines: true, // Skip empty lines
      dynamicTyping: true, // Automatically convert numbers and booleans
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.error("CSV Parsing Errors:", results.errors);
          // Decide if partial data is acceptable or reject
          // For MVP, let's return data but log errors
        }
        resolve(results.data);
      },
      error: (error: Error) => {
        console.error("CSV Parsing Failed:", error);
        reject(error);
      }
    });
  });
};

// Expected CSV Headers (Documentation / Placeholders)
// ai_models.csv: Model_ID, Model_Name, Accuracy, Inference_Speed, Specialization
// projects.csv: Project_ID, Name, Complexity, Domain, Baseline_Time, YOLO_Success, Error_Rate, Reward, Reputation_Reward
// prompts.csv: Prompt_ID, Name, Clarity, Specificity, Structured_Format, Contextual_Info
// hardware.csv: Hardware_ID, Name, Processing_Power, Memory, Energy_Efficiency, Cost
// messages.csv: Message_ID, Type, Title, Body, Value_Probability, Action (Structure TBD based on actual needs) 