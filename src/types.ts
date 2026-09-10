// shared Job, JobStatus types

export interface JobRow {
  id: number;
  url: string;
  source: string;
  page_type: string;
  parent_job_id: number | null;
  status: string;
  attempts: number;
  max_attempts: number;
  worker_id: string | null;
  locked_at: Date | null;
  error: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChildJobInput {
  url: string;
  pageType: string;
}
