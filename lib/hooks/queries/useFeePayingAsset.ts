import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { AssetId, ZTG } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useWallet } from "lib/state/wallet";
import { useAllAssetMetadata } from "./useAssetMetadata";
import { useChainConstants } from "./useChainConstants";
import { useForeignAssetBalances } from "./useForeignAssetBalances";
import { useZtgBalance } from "./useZtgBalance";

type FeeAsset = {
  assetId: AssetId;
  symbol: string;
  amount: Decimal;
  sufficientBalance: boolean;
};

// 2% buffer, extrinsic fees paid in foreign assets take a little more computation (approx 1.6%)
const foreignAssetFeeBuffer = 1.02;

export const feePayingAssetKey = "fee-paying-asset";

export const useFeePayingAsset = (
  baseFee?: Decimal,
): UseQueryResult<FeeAsset | null> => {
  const { activeAccount: activeAccount } = useWallet();
  const { data: nativeBalance } = useZtgBalance(activeAccount?.address);
  const { data: foreignAssetBalances } = useForeignAssetBalances(
    activeAccount?.address,
  );
  const { data: constants } = useChainConstants();
  const { data: assetMetadata } = useAllAssetMetadata();

  const enabled =
    !!nativeBalance &&
    !!foreignAssetBalances &&
    !!activeAccount &&
    !!assetMetadata &&
    !!baseFee;

  const query = useQuery(
    [
      feePayingAssetKey,
      activeAccount,
      activeAccount,
      nativeBalance,
      foreignAssetBalances,
      baseFee,
    ],
    async () => {
      if (enabled) {
        // if user has ztg, use that to pay
        if (nativeBalance.greaterThanOrEqualTo(baseFee)) {
          return {
            assetId: { Ztg: null },
            symbol: constants?.tokenSymbol ?? "",
            amount: baseFee,
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
              baseFee.mul(feeFactor).mul(foreignAssetFeeBuffer),
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
            amount: baseFee.mul(feeFactor ?? 1).mul(foreignAssetFeeBuffer),
            sufficientBalance: true,
          };
        } else {
          return {
            assetId: { Ztg: null },
            symbol: constants?.tokenSymbol ?? "",
            amount: baseFee,
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
