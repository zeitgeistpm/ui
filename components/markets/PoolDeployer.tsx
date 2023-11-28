import { useQueryClient } from "@tanstack/react-query";
import {
  IOForeignAssetId,
  IOZtgAssetId,
  isRpcSdk,
  parseAssetId,
  swapFeeFromFloat,
} from "@zeitgeistpm/sdk";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { accountPoolAssetBalancesRootKey } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketPoolId } from "lib/hooks/queries/useMarketPoolId";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { calculatePoolCost } from "lib/util/market";

import { ErrorMessage } from "components/create/editor/ErrorMessage";
import { LiquidityInput } from "components/create/editor/inputs/Liquidity";
import { FormEvent } from "components/create/editor/types";
import { Loader } from "components/ui/Loader";
import { getMetadataForCurrencyByAssetId } from "lib/constants/supported-currencies";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { minBaseLiquidity } from "lib/state/market-creation/constants/currency";
import { swapFeePresets } from "lib/state/market-creation/constants/swap-fee";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import { Liquidity } from "lib/state/market-creation/types/form";
import { IOLiquidity } from "lib/state/market-creation/types/validation";
import { useMemo, useState } from "react";
import { LiquidityInputAmm2 } from "components/create/editor/inputs/LiquidityAMM2";

