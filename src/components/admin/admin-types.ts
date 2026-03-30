export interface Document {
  id: string;
  name: string;
  file_path: string;
  status: string;
  created_at: string;
  is_active?: boolean;
  topic_scope?: string | null;
  source_type?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  summary?: string | null;
  version_label?: string | null;
  published_at?: string | null;
  last_reviewed_at?: string | null;
  metadata_json?: Record<string, unknown> | null;
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
  governanceSummary?: string;
  governanceDetail?: string;
  abortController?: AbortController;
}
