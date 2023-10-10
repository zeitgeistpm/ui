import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { AssetId, IOZtgAssetId, ZTG } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useWallet } from "lib/state/wallet";
import { useAssetMetadata } from "./useAssetMetadata";
import { useBalance } from "./useBalance";
import { useChainConstants } from "./useChainConstants";
import { useZtgBalance } from "./useZtgBalance";
import useFeePayingAssetSelection from "lib/state/fee-paying-asset";

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
  const { data: constants } = useChainConstants();

  const { data: dotMetadata } = useAssetMetadata({ ForeignAsset: 0 });
  const { data: dotBalance } = useBalance(activeAccount?.address, {
    ForeignAsset: 0,
  });
  const { assetSelection } = useFeePayingAssetSelection();

  const enabled =
    !!nativeBalance &&
    !!dotMetadata &&
    !!activeAccount &&
    !!dotBalance &&
    !!baseFee;

  const query = useQuery(
    [
      feePayingAssetKey,
      activeAccount?.address,
      nativeBalance,
      dotBalance,
      baseFee,
      assetSelection,
    ],
    async () => {
      if (enabled) {
        if (assetSelection.label === "Default") {
          // if user has ztg, use that to pay
          if (nativeBalance.greaterThanOrEqualTo(baseFee)) {
            return {
              assetId: { Ztg: null },
              symbol: constants?.tokenSymbol ?? "",
              amount: baseFee,
              sufficientBalance: true,
            };
          }

          const dotFeeFactor = dotMetadata.feeFactor.div(ZTG);
          const dotFee = baseFee.mul(dotFeeFactor).mul(foreignAssetFeeBuffer);

          if (dotBalance.greaterThan(dotFee)) {
            return {
              assetId: {
                ForeignAsset: 0,
              },
              symbol: dotMetadata.symbol,
              amount: dotFee,
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
        } else {
          const isNative = IOZtgAssetId.is(assetSelection.value);
          if (isNative) {
            return {
              assetId: { Ztg: null },
              symbol: constants?.tokenSymbol ?? "",
              amount: baseFee,
              sufficientBalance: true,
            };
          } else {
            const dotFeeFactor = dotMetadata.feeFactor.div(ZTG);
            const dotFee = baseFee.mul(dotFeeFactor).mul(foreignAssetFeeBuffer);
            return {
              assetId: {
                ForeignAsset: 0,
              },
              symbol: dotMetadata.symbol,
              amount: dotFee,
              sufficientBalance: dotBalance.greaterThan(dotFee),
            };
          }
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
