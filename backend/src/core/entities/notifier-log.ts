export interface NotifierLog {
  id: number;
  repoConfigId: number;
  eventType: string;
  status: string;
  platform: string;
  summary: string;
  errorMessage: string | null;
  createdAt: Date;
}
