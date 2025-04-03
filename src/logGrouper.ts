import { writeLog } from "./commands";

export interface LogEntry {
  message: string;
  timestamp: number;
}

const WAVE_THRESHOLD_MS = 1000;
const MAX_WAVE_SIZE = 1000;
const MAX_RETRIES = 3;
const MARKERS = [
  '🔵', 
  '🟣', 
  '🟢', 
  '🟡', 
  '🔴', 
  '⚪', 
  '🟤', 
  '⚫', 
];

export interface LogGrouper {
  processLog: (message: string) => void;
  writePendingLogs: () => void;
}

const writeLogWithRetry = (message: string, retryCount = 0): void => {
  try {
    writeLog(message);
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      setTimeout(() =>{
        console.log(`Retrying to write log: ${message}`);
        writeLogWithRetry(message, retryCount + 1);
      }, 100 * Math.pow(2, retryCount));
    } else {
      console.error(`Failed to write log after ${MAX_RETRIES} attempts:`, error);
    }
  }
};

export const createLogGrouper = (): LogGrouper => {
  let currentWave: LogEntry[] = [];
  let waveCount = 0;

  const writeCurrentWave = (): void => {
    if (currentWave.length === 0) {
      return;
    }

    const marker = MARKERS[waveCount % MARKERS.length];
    waveCount++;

    currentWave.forEach(entry => {
      writeLogWithRetry(`${marker} ${entry.message}`);
    });

    currentWave = [];
  };

  const processLog = (message: string): void => {
    const now = Date.now();
    const entry: LogEntry = { message, timestamp: now };

    if (currentWave.length >= MAX_WAVE_SIZE) {
      writeCurrentWave();
    }

    const shouldWriteInCurrentWave = currentWave.length === 0 || 
        now - currentWave[currentWave.length - 1].timestamp < WAVE_THRESHOLD_MS;

    if (shouldWriteInCurrentWave) {
      currentWave.push(entry);
    } else {
      writeCurrentWave();
      currentWave = [entry];
    }
  };

  const writePendingLogs = (): void => {
    writeCurrentWave();
  };

  return {
    processLog,
    writePendingLogs,
  };
};