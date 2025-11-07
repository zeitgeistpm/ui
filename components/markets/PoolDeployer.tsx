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

import { ErrorMessage } from "components/create/editor/ErrorMessage";
import { LiquidityInput } from "components/create/editor/inputs/Liquidity";
import { FormEvent } from "components/create/editor/types";
import { Loader } from "components/ui/Loader";
import { LuFileWarning } from "react-icons/lu";
import { getMetadataForCurrencyByAssetId } from "lib/constants/supported-currencies";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { minBaseLiquidity } from "lib/state/market-creation/constants/currency";
import { swapFeePresets } from "lib/state/market-creation/constants/swap-fee";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import { Liquidity } from "lib/state/market-creation/types/form";
import { IOLiquidity } from "lib/state/market-creation/types/validation";
import { useMemo, useState } from "react";

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
    isLoading,
    isSuccess,
  } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && liquidity?.amount && liquidity.rows) {
        const liquidityAmount = new Decimal(liquidity.amount)
          .mul(ZTG)
          .toFixed(0);
        const asset_count = liquidity.rows.length;

        return sdk.api.tx.neoSwaps.deployCombinatorialPool(
          asset_count,
          [marketId],
          new Decimal(liquidity.amount).mul(ZTG).toFixed(0),
          liquidity.rows.map((row) =>
            new Decimal(row.price.price).mul(ZTG).toFixed(0),
          ),
          swapFeeFromFloat(liquidity.swapFee?.value).toString(),
          { total: 16, consumeAll: true },
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

  const poolCost = liquidity?.amount;

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
    const outcomes = market?.categories ?? [];
    const numOutcomes = outcomes.length ?? 0;

    const ratio = 1 / numOutcomes;

    const rows: Liquidity["rows"] = [
      ...outcomes.map((outcome) => {
        return {
          asset: outcome.name ?? "unknown",
          amount: `${amountNum}`,
          price: {
            price: ratio.toString(),
            locked: false,
          },
          value: `${(amountNum * ratio).toFixed(4)}`,
        };
      }),
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
      return activeBalance?.div(ZTG).greaterThanOrEqualTo(poolCost || 0);
    }, "Insufficient balance to deploy pool.")
      .refine((liquidity) => {
        return new Decimal(liquidity.rows?.[0]?.amount || 0).greaterThan(0);
      }, "Liquidity amount must be a positive number.")
      .refine(
        (liquidity) => {
          return (
            currencyMetadata &&
            new Decimal(liquidity.rows?.[0]?.amount || 0).greaterThanOrEqualTo(
              minBaseLiquidity[currencyMetadata.name],
            )
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
      {isSuccess ? (
        <></>
      ) : liquidity && isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-4 rounded-lg bg-white/5 p-6 shadow-md backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center">
              <Loader variant="Info" loading className="h-12 w-12" />
            </div>
            <h4 className="text-sm font-semibold text-white/90">
              Deploying pool...
            </h4>
          </div>
        </div>
      ) : poolId == null ? (
        liquidity ? (
          <div className="space-y-6 py-6">
            <div>
              <h4 className="mb-2 text-lg font-bold text-white md:text-xl">
                Deploy Pool
              </h4>
              <p className="text-sm text-white/70">
                Configure liquidity settings for this market
              </p>
            </div>
            <div
              className={`space-y-4 rounded-lg border-2 bg-white/5 p-4 shadow-md transition-all ${
                !fieldState.isValid && fieldState.isTouched
                  ? "border-red-500/60"
                  : "border-transparent"
              }`}
            >
              <LiquidityInput
                name="poolDeployer"
                value={liquidity ?? undefined}
                currency={currencyMetadata?.name ?? "ZTG"}
                onChange={handleLiquidityChange}
                fieldState={fieldState}
              />

              {!fieldState.isValid && fieldState.isTouched && (
                <div className="flex items-start gap-1.5 text-xs text-red-400">
                  <LuFileWarning size={14} className="mt-0.5 shrink-0" />
                  <ErrorMessage field={fieldState} />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-4">
              <TransactionButton
                className="w-full rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-md backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:px-8 md:py-3 md:text-base"
                onClick={() => deployAmm2Pool()}
                disabled={!fieldState.isValid || isLoading}
              >
                {isLoading ? "Deploying..." : "Deploy Pool"}
              </TransactionButton>

              <div className="text-center">
                <span className="text-xs font-medium text-white/70">
                  Total Cost:{" "}
                </span>
                <span className="text-sm font-semibold text-white">
                  {poolCost}{" "}
                  {currencyMetadata?.name || constants?.tokenSymbol || "ZTG"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {market?.status === "Active" && (
              <div className="flex items-center justify-center py-6">
                <button
                  className="rounded-lg border-2 border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-md backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20 hover:shadow-lg active:scale-95 md:px-8 md:py-3 md:text-base"
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
