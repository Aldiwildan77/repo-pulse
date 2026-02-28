import type { Feedback } from "../../core/entities/feedback.js";
import type { FeedbackRow } from "../../infrastructure/database/types.js";

export function toFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    createdAt: row.created_at,
  };
}
