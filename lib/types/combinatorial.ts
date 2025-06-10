import { z } from "zod";
import { isHex } from "@polkadot/util";

// Schema for the token string itself
const CombinatorialTokenString = z.string()
  .refine(isHex, "Must be a valid hex value")
  .refine((val) => val.startsWith('0x'), "Must start with 0x")
  .refine((val) => val.length === 66, "Must be a 32-byte hash (0x + 64 hex chars)");

// Schema for the full object structure
export const IOCombinatorialToken = z.object({
  CombinatorialToken: CombinatorialTokenString
});

// Type for the full object structure
export type CombinatorialToken = z.infer<typeof IOCombinatorialToken>;

// Type for just the token string
export type CombinatorialTokenString = z.infer<typeof CombinatorialTokenString>;

export const isCombinatorialToken = (value: unknown): value is CombinatorialToken => {
  const result = IOCombinatorialToken.safeParse(value);
  return result.success;
};

// Function to unwrap combinatorial token into a CombinatorialToken object
export const unwrapCombinatorialToken = (token: string): { CombinatorialToken: `0x${string}` } => {
  try {
    const parsedToken = JSON.parse(token);
    const hexValue = parsedToken.combinatorialToken;
    const formattedHex = hexValue.startsWith('0x') ? hexValue : `0x${hexValue}`;
    
    
    return {
      CombinatorialToken: formattedHex as `0x${string}`
    };
  } catch (error) {
    return { CombinatorialToken: '0x' as `0x${string}` };
  }
};

export const getCombinatorialHash = (token: string): `0x${string}` => {
  try {
    const parsedToken = JSON.parse(token);
    const hexValue = parsedToken.combinatorialToken;
    return (hexValue.startsWith('0x') ? hexValue : `0x${hexValue}`) as `0x${string}`;
  } catch (error) {
    return '0x' as `0x${string}`;
  }
};
