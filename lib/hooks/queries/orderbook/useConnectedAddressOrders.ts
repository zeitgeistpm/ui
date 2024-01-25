import { useQuery } from "@tanstack/react-query";
import { AssetId, isRpcSdk, parseAssetId } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useWallet } from "lib/state/wallet";
import { useOrders } from "./useOrders";

export const ordersRootKey = "orders";

export type MarketOrder = {
  id: number;
  makerAddress: string;
  makerAmount: Decimal;
  makerAsset: AssetId;
  marketId: number;
  takerAmount: Decimal;
  takerAsset: AssetId;
};

export const useUserOrders = () => {
  const [sdk, id] = useSdkv2();

  const { realAddress } = useWallet();
  const { data: orders } = useOrders();

  const query = useQuery(
    [id, orders?.length],
    async () => {
      return orders?.filter((order) => order.makerAddress === realAddress);
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk)),
      staleTime: 10_000,
    },
  );

  return query;
};
