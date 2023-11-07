import * as z from "zod";

export type CourtSaltPhraseSeed = z.TypeOf<typeof IOCourtSaltPhraseSeed>;

export const IOCourtSaltPhraseSeed = z.object({
  caseId: z.number(),
  marketId: z.number(),
  phrase: z.string(),
  createdAt: z.number(),
});
