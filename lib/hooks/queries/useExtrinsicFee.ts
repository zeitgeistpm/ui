import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useWallet } from "lib/state/wallet";

export const extrinsicFeeKey = "extrinsic-fee";

export const useExtrinsicFee = (
  extrinsic?: SubmittableExtrinsic<"promise", ISubmittableResult>,
) => {
  const { activeAccount: activeAccount } = useWallet();

  const query = useQuery(
    [extrinsicFeeKey, extrinsic?.hash, activeAccount],
    async () => {
      if (activeAccount && extrinsic) {
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
