import type { Kysely } from "kysely";
import type { Database } from "../../infrastructure/database/types.js";
import type { FeedbackRepository } from "../../core/repositories/feedback.repository.js";
import type { Feedback } from "../../core/entities/feedback.js";
import { toFeedback } from "./dto.js";

export class KyselyFeedbackRepository implements FeedbackRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async create(data: { userId: number; message: string }): Promise<Feedback> {
    const row = await this.db
      .insertInto("feedbacks")
      .values({
        user_id: data.userId,
        message: data.message,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toFeedback(row);
  }
}
