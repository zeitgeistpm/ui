import { useQuery } from "@tanstack/react-query";
import {
  getAssetWeight,
  getIndexOf,
  getMarketIdOf,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { MAX_IN_OUT_RATIO, ZTG } from "lib/constants";
import { calcSpotPrice } from "lib/math";
import { useWallet } from "lib/state/wallet";
import { TradeItem } from "../trade";
import { useSdkv2 } from "../useSdkv2";
import { useAccountAssetBalances } from "./useAccountAssetBalances";
import { useBalance } from "./useBalance";
import { useMarket } from "./useMarket";
import { usePoolAccountIds } from "./usePoolAccountIds";
import { usePoolBaseBalance } from "./usePoolBaseBalance";
import { usePoolsByIds } from "./usePoolsByIds";

export const tradeItemStateRootQueryKey = "trade-item-state";

export const useTradeItemState = (item: TradeItem) => {
  const [sdk, id] = useSdkv2();
  const wallet = useWallet();
  const slippage = 1;

  const marketId = getMarketIdOf(item.assetId);
  const { data: pools } = usePoolsByIds([{ marketId: marketId }]);
  const { data: market } = useMarket({ marketId });

  const pool = pools?.[0];
  const baseAsset = pool?.baseAsset
    ? parseAssetId(pool.baseAsset).unwrap()
    : undefined;

  const { data: traderBaseBalance } = useBalance(wallet.realAddress, baseAsset);

  const { data: poolBaseBalance } = usePoolBaseBalance(pool?.poolId);

  const traderAssets = useAccountAssetBalances([
    { account: wallet.realAddress, assetId: item.assetId },
  ]);
  const traderAssetBalance = wallet.realAddress
    ? new Decimal(
        (
          traderAssets?.get(wallet.realAddress, item.assetId)?.data
            ?.balance as any
        )?.free?.toString() ?? 0,
      )
    : new Decimal(0);

  const poolAccountIds = usePoolAccountIds(pools ?? []);
  const poolAccountId = pool?.poolId ? poolAccountIds[pool.poolId] : undefined;

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

  const enabled =
    !!sdk &&
    !!item &&
    !!pool &&
    !!poolBaseBalance &&
    !!poolAssetBalance &&
    !!baseAsset &&
    !!market;

  const query = useQuery(
    [
      id,
      tradeItemStateRootQueryKey,
      poolAccountId,
      wallet.realAddress,
      balances,
      item.action,
      JSON.stringify(item.assetId),
    ],
    () => {
      if (!enabled) return;
      const baseWeight = getAssetWeight(pool, baseAsset).unwrap();
      const assetWeight = getAssetWeight(pool, item.assetId).unwrap();
      const assetIndex = getIndexOf(item.assetId);
      const asset = market.categories?.[assetIndex];
      const swapFee = new Decimal(
        pool.swapFee === "" ? "0" : pool.swapFee ?? "0",
      ).div(ZTG);
      const tradeablePoolAssetBalance = poolAssetBalance.mul(MAX_IN_OUT_RATIO);

      if (!baseWeight || !assetWeight) return;

      const spotPrice = calcSpotPrice(
        poolBaseBalance,
        baseWeight,
        poolAssetBalance,
        assetWeight,
        0,
      );

      return {
        asset,
        pool,
        market,
        spotPrice,
        baseAssetId: baseAsset,
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
      enabled: enabled,
      keepPreviousData: true,
    },
  );

  return query;
};
