import { useQuery } from "@tanstack/react-query";
import {
  getAssetWeight,
  getIndexOf,
  getMarketIdOf,
} from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { MAX_IN_OUT_RATIO, ZTG } from "lib/constants";
import { calcSpotPrice } from "lib/math";
import { useStore } from "lib/stores/Store";
import { TradeItem } from "../trade";
import { useSdkv2 } from "../useSdkv2";
import { useAccountAssetBalances } from "./useAccountAssetBalances";
import { usePoolAccountIds } from "./usePoolAccountIds";
import { usePoolsByIds } from "./usePoolsByIds";
import { usePoolZtgBalance } from "./usePoolZtgBalance";
import { useSaturatedPoolsIndex } from "./useSaturatedPoolsIndex";
import { useZtgBalance } from "./useZtgBalance";

export const tradeItemStateRootQueryKey = "trade-item-state";

export const useTradeItemState = (item: TradeItem) => {
  const [sdk, id] = useSdkv2();
  const { wallets } = useStore();
  const signer = wallets.activeAccount ? wallets.getActiveSigner() : null;
  const slippage = 1;
  const { data: traderBaseBalance } = useZtgBalance(
    wallets.activeAccount?.address,
  );

  const { data: pools } = usePoolsByIds([
    { marketId: getMarketIdOf(item.assetId) },
  ]);

  const pool = pools?.[0];

  const { data: saturatedIndex } = useSaturatedPoolsIndex(pools ?? []);
  const saturatedData = saturatedIndex?.[pool?.poolId];

  const poolBaseBalances = usePoolZtgBalance(pools ?? []);
  const poolBaseBalance =
    pool &&
    poolBaseBalances?.[pool?.poolId] &&
    new Decimal(poolBaseBalances[pool.poolId].free.toString());

  const traderAssets = useAccountAssetBalances([
    { account: signer?.address, assetId: item.assetId },
  ]);
  const traderAssetBalance = new Decimal(
    (
      traderAssets?.get(signer?.address, item.assetId)?.data?.balance as any
    )?.free?.toString() ?? 0,
  );

  const poolAccountIds = usePoolAccountIds(pools ?? []);
  const poolAccountId = poolAccountIds[pool?.poolId];

  const poolAssetBalances = useAccountAssetBalances([
    { account: poolAccountId, assetId: item.assetId },
  ]);

  const poolAssetBalance = new Decimal(
    poolAssetBalances
      ?.get(poolAccountId, item.assetId)
      ?.data?.balance?.free.toString() ?? 0,
  );

  const balances = {
    poolBaseBalance: poolBaseBalance?.toString(),
    poolAssetBalance: poolAssetBalance?.toString(),
    traderBaseBalance: traderBaseBalance?.toString(),
    traderAssetBalance: traderAssetBalance?.toString(),
  };

  const query = useQuery(
    [
      id,
      tradeItemStateRootQueryKey,
      poolAccountId,
      wallets.activeAccount?.address,
      balances,
      item.action,
      JSON.stringify(item.assetId),
    ],
    () => {
      const baseWeight = getAssetWeight(pool, { Ztg: null }).unwrap();
      const assetWeight = getAssetWeight(pool, item.assetId).unwrap();
      const assetIndex = getIndexOf(item.assetId);
      const asset = saturatedData.assets[assetIndex];
      const swapFee = new Decimal(pool.swapFee === "" ? "0" : pool.swapFee).div(
        ZTG,
      );
      const tradeablePoolAssetBalance = poolAssetBalance.mul(MAX_IN_OUT_RATIO);

      const spotPrice = calcSpotPrice(
        poolBaseBalance,
        baseWeight,
        poolAssetBalance,
        assetWeight,
        swapFee,
      );

      return {
        asset,
        pool,
        spotPrice,
        baseAssetId: { Ztg: null },
        poolAccountId,
        poolBaseBalance,
        poolAssetBalance,
        assetId: item.assetId,
        tradeablePoolAssetBalance,
        traderBaseBalance,
        traderAssetBalance,
        baseWeight,
        assetWeight,
        swapFee,
        slippage,
      };
    },
    {
      enabled:
        !!sdk &&
        !!item &&
        !!pool &&
        !!poolBaseBalance &&
        !!saturatedData &&
        !!traderBaseBalance &&
        !!traderAssetBalance &&
        !!poolAssetBalance &&
        !!wallets.activeAccount?.address,
      keepPreviousData: true,
    },
  );

  return query;
};
