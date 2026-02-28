import type { Feedback } from "../entities/feedback.js";

export interface FeedbackRepository {
  create(data: { userId: number; message: string }): Promise<Feedback>;
}
