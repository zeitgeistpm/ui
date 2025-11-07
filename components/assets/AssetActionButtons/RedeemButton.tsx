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
import { useMarket } from "lib/hooks/queries/useMarket";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { calcScalarWinnings } from "lib/util/calc-scalar-winnings";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import {
  CombinatorialToken,
  isCombinatorialToken,
} from "lib/types/combinatorial";
import { VirtualMarket } from "lib/types";
import { useMemo } from "react";

export type RedeemButtonProps = {
  market: Market<IndexerContext>;
  assetId: AssetId;
  underlyingMarketIds?: number[];
  isPartialRedemption?: boolean; // True when only child market is resolved
  parentCollectionIds?: string[]; // Array of parent collection IDs for multi-markets
  showBalance?: boolean; // Whether to display the token balance
};

export const RedeemButton = (props: RedeemButtonProps) => {
  return <RedeemButtonByAssetId {...props} />;
};

export default RedeemButton;

export const RedeemButtonByAssetId = ({
  market,
  assetId,
  underlyingMarketIds,
  isPartialRedemption = false,
  parentCollectionIds,
  showBalance = false,
}: {
  market: Market<IndexerContext>;
  assetId: AssetId;
  underlyingMarketIds?: number[];
  isPartialRedemption?: boolean;
  parentCollectionIds?: string[];
  showBalance?: boolean;
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

  // Fetch child market data for multi-markets to get accurate numChildOutcomes
  const childMarketId =
    underlyingMarketIds && underlyingMarketIds.length > 1
      ? underlyingMarketIds[1]
      : undefined;
  const { data: childMarket } = useMarket(
    childMarketId != null ? { marketId: childMarketId } : undefined,
  );

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
      // For multi-markets: parent is marketIds[0], child is marketIds[1]
      // Outcomes are organized as: [Parent0-Child0, Parent0-Child1, ..., Parent1-Child0, Parent1-Child1, ...]

      const tokenIndex = market.outcomeAssets.findIndex((asset) =>
        asset.includes(assetId.CombinatorialToken),
      );

      if (tokenIndex === -1) return zero;

      // Calculate the number of child outcomes with fallbacks:
      // 1. For multi-markets: use the actual child market data (from underlyingMarketIds[1])
      // 2. For single-market combos: use market.categories?.length
      // 3. Calculate from totalCombinations / numParentOutcomes if parentCollectionIds available
      let numChildOutcomes = 0;

      if (childMarket) {
        // Multi-market: use child market's actual outcome count
        numChildOutcomes =
          childMarket.categories?.length ||
          (childMarket.marketType?.scalar ? 2 : 0);
      } else if (market.categories?.length) {
        // Single-market combinatorial or fallback: use virtual market's categories
        numChildOutcomes = market.categories.length;
      } else if (
        parentCollectionIds &&
        parentCollectionIds.length > 0 &&
        market.outcomeAssets.length > 0
      ) {
        // Calculate from total combinations divided by parent outcomes
        const totalCombinations = market.outcomeAssets.length;
        const numParentOutcomes = parentCollectionIds.length;
        numChildOutcomes = Math.floor(totalCombinations / numParentOutcomes);
      }

      // Guard against division by zero - only return zero as last resort
      if (numChildOutcomes === 0) {
        return zero;
      }

      if (isPartialRedemption) {
        // Partial redemption: child market resolved, parent market still active
        // Can redeem if the child outcome matches the resolved child outcome
        // tokenIndex = (parentOutcome * numChildOutcomes) + childOutcome
        // So: childOutcome = tokenIndex % numChildOutcomes

        // For partial redemption, allow redemption of all positions
        // The blockchain will handle filtering based on the resolved child market
        const balance = getAccountAssetBalance(realAddress, assetId)?.data
          ?.balance;
        return balance?.div(ZTG) || zero;
      }

      // For full redemption (both markets resolved)
      // Handle scalar markets: multiple positions may have value
      const virtualMarket = market as VirtualMarket;
      const isParentScalar = virtualMarket.neoPool?.isParentScalar ?? false;
      const isChildScalar = virtualMarket.neoPool?.isChildScalar ?? false;

      if (market.resolvedOutcome === null && isParentScalar) {
        // Parent is scalar - all positions may have value (blockchain calculates payouts)
        const balance = getAccountAssetBalance(realAddress, assetId)?.data
          ?.balance;
        return balance?.div(ZTG) || zero;
      }

      if (isChildScalar && !isParentScalar) {
        // Parent categorical, child scalar
        // Check if this position's parent outcome matches the resolved parent
        const parentResolvedIndex = Number(market.resolvedOutcome);
        const numChildOutcomes = 2; // Scalar has 2 outcomes
        const parentIndex = Math.floor(tokenIndex / numChildOutcomes);

        if (parentIndex === parentResolvedIndex) {
          // This position belongs to the resolved parent outcome
          // Blockchain will calculate correct payout based on scalar resolution
          const balance = getAccountAssetBalance(realAddress, assetId)?.data
            ?.balance;
          return balance?.div(ZTG) || zero;
        }
        return zero;
      }

      // Both categorical - only winning outcome has value
      if (tokenIndex === Number(market.resolvedOutcome)) {
        const balance = getAccountAssetBalance(realAddress, assetId)?.data
          ?.balance;
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
  }, [
    market,
    assetId,
    isLoadingAssetBalance,
    getAccountAssetBalance,
    isPartialRedemption,
    childMarket,
    realAddress,
    scalarBounds,
    parentCollectionIds,
  ]);

  const button = (
    <RedeemButtonByValue
      market={market}
      value={value ?? new Decimal(0)}
      assetId={assetId}
      underlyingMarketIds={underlyingMarketIds}
      parentCollectionIds={parentCollectionIds}
    />
  );

  if (showBalance) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">
          {isLoadingAssetBalance ? "..." : value?.toFixed(2) || "0.00"}
        </span>
        {button}
      </div>
    );
  }

  return button;
};

