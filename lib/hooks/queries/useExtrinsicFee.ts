import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { AssetId, ZTG, isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useWallet } from "lib/state/wallet";
import { useAllAssetMetadata } from "./useAssetMetadata";
import { useChainConstants } from "./useChainConstants";
import { useForeignAssetBalances } from "./useForeignAssetBalances";
import { useZtgBalance } from "./useZtgBalance";
import { useSdkv2 } from "../useSdkv2";

type FeeAsset = {
  assetId: AssetId;
  symbol: string;
  amount: Decimal;
  sufficientBalance: boolean;
};

// 2% buffer, extrinsic fees paid in foreign asset take a little more computation (approx 1.6%)
const foreignAssetFeeBuffer = 1.02;

export const extrinsicFeeKey = "extrinsic-fee";

export const useExtrinsicFee = (
  inputExtrinsic?: SubmittableExtrinsic<"promise", ISubmittableResult>,
): UseQueryResult<FeeAsset | null> => {
  const [sdk] = useSdkv2();
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
    !!nativeBalance &&
    !!foreignAssetBalances &&
    !!extrinsic &&
    !!activeAccount &&
    !!assetMetadata;

  const query = useQuery(
    [
      extrinsicFeeKey,
      activeAccount,
      extrinsic?.hash,
      activeAccount,
      nativeBalance,
      foreignAssetBalances,
    ],
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
            sufficientBalance: true,
          };
        }

        // find first available asset to pay fee, else just return native asset
        const availableAsset = foreignAssetBalances.find((asset) => {
          const feeFactor = assetMetadata
            ?.find((data) => asset.foreignAssetId === data[0])?.[1]
            .feeFactor.div(ZTG);
          if (feeFactor) {
            return asset.balance.greaterThan(
              fee.mul(feeFactor).mul(foreignAssetFeeBuffer),
            );
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
            amount: fee.mul(feeFactor ?? 1).mul(foreignAssetFeeBuffer),
            sufficientBalance: true,
          };
        } else {
          return {
            assetId: { Ztg: null },
            symbol: constants?.tokenSymbol ?? "",
            amount: fee,
            sufficientBalance: false,
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
