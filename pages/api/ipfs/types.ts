import * as z from "zod";

export const IOMarketMetadata = z.object({
  question: z.string(),
  description: z.optional(z.string()),
  tags: z.optional(z.array(z.string())),
  slug: z.optional(z.string()),
  categories: z.optional(
    z.array(
      z.object({
        name: z.string(),
        ticker: z.optional(z.string()),
        img: z.optional(z.string()),
        color: z.optional(z.string()),
      }),
    ),
  ),
});