const RedeemButtonByValue = ({
  market,
  value,
  assetId,
  underlyingMarketIds,
  parentCollectionIds,
}: {
  market: Market<IndexerContext>;
  value: Decimal;
  assetId: AssetId | CombinatorialToken;
  underlyingMarketIds?: number[];
  parentCollectionIds?: string[];
}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const signer = wallet?.activeAccount;
  const notificationStore = useNotifications();
  const baseAsset = parseAssetIdString(market.baseAsset);
  const { data: baseAssetMetadata } = useAssetMetadata(baseAsset);

  const tokenIndexData = useMemo(() => {
    if (isCombinatorialToken(assetId)) {
      const absoluteIndex = market.outcomeAssets.findIndex((asset) =>
        asset.includes(assetId.CombinatorialToken),
      );

      // For multi-markets with parentCollectionIds, the index is relative to the parent collection
      // Each parentCollectionId represents one parent outcome combined with all child outcomes
      // tokenIndex = (parentOutcome * numChildOutcomes) + childOutcome
      // We need to create an index array of size [numChildOutcomes], not [totalCombinations]
      if (parentCollectionIds && parentCollectionIds.length > 0) {
        const numParentOutcomes = parentCollectionIds.length;
        const totalCombinations = market.outcomeAssets.length;

        // Rectangular grid assumption: outcomes are evenly distributed across parent × child matrix
        // totalCombinations = numParentOutcomes × numChildOutcomes
        // Market design guarantees this even distribution for combinatorial markets
        if (totalCombinations % numParentOutcomes !== 0) {
          console.error(
            `Invalid market structure: totalCombinations (${totalCombinations}) is not evenly divisible by numParentOutcomes (${numParentOutcomes})`
          );
        }
        const numChildOutcomes = Math.floor(totalCombinations / numParentOutcomes);

        // Calculate which child outcome this token represents within its parent collection
        const childOutcomeIndex = absoluteIndex % numChildOutcomes;

        // Create index array of size [numChildOutcomes]
        const indexSet = Array(numChildOutcomes).fill(false);
        indexSet[childOutcomeIndex] = true;
        return { indexSet, absoluteIndex };
      }

      // For single-market combinatorial, use the full index array
      const indexSet = Array(market.outcomeAssets.length).fill(false);
      indexSet[absoluteIndex] = true;
      return { indexSet, absoluteIndex };
    }
    return { indexSet: [], absoluteIndex: -1 };
  }, [assetId, market.outcomeAssets, parentCollectionIds]);

  const tokenIndex = tokenIndexData.indexSet;

  // Check if this is a combinatorial market (single-market or multi-market)
  // For single-market: outcomeAssets contain the string "combinatorialToken"
  // For multi-market: outcomeAssets are hex strings (0x...), or marketType is "Combinatorial"
  const isCombinatorialMarket =
    market.outcomeAssets.some((asset) =>
      asset.includes("combinatorialToken"),
    ) || // Single-market
    market.marketType.categorical === "Combinatorial" || // Multi-market
    (underlyingMarketIds && underlyingMarketIds.length > 0); // Multi-market with underlying IDs

  const { isLoading, isSuccess, send } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk) || !signer) return;
      if (isCombinatorialMarket) {
        // For multi-market positions, pass the underlying market IDs array.
        // Multi-markets use first marketId as parent and second marketId as child for splitting positions.
        const marketIds =
          underlyingMarketIds && underlyingMarketIds.length > 1
            ? underlyingMarketIds[1].toString()
            : market.marketId.toString();

        // Calculate which parentCollectionId to use based on absolute token index
        // tokenIndex = (parentOutcome * numChildOutcomes) + childOutcome
        // So parentOutcome = Math.floor(absoluteIndex / numChildOutcomes)
        // where numChildOutcomes = totalCombinations / numParentOutcomes
        let parentCollectionId: string | null = null;
        if (
          parentCollectionIds &&
          parentCollectionIds.length > 0 &&
          tokenIndexData.absoluteIndex !== -1
        ) {
          const numParentOutcomes = parentCollectionIds.length;
          const totalCombinations = market.outcomeAssets.length;

          // Rectangular grid assumption: outcomes are evenly distributed across parent × child matrix
          if (totalCombinations % numParentOutcomes !== 0) {
            console.error(
              `Invalid market structure: totalCombinations (${totalCombinations}) is not evenly divisible by numParentOutcomes (${numParentOutcomes})`
            );
          }
          const numChildOutcomes = Math.floor(totalCombinations / numParentOutcomes);
          const parentOutcomeIndex = Math.floor(
            tokenIndexData.absoluteIndex / numChildOutcomes,
          );
          parentCollectionId = parentCollectionIds[parentOutcomeIndex];
        }

        return sdk.api.tx.combinatorialTokens.redeemPosition(
          parentCollectionId,
          marketIds,
          tokenIndex,
          { total: 16, consumeAll: true },
        );
      } else {
        return sdk.api.tx.predictionMarkets.redeemShares(market.marketId);
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification(
          `Redeemed ${value.toFixed(2)} ${parentCollectionIds?.length && parentCollectionIds.length > 0 ? "parent market outcome tokens" : baseAssetMetadata?.symbol}`,
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
        <div className="flex items-center justify-center gap-2 rounded-lg border border-ztg-green-400/40 bg-ztg-green-500/20 px-3 py-1.5 shadow-md backdrop-blur-sm">
          <div className="h-2 w-2 rounded-full bg-ztg-green-400"></div>
          <span className="text-sm font-semibold text-ztg-green-400">
            Redeemed Tokens!
          </span>
        </div>
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
