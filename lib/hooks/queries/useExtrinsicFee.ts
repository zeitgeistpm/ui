import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { AssetId, ZTG, isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useWallet } from "lib/state/wallet";
import { useAllAssetMetadata } from "./useAssetMetadata";
import { useChainConstants } from "./useChainConstants";
import { useForeignAssetBalances } from "./useForiegnAssetBalances";
import { useZtgBalance } from "./useZtgBalance";
import { useSdkv2 } from "../useSdkv2";

type FeeAsset = {
  assetId: AssetId;
  symbol: string;
  amount: Decimal;
};

export const extrinsicFeeKey = "extrinsic-fee";

export const useExtrinsicFee = (
  inputExtrinsic?: SubmittableExtrinsic<"promise", ISubmittableResult>,
): UseQueryResult<FeeAsset | null> => {
  const [sdk, id] = useSdkv2();
  const { activeAccount: activeAccount } = useWallet();
  const { data: nativeBalance } = useZtgBalance(activeAccount?.address);
  const { data: foreignAssetBalances } = useForeignAssetBalances(
    activeAccount?.address,
  );
  const { data: constants } = useChainConstants();
  const { data: assetMetadata } = useAllAssetMetadata();

  const defaultExtrinsic =
    activeAccount?.address && isRpcSdk(sdk)
      ? sdk.api.tx.balances.transfer(activeAccount?.address, ZTG.toFixed(0))
      : undefined;

  const extrinsic = inputExtrinsic ?? defaultExtrinsic;

  const enabled =
    !!nativeBalance && !!foreignAssetBalances && !!extrinsic && !!activeAccount;

  const query = useQuery(
    [extrinsicFeeKey, extrinsic?.hash, activeAccount],
    async () => {
      if (enabled) {
        const info = await extrinsic.paymentInfo(activeAccount?.address);
        const fee = new Decimal(info?.partialFee.toString() ?? 0);

        // if user has ztg, use that to pay
        if (nativeBalance.greaterThanOrEqualTo(fee)) {
          return {
            assetId: { Ztg: null },
            symbol: constants?.tokenSymbol ?? "",
            amount: fee,
          };
        }

        // find first available asset to pay fee, else just return native asset
        const availableAsset = foreignAssetBalances.find((asset) => {
          const feeFactor = assetMetadata
            ?.find((data) => asset.foreignAssetId === data[0])?.[1]
            .feeFactor.div(ZTG);
          if (feeFactor) {
            return asset.balance.greaterThan(fee.mul(feeFactor));
          }
        });

        if (availableAsset && availableAsset.foreignAssetId != null) {
          const feeFactor = assetMetadata
            ?.find((data) => availableAsset.foreignAssetId === data[0])?.[1]
            .feeFactor.div(ZTG);
          return {
            assetId: {
              ForeignAsset: availableAsset.foreignAssetId,
            },
            symbol: availableAsset.symbol,
            amount: fee.mul(feeFactor ?? 1),
          };
        } else {
          return {
            assetId: { Ztg: null },
            symbol: constants?.tokenSymbol ?? "",
            amount: fee,
          };
        }
      }
      return null;
    },
    {
      enabled: enabled,
    },
  );

  return query;
};
