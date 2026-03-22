export interface Document {
  id: string;
  name: string;
  file_path: string;
  status: string;
  created_at: string;
}

export type IngestionStatus =
  | "idle"
  | "extracting"
  | "vectorizing"
  | "verifying"
  | "done"
  | "partial"
  | "failed"
  | "canceled";

export interface IngestionLastError {
  message: string;
  requestId?: string;
  chunkIndex?: number;
  code?: string;
}

export interface IngestionState {
  fileName: string;
  status: IngestionStatus;
  phaseLabel: string;
  progress: number;
  totalChunks: number;
  processedChunks: number;
  expectedChunks: number;
  insertedChunks: number;
  lastError?: IngestionLastError;
  abortController?: AbortController;
}
