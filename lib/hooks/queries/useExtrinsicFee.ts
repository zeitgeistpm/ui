import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import type { ApiPromise } from "@polkadot/api";
import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useSdkv2 } from "../useSdkv2";
import { useWallet } from "lib/state/wallet";

export const extrinsicFeeKey = "extrinsic-fee";

export type MarketPrices = Map<number, Decimal>;

export const useExtrinsicFee = (
  extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
) => {
  const [sdk, id] = useSdkv2();
  const { activeAccount } = useWallet();

  const query = useQuery(
    [id, extrinsicFeeKey, extrinsic.hash, activeAccount],
    async () => {
      if (activeAccount) {
        return extrinsic.paymentInfo(activeAccount?.address);
      }
    },
    {
      enabled: Boolean(sdk && extrinsic && activeAccount),
    },
  );

  return query;
};
