import * as z from "zod";

export type CourtSaltPhraseStorage = z.TypeOf<typeof IOCourtSaltPhraseStorage>;

export const IOCourtSaltPhraseStorage = z.object({
  juror: z.string(),
  caseId: z.number(),
  marketId: z.number(),
  phrase: z.string(),
  createdAt: z.number(),
});
