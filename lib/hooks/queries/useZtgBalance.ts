import { useBalance } from "./useBalance";

export const useZtgBalance = (address: string, blockNumber?: number) => {
  return useBalance(address, { Ztg: null }, blockNumber);
};
