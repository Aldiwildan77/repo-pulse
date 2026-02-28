import type { FeedbackRepository } from "../repositories/feedback.repository.js";
import type { Feedback } from "../entities/feedback.js";

export class FeedbackModule {
  constructor(private readonly feedbackRepo: FeedbackRepository) {}

  async create(data: { userId: number; message: string }): Promise<Feedback> {
    return this.feedbackRepo.create(data);
  }
}
