import {
  AssetId,
  getIndexOf,
  getScalarBounds,
  IndexerContext,
  IOCategoricalAssetId,
  isRpcSdk,
  Market,
  MarketId,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import SecondaryButton from "components/ui/SecondaryButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import {
  AccountAssetIdPair,
  useAccountAssetBalances,
} from "lib/hooks/queries/useAccountAssetBalances";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { calcScalarWinnings } from "lib/util/calc-scalar-winnings";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { CombinatorialToken, isCombinatorialToken } from "lib/types/combinatorial";
import { useMemo } from "react";

export type RedeemButtonProps = {
  market: Market<IndexerContext>;
  assetId: AssetId;
  underlyingMarketIds?: number[];
};

export const RedeemButton = (props: RedeemButtonProps) => {
  return <RedeemButtonByAssetId {...props} />;
};

export default RedeemButton;

export const RedeemButtonByAssetId = ({
  market,
  assetId,
  underlyingMarketIds,
}: {
  market: Market<IndexerContext>;
  assetId: AssetId;
  underlyingMarketIds?: number[];
}) => {

  const wallet = useWallet();
  const realAddress = wallet?.realAddress;

  const scalarBounds = getScalarBounds(market);

  const balanceQueries: AccountAssetIdPair[] = market.marketType.categorical
    ? [{ assetId, account: realAddress }]
    : [
        {
          account: realAddress,
          assetId: { ScalarOutcome: [market.marketId as MarketId, "Short"] },
        },
        {
          account: realAddress,
          assetId: { ScalarOutcome: [market.marketId as MarketId, "Long"] },
        },
      ];

  const { isLoading: isLoadingAssetBalance, get: getAccountAssetBalance } =
    useAccountAssetBalances(balanceQueries);

  const value = useMemo(() => {
    const zero = new Decimal(0);
    if (!realAddress || isLoadingAssetBalance) return zero;

    if (market.marketType.categorical && IOCategoricalAssetId.is(assetId)) {
      const resolvedAssetIdString =
        market.outcomeAssets[Number(market.resolvedOutcome)];

      const resolvedAssetId = resolvedAssetIdString
        ? parseAssetId(resolvedAssetIdString).unrightOr(undefined)
        : undefined;

      if (
        !resolvedAssetId ||
        !IOCategoricalAssetId.is(resolvedAssetId) ||
        getIndexOf(resolvedAssetId) !== getIndexOf(assetId)
      )
        return zero;

      const balance = getAccountAssetBalance(realAddress, resolvedAssetId)?.data
        ?.balance;
      return balance?.div(ZTG);
    } else if (isCombinatorialToken(assetId)) {
      // Get the index of this combo token in market.outcomeAssets
      const tokenIndex = market.outcomeAssets.findIndex(
        asset => asset.includes(assetId.CombinatorialToken)
      );
  
      // Check if this token represents the winning outcome
      if (tokenIndex === Number(market.resolvedOutcome)) {
        // Get balance of the combinatorial token
        const balance = getAccountAssetBalance(realAddress, assetId)?.data?.balance;
        return balance?.div(ZTG) || zero;
      }
  
      return zero;
    } else {
      const shortBalance = getAccountAssetBalance(realAddress, {
        ScalarOutcome: [market.marketId as MarketId, "Short"],
      })?.data?.balance;

      const longBalance = getAccountAssetBalance(realAddress, {
        ScalarOutcome: [market.marketId as MarketId, "Long"],
      })?.data?.balance;

      if (!shortBalance || !longBalance) return zero;

      const bounds = scalarBounds.unwrap();
      const lowerBound = bounds[0].toNumber();
      const upperBound = bounds[1].toNumber();
      const resolvedNumber = Number(market.resolvedOutcome);

      return calcScalarWinnings(
        lowerBound,
        upperBound,
        new Decimal(resolvedNumber).div(ZTG),
        shortBalance.div(ZTG),
        longBalance.div(ZTG),
      );
    }
  }, [market, assetId, isLoadingAssetBalance, getAccountAssetBalance]);

  return (
    <RedeemButtonByValue market={market} value={value ?? new Decimal(0)} assetId={assetId} underlyingMarketIds={underlyingMarketIds} />
  );
};

const RedeemButtonByValue = ({
  market,
  value,
  assetId,
  underlyingMarketIds,
}: {
  market: Market<IndexerContext>;
  value: Decimal;
  assetId: AssetId | CombinatorialToken;
  underlyingMarketIds?: number[];
}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const signer = wallet?.activeAccount;
  const notificationStore = useNotifications();
  const baseAsset = parseAssetIdString(market.baseAsset);
  const { data: baseAssetMetadata } = useAssetMetadata(baseAsset);

  const tokenIndex = useMemo(() => {
    if(isCombinatorialToken(assetId)) {
      const index = market.outcomeAssets.findIndex(asset => asset.includes(assetId.CombinatorialToken));
      const indexSet = Array(market.outcomeAssets.length).fill(false);
      indexSet[index] = true;
      return indexSet;
    }
    return [];
  }, [assetId, market.outcomeAssets]);


  const isCombinatorialMarket = market.outcomeAssets.some(asset => asset.includes("combinatorialToken"));


  const { isLoading, isSuccess, send } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk) || !signer) return;
      if(isCombinatorialMarket)
      {
        // For multi-market positions, pass the underlying market IDs array. 
        // Multi-markets use first marketId as parent and second marketId as child for splitting positions.
        const marketIds = underlyingMarketIds && underlyingMarketIds.length > 0
          ? underlyingMarketIds[1].toString()
          : market.marketId.toString();

        return sdk.api.tx.combinatorialTokens.redeemPosition(null, marketIds, tokenIndex, { total: 16, consumeAll: true });
      } else {
        return sdk.api.tx.predictionMarkets.redeemShares(market.marketId);
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification(
          `Redeemed ${value.toFixed(2)} ${baseAssetMetadata?.symbol}`,
          {
            type: "Success",
          },
        );
      },
    },
  );

  const handleClick = () => send();

  return (
    <>
      {isSuccess ? (
        <span className="font-bold text-green-500">Redeemed Tokens!</span>
      ) : (
        <SecondaryButton
          onClick={handleClick}
          disabled={isLoading || value.eq(0)}
        >
          Redeem Tokens
        </SecondaryButton>
      )}
    </>
  );
};
