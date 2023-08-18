import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { useQuery } from "@tanstack/react-query";
import { ZTG, isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useWallet } from "lib/state/wallet";
import { useSdkv2 } from "../useSdkv2";
import { useFeePayingAsset } from "./useFeePayingAsset";

export const extrinsicFeeKey = "extrinsic-fee";

export const useExtrinsicFee = (
  inputExtrinsic?: SubmittableExtrinsic<"promise", ISubmittableResult>,
) => {
  const [sdk] = useSdkv2();
  const { activeAccount: activeAccount } = useWallet();
  const defaultExtrinsic =
    activeAccount?.address && isRpcSdk(sdk)
      ? sdk.api.tx.balances.transfer(activeAccount?.address, ZTG.toFixed(0))
      : undefined;

  const extrinsic = inputExtrinsic ?? defaultExtrinsic;

  const enabled = !!extrinsic && !!activeAccount;

  const { data: fee } = useQuery(
    [extrinsicFeeKey, activeAccount, extrinsic?.hash, activeAccount],
    async () => {
      if (enabled) {
        const info = await extrinsic.paymentInfo(activeAccount?.address);
        return new Decimal(info?.partialFee.toString() ?? 0);
      }
    },
    {
      enabled: enabled,
    },
  );

  const feeQuery = useFeePayingAsset(fee);

  return feeQuery;
};
