import { useQueryClient } from "@tanstack/react-query";
import {
  IOForeignAssetId,
  IOZtgAssetId,
  isRpcSdk,
  parseAssetId,
  swapFeeFromFloat,
} from "@zeitgeistpm/sdk-next";
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
import { getMetadataForCurrencyByAssetId } from "lib/constants/supported-currencies";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { minBaseLiquidity } from "lib/state/market-creation/constants/currency";
import { swapFeePresets } from "lib/state/market-creation/constants/swap-fee";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import { Liquidity } from "lib/state/market-creation/types/form";
import { IOLiquidity } from "lib/state/market-creation/types/validation";
import { useMemo, useState } from "react";
import { Loader } from "components/ui/Loader";

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
    send: deployPool,
    isLoading,
    isSuccess,
    isBroadcasting,
  } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && liquidity) {
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

  const poolCost = liquidity?.rows
    ? calculatePoolCost(liquidity?.rows.map((row) => Number(row.amount)) ?? [])
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
    };

    setLiquidity(liquidity);
  };

  const handleLiquidityChange = (event: FormEvent<Liquidity>) => {
    setLiquidity(event.target.value);
  };

  const parser = useMemo(() => {
    return IOLiquidity.refine((liquidity) => {
      return activeBalance?.div(ZTG).greaterThanOrEqualTo(poolCost);
    }, "Insufficient balance to deploy pool.")
      .refine((liquidity) => {
        return new Decimal(liquidity.rows[0]?.amount || 0).greaterThan(0);
      }, "Liquidity amount must be a positive number.")
      .refine((liquidity) => {
        return (
          currencyMetadata &&
          new Decimal(liquidity.rows[0]?.amount || 0)
            .mul(2)
            .greaterThanOrEqualTo(minBaseLiquidity[currencyMetadata.name])
        );
      }, `Value has to exceed minimum liquidity of ${minBaseLiquidity[currencyMetadata?.name ?? "ZTG"]} ${currencyMetadata?.name ?? "ZTG"}.`);
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
      {isSuccess ? (
        <></>
      ) : liquidity && isBroadcasting ? (
        <div className="center">
          <div className="p-6 bg-slate-50 rounded-md center gap-4">
            <div className="h-12 w-12 center bg-inherit">
              <Loader variant="Info" loading className="h-12 w-12" />
            </div>
            <h4 className="text-gray-400">Deploying pool..</h4>
          </div>
        </div>
      ) : poolId == null ? (
        liquidity ? (
          <div className="my-ztg-20">
            <div>
              <h4 className="mt-10 mb-4 center">Deploy Pool</h4>
            </div>
            <div className="mb-12">
              <LiquidityInput
                name="poolDeployer"
                value={liquidity}
                currency={currencyMetadata?.name ?? "ZTG"}
                onChange={handleLiquidityChange}
                fieldState={fieldState}
              />
              <div className="center text-vermilion h-6 mt-4">
                <ErrorMessage field={fieldState} />
              </div>
            </div>
            <div className="text-center">
              <TransactionButton
                className="w-ztg-266 ml-ztg-8 mb-4"
                onClick={deployPool}
                disabled={!fieldState.isValid || isLoading || isBroadcasting}
              >
                Deploy Pool
              </TransactionButton>
              <div className="text-ztg-12-150 text-sky-600 font-bold ml-[27px]">
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
                  className="my-ztg-20 font-bold text-ztg-16-150 text-sky-600 border-1 px-ztg-20 py-ztg-10 rounded-ztg-10 border-sky-600"
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