const PoolDeployer = ({
  marketId,
  onPoolDeployed,
}: {
  marketId: number;
  onPoolDeployed?: () => void;
}) => {
  let { data: constants } = useChainConstants();
  const wallet = useWallet();
  const { data: poolId } = useMarketPoolId(marketId);
  const { data: market } = useMarket({ marketId });
  const queryClient = useQueryClient();
  const notificationStore = useNotifications();
  const [sdk, id] = useSdkv2();
  const [liquidity, setLiquidity] = useState<Liquidity | null>(null);

  const {
    send: deployAmm2Pool,
    isLoading: amm2IsLoading,
    isSuccess: amm2IsSuccess,
  } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && liquidity?.amount) {
        const amount = new Decimal(liquidity.amount).mul(ZTG).toFixed(0);
        return sdk.api.tx.utility.batchAll([
          sdk.api.tx.predictionMarkets.buyCompleteSet(marketId, amount),
          sdk.api.tx.neoSwaps.deployPool(
            marketId,
            new Decimal(liquidity.amount).mul(ZTG).toFixed(0),
            [0.5 * ZTG, 0.5 * ZTG], //todo: needs to be updated when we can support multiple assets
            swapFeeFromFloat(liquidity.swapFee?.value).toString(),
          ),
        ]);
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Liquidity pool deployed", {
          type: "Success",
        });
        queryClient.invalidateQueries([id, accountPoolAssetBalancesRootKey]);
        onPoolDeployed?.();
      },
    },
  );
  const {
    send: deployPool,
    isLoading,
    isSuccess,
    isBroadcasting,
  } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && liquidity?.rows) {
        // We are assuming all rows have the same amount
        const amount = liquidity.rows[0].amount;

        const weights = liquidity.rows.slice(0, -1).map((row) => {
          return new Decimal(row.weight)
            .mul(ZTG)
            .toFixed(0, Decimal.ROUND_DOWN);
        });

        return sdk.api.tx.predictionMarkets.deploySwapPoolAndAdditionalLiquidity(
          marketId,
          swapFeeFromFloat(liquidity.swapFee?.value).toString(),
          new Decimal(amount).mul(ZTG).toFixed(0),
          weights,
        );
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Liquidity pool deployed", {
          type: "Success",
        });
        queryClient.invalidateQueries([id, accountPoolAssetBalancesRootKey]);
        onPoolDeployed?.();
      },
    },
  );

  const isAmm2 = market?.scoringRule === "Lmsr";

  const poolCost = isAmm2
    ? liquidity?.amount
    : liquidity?.rows
      ? calculatePoolCost(
          liquidity?.rows.map((row) => Number(row.amount)) ?? [],
        )
      : "";

  const baseAssetId = useMemo(
    () =>
      parseAssetId(market?.baseAsset)
        .map((assetId) =>
          IOZtgAssetId.is(assetId) || IOForeignAssetId.is(assetId)
            ? assetId
            : null,
        )
        .unwrapOr<null>(null),
    [market?.baseAsset],
  );

  const currencyMetadata = useMemo(() => {
    if (baseAssetId) {
      return getMetadataForCurrencyByAssetId(baseAssetId);
    }
  }, [baseAssetId]);

  const { data: activeBalance } = useBalance(
    wallet.realAddress,
    currencyMetadata?.assetId,
  );

  const handleDeployClick = () => {
    const amountNum = minBaseLiquidity[currencyMetadata?.name ?? "ZTG"];
    const baseWeight = 64;
    const outcomes = market?.categories ?? [];
    const numOutcomes = outcomes.length ?? 0;

    const ratio = 1 / numOutcomes;
    const weight = ratio * baseWeight;

    const rows: Liquidity["rows"] = [
      ...outcomes.map((outcome) => {
        return {
          asset: outcome.name ?? "unknown",
          weight: weight.toFixed(0),
          amount: `${amountNum}`,
          price: {
            price: ratio.toString(),
            locked: false,
          },
          value: `${(amountNum * ratio).toFixed(4)}`,
        };
      }),
      {
        asset: currencyMetadata?.name ?? "ZTG",
        weight: baseWeight.toString(),
        amount: `${amountNum}`,
        price: {
          price: "1",
          locked: true,
        },
        value: `${amountNum}`,
      },
    ];

    const liquidity: Liquidity = {
      deploy: true,
      swapFee: swapFeePresets[0],
      rows,
      amount: amountNum.toString(),
    };

    setLiquidity(liquidity);
  };

  const handleLiquidityChange = (event: FormEvent<Liquidity>) => {
    setLiquidity(event.target.value);
  };

  const parser = useMemo(() => {
    return IOLiquidity.refine((liquidity) => {
      return activeBalance?.div(ZTG).greaterThanOrEqualTo(poolCost ?? 0);
    }, "Insufficient balance to deploy pool.")
      .refine((liquidity) => {
        return new Decimal(liquidity.rows?.[0]?.amount || 0).greaterThan(0);
      }, "Liquidity amount must be a positive number.")
      .refine(
        (liquidity) => {
          return (
            currencyMetadata &&
            new Decimal(liquidity.rows?.[0]?.amount || 0)
              .mul(2)
              .greaterThanOrEqualTo(minBaseLiquidity[currencyMetadata.name])
          );
        },
        `Value has to exceed minimum liquidity of ${
          minBaseLiquidity[currencyMetadata?.name ?? "ZTG"]
        } ${currencyMetadata?.name ?? "ZTG"}.`,
      );
  }, [activeBalance, poolCost]);

  const fieldState: FieldState = useMemo(() => {
    if (!liquidity) return { isValid: false, errors: [] };

    const parsed = parser.safeParse(liquidity);

    if (parsed.success) {
      return {
        isTouched: true,
        isValid: true,
        errors: [],
      };
    } else {
      return {
        isTouched: true,
        isValid: false,
        //TODO: have to any since type narrowing doesnt work without strict nulls
        errors: (parsed as any)?.error?.errors ?? [],
      };
    }
  }, [liquidity, activeBalance, poolCost]);

  return (
    <>
      {isSuccess || amm2IsSuccess ? (
        <></>
      ) : liquidity && isBroadcasting ? (
        <div className="center">
          <div className="center gap-4 rounded-md bg-slate-50 p-6">
            <div className="center h-12 w-12 bg-inherit">
              <Loader variant="Info" loading className="h-12 w-12" />
            </div>
            <h4 className="text-gray-400">Deploying pool..</h4>
          </div>
        </div>
      ) : poolId == null ? (
        liquidity ? (
          <div className="my-ztg-20">
            <div>
              <h4 className="center mb-4 mt-10">Deploy Pool</h4>
            </div>
            <div className="mb-12">
              {market?.scoringRule === "Lmsr" ? (
                <LiquidityInputAmm2
                  name="poolDeployer"
                  value={liquidity}
                  currency={currencyMetadata?.name ?? "ZTG"}
                  onChange={handleLiquidityChange}
                  fieldState={fieldState}
                />
              ) : (
                <LiquidityInput
                  name="poolDeployer"
                  value={liquidity ?? undefined}
                  currency={currencyMetadata?.name ?? "ZTG"}
                  onChange={handleLiquidityChange}
                  fieldState={fieldState}
                />
              )}
              <div className="center mt-4 h-6 text-vermilion">
                <ErrorMessage field={fieldState} />
              </div>
            </div>
            <div className="text-center">
              {market?.scoringRule === "Lmsr" ? (
                <TransactionButton
                  className="mb-4 ml-ztg-8 w-ztg-266"
                  onClick={() => deployAmm2Pool()}
                  disabled={!fieldState.isValid || amm2IsLoading}
                >
                  Deploy Pool
                </TransactionButton>
              ) : (
                <TransactionButton
                  className="mb-4 ml-ztg-8 w-ztg-266"
                  onClick={() => deployPool()}
                  disabled={!fieldState.isValid || isLoading || isBroadcasting}
                >
                  Deploy Pool
                </TransactionButton>
              )}
              <div className="ml-[27px] text-ztg-12-150 font-bold text-sky-600">
                Total Cost:
                <span className="font-mono">
                  {" "}
                  {poolCost} {constants?.tokenSymbol}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {market?.status === "Active" && (
              <div className="center">
                <button
                  className="my-ztg-20 rounded-ztg-10 border-1 border-sky-600 px-ztg-20 py-ztg-10 text-ztg-16-150 font-bold text-sky-600"
                  data-test="deployLiquidityButton"
                  onClick={handleDeployClick}
                >
                  Deploy Liquidity Pool
                </button>
              </div>
            )}
          </>
        )
      ) : (
        <></>
      )}
    </>
  );
};

export default PoolDeployer;
