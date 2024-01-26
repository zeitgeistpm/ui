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
        const amount = new Decimal(liquidity.amount).mul(ZTG).toFixed(0);
        return sdk.api.tx.utility.batchAll([
          sdk.api.tx.predictionMarkets.buyCompleteSet(marketId, amount),
          sdk.api.tx.neoSwaps.deployPool(
            marketId,
            new Decimal(liquidity.amount).mul(ZTG).toFixed(0),
            liquidity.rows.map((row) =>
              new Decimal(row.price.price).mul(ZTG).toFixed(0),
            ),
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
              <LiquidityInput
                name="poolDeployer"
                value={liquidity ?? undefined}
                currency={currencyMetadata?.name ?? "ZTG"}
                onChange={handleLiquidityChange}
                fieldState={fieldState}
              />

              <div className="center mt-4 h-6 text-vermilion">
                <ErrorMessage field={fieldState} />
              </div>
            </div>
            <div className="text-center">
              <TransactionButton
                className="mb-4 ml-ztg-8 w-ztg-266"
                onClick={() => deployAmm2Pool()}
                disabled={!fieldState.isValid || isLoading}
              >
                Deploy Pool
              </TransactionButton>

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
