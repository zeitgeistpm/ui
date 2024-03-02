import { tryCatch } from "@zeitgeistpm/utility/dist/either";

export const WHITELISTED_TRUSTED_CREATORS: string[] = tryCatch(() =>
  JSON.parse(process.env.NEXT_PUBLIC_WHITELISTED_TRUSTED_CREATORS as string),
).unwrapOr([]);
