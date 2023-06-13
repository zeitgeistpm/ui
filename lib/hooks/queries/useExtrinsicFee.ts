import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useWallet } from "lib/state/wallet";

export const extrinsicFeeKey = "extrinsic-fee";

export type MarketPrices = Map<number, Decimal>;

export const useExtrinsicFee = (
  extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
) => {
  const { activeAccount } = useWallet();

  const query = useQuery(
    [extrinsicFeeKey, extrinsic.hash, activeAccount],
    async () => {
      if (activeAccount) {
        const info = await extrinsic.paymentInfo(activeAccount?.address);
        return new Decimal(info?.partialFee.toString() ?? 0);
      }
    },
    {
      enabled: Boolean(extrinsic && activeAccount),
    },
  );

  return query;
};
