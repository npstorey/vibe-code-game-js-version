/**
 * File: src/hooks/useCsvLoader.ts
 * Project: Vibe Coding Simulator (MVP)
 * Description: Custom hook to fetch and parse multiple CSV files.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import { useState, useEffect } from 'react';
import { parseCsvData } from '../logic/csvParser';

type FilePaths = { [key: string]: string };
type LoadedData = { [key: string]: any[] };
type LoadError = { key: string; path: string; error: string }[];

export const useCsvLoader = (filePaths: FilePaths) => {
  const [data, setData] = useState<LoadedData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<LoadError | null>(null);

  useEffect(() => {
    const loadAllCsvs = async () => {
      setLoading(true);
      setError(null);
      const loadedData: LoadedData = {};
      const errors: LoadError = [];

      try {
        const fetchPromises = Object.entries(filePaths).map(async ([key, path]) => {
          try {
            const response = await fetch(path);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status} for ${path}`);
            }
            const csvText = await response.text();
            const parsed = await parseCsvData(csvText);
            loadedData[key] = parsed;
          } catch (err) {
             console.error(`Failed to load or parse ${key} from ${path}:`, err);
             errors.push({key, path, error: err instanceof Error ? err.message : String(err)});
             loadedData[key] = []; // Assign empty array on error for consistency
          }
        });

        await Promise.all(fetchPromises);

        setData(loadedData);
        if(errors.length > 0) {
            setError(errors); // Store specific errors
        }

      } catch (globalErr) {
         console.error("Error loading CSV data globally:", globalErr);
         setError([{key: 'global', path: '', error: globalErr instanceof Error ? globalErr.message : String(globalErr)}]);
      } finally {
        setLoading(false);
      }
    };

    loadAllCsvs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return { data, loading, error };
}; 