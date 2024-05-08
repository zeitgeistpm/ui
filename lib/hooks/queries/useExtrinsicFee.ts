import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useWallet } from "lib/state/wallet";
import { useFeePayingAsset } from "./useFeePayingAsset";
import { BLOCK_TIME_SECONDS } from "lib/constants";
import { useDebounce } from "use-debounce";

export const extrinsicFeeKey = "extrinsic-fee";

export const useExtrinsicFee = (
  inputExtrinsic?: SubmittableExtrinsic<"promise", ISubmittableResult>,
) => {
  const { activeAccount: activeAccount } = useWallet();

  const extrinsic = inputExtrinsic;

  const enabled = !!extrinsic && !!activeAccount;

  // used instead of a hash to know when to recalcuate, extrinsic hash can change without the important params changing
  const extrinsicParams = extrinsic
    ? `${extrinsic.method.section.toString()}-${extrinsic.method.method.toString()}-${extrinsic.args
        .map((a) => a.toString())
        .toString()}`
    : undefined;

  const [debouncedExtrinsicParams] = useDebounce(extrinsicParams, 500);

  const { data: fee } = useQuery(
    [extrinsicFeeKey, debouncedExtrinsicParams],
    async () => {
      if (enabled) {
        const info = await extrinsic.paymentInfo(activeAccount?.address);
        return new Decimal(info?.partialFee.toString() ?? 0);
      }
    },
    {
      enabled: enabled,
      staleTime: BLOCK_TIME_SECONDS * 1000,
      keepPreviousData: true,
    },
  );
  const feeQuery = useFeePayingAsset(fee);
  // console.log(feeQuery);
  return feeQuery;
};
