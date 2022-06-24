export const extractIndexFromErrorHex = (error: string) =>
  parseInt((error as any).substring(2, 4), 16);
