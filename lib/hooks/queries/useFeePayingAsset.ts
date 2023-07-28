import { useQuery } from "@tanstack/react-query";
import { ZTG } from "@zeitgeistpm/sdk-next";
import { useWallet } from "lib/state/wallet";
import { useSdkv2 } from "../useSdkv2";
import { useExtrinsicFee } from "./useExtrinsicFee";
import { useForeignAssetBalances } from "./useForiegnAssetBalances";
import { useZtgBalance } from "./useZtgBalance";

export const feePayingAssetRootKey = "fee-paying-asset";

export const useFeePayingAsset = () => {
  const [sdk, id] = useSdkv2();
  const wallet = useWallet();
  const extrinsic = wallet.activeAccount?.address
    ? sdk
        ?.asRpc()
        .api.tx.balances.transfer(wallet.activeAccount?.address, ZTG.toFixed(0))
    : undefined;

  const { data: fee } = useExtrinsicFee(extrinsic);
  const { data: nativeBalance } = useZtgBalance(wallet.activeAccount?.address);
  const { data: foreignAssetBalances } = useForeignAssetBalances(
    wallet.activeAccount?.address,
  );

  const enabled = !!fee && !!nativeBalance && !!foreignAssetBalances;

  const query = useQuery(
    [id, feePayingAssetRootKey, fee, nativeBalance, foreignAssetBalances],
    async () => {
      if (enabled) {
        if (nativeBalance.greaterThanOrEqualTo(fee)) {
          return "ZTG";
        }

        // find first available asset to pay fee, else just return native asset
        const availableAsset = foreignAssetBalances.find((asset) =>
          //todo: add corresponding fee factor
          asset.balance.greaterThan(fee),
        );

        if (availableAsset) {
          return availableAsset.symbol;
        } else {
          return "ZTG";
        }
      }
    },
    {
      enabled: enabled,
    },
  );

  return query;
};
