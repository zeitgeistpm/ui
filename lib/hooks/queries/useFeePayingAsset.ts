import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { AssetId, ZTG, isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useWallet } from "lib/state/wallet";
import { useSdkv2 } from "../useSdkv2";
import { useExtrinsicFee } from "./useExtrinsicFee";
import { useForeignAssetBalances } from "./useForiegnAssetBalances";
import { useZtgBalance } from "./useZtgBalance";
import { useChainConstants } from "./useChainConstants";
import Decimal from "decimal.js";

export const feePayingAssetRootKey = "fee-paying-asset";

type FeeAsset = {
  assetId: AssetId;
  symbol: string;
  // feeEstimate: Decimal;
};

export const useFeePayingAsset = (): UseQueryResult<FeeAsset> => {
  const [sdk, id] = useSdkv2();
  const wallet = useWallet();
  const extrinsic =
    wallet.activeAccount?.address && isRpcSdk(sdk)
      ? sdk.api.tx.balances.transfer(
          wallet.activeAccount?.address,
          ZTG.toFixed(0),
        )
      : undefined;

  const { data: fee } = useExtrinsicFee(extrinsic);
  const { data: nativeBalance } = useZtgBalance(wallet.activeAccount?.address);
  const { data: foreignAssetBalances } = useForeignAssetBalances(
    wallet.activeAccount?.address,
  );
  const { data: constants } = useChainConstants();

  const nativeAsset: FeeAsset = {
    assetId: { Ztg: null },
    symbol: constants?.tokenSymbol ?? "",
  };

  const enabled = !!fee && !!nativeBalance && !!foreignAssetBalances;

  const query = useQuery(
    [id, feePayingAssetRootKey, fee, nativeBalance, foreignAssetBalances],
    async () => {
      if (enabled) {
        if (nativeBalance.greaterThanOrEqualTo(fee)) {
          return nativeAsset;
        }

        // find first available asset to pay fee, else just return native asset
        const availableAsset = foreignAssetBalances.find((asset) =>
          //todo: add corresponding fee factor
          asset.balance.greaterThan(fee),
        );

        if (availableAsset) {
          return {
            assetId: {
              ForeignAsset: availableAsset.foreignAssetId,
              symbol: availableAsset.symbol,
            },
          };
        } else {
          return nativeAsset;
        }
      }
    },
    {
      enabled: enabled,
    },
  );

  //@ts-ignore
  return query;
};
