import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
import GlassSlider from "components/ui/GlassSlider";
import Input from "components/ui/Input";
import Decimal from "decimal.js";
import { DEFAULT_SLIPPAGE_PERCENTAGE } from "lib/constants";
import { Amm2Pool, amm2PoolKey } from "lib/hooks/queries/amm2/useAmm2Pool";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { lookupAssetMetadata, useMarket } from "lib/hooks/queries/useMarket";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { getPoolIdForTransaction } from "lib/util/get-pool-id";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

const ExitPoolForm = ({
  marketId,
  pool,
  baseAssetTicker,
  onSuccess,
  virtualMarket,
}: {
  marketId: number;
  pool: Amm2Pool;
  baseAssetTicker?: string;
  onSuccess?: () => void;
  virtualMarket?: any;
}) => {
  const { data: constants } = useChainConstants();
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    getValues,

    formState,
  } = useForm({
    reValidateMode: "onChange",
    mode: "all",
  });
  const poolSharesPercentageValue = watch("poolSharesPercentage") || "0";
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotifications();
  const { realAddress } = useWallet();
  const userPoolShares = pool.accounts.find(
    (account) => account.address === realAddress,
  )?.shares;
  const userOwnershipRatio = userPoolShares?.div(pool.totalShares) ?? 0;

  const { data: market } = useMarket({ marketId });
  const activeMarket = virtualMarket || market;
  const queryClient = useQueryClient();
  const reserves = Array.from(pool.reserves).map((reserve) => reserve[1]);

  const poolAssets = pool?.assetIds;

  const { send: exitPool, isLoading } = useExtrinsic(
    () => {
      if (
        !constants ||
        !isRpcSdk(sdk) ||
        !pool ||
        !poolAssets ||
        !userPoolShares
      ) {
        return;
      }
      const formValue = getValues();
      const slippageMultiplier = (100 - DEFAULT_SLIPPAGE_PERCENTAGE) / 100;
      // todo: add exit fee for full implementation
      // const feeMultiplier = 1 - constants.swaps.exitFee;
      const feeMultiplier = 1;

      const poolSharesPercentage: string | undefined =
        formValue["poolSharesPercentage"];

      if (poolSharesPercentage == null) return;

      const poolSharesAmount = userPoolShares.mul(
        Number(poolSharesPercentage) / 100,
      );

      // Calculate minAssetsOut based on actual shares being burned, not form display values
      const sharesRatio = poolSharesAmount.div(pool.totalShares);

      const minAssetsOut = reserves.map((reserve) => {
        return reserve
          .mul(sharesRatio)
          .mul(slippageMultiplier)
          .mul(feeMultiplier)
          .toFixed(0, Decimal.ROUND_DOWN);
      });

      const poolIdForTx = getPoolIdForTransaction(pool, marketId);

      try {
        return sdk.api.tx.utility.batchAll([
          // shares can't be withdrawn without claiming fees first
          sdk.api.tx.neoSwaps.withdrawFees(poolIdForTx),
          sdk.api.tx.neoSwaps.exit(
            poolIdForTx,
            poolSharesAmount.toFixed(0),
            minAssetsOut,
          ),
        ]);
      } catch (error) {
        console.error(error);
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Exited pool", {
          type: "Success",
        });
        queryClient.invalidateQueries([id, amm2PoolKey, marketId]);
        // Invalidate balance queries for all pool assets
        queryClient.invalidateQueries({ queryKey: [id, "balance"] });
        onSuccess?.();
      },
    },
  );

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const changedByUser = type != null;
      if (!name) return;

      if (name === "poolSharesPercentage" && changedByUser) {
        const percentage = Number(value["poolSharesPercentage"]);

        reserves.forEach((reserve, index) => {
          setValue(
            index.toString(),
            reserve
              .mul(userOwnershipRatio)
              .mul(percentage / 100)
              .div(ZTG)
              .toFixed(3, Decimal.ROUND_DOWN),
            { shouldValidate: true },
          );
        });
      } else {
        const changedAsset = name;

        const userInput = value[changedAsset];
        if (
          changedAsset != null &&
          userInput != null &&
          userInput !== "" &&
          changedByUser
        ) {
          const changedAssetBalance = reserves[Number(changedAsset)];
          const poolToInputRatio = changedAssetBalance.div(ZTG).div(userInput);

          // recalculate asset amounts to keep ratio with user input
          reserves.forEach((reserve, index) => {
            if (index.toString() != changedAsset) {
              setValue(
                index.toString(),
                reserve
                  .div(poolToInputRatio)
                  .div(ZTG)
                  .toFixed(3, Decimal.ROUND_DOWN),
                { shouldValidate: true },
              );
            }
          });

          const userPoolBalance = changedAssetBalance.mul(userOwnershipRatio);

          const userPoolBalancePercentage = new Decimal(userInput)
            .mul(ZTG)
            .div(userPoolBalance);

          setValue(
            "poolSharesPercentage",
            userPoolBalancePercentage.mul(100).toString(),
          );
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, pool]);

  const onSubmit: SubmitHandler<any> = () => {
    exitPool();
  };
    return (
    <form className="flex flex-col gap-y-3 min-w-0 w-full" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex max-h-[220px] flex-col gap-y-3 overflow-y-auto no-scroll-bar py-2 md:max-h-[350px]">
        {activeMarket &&
          poolAssets?.map((assetId, index) => {
            const assetName = virtualMarket
              ? activeMarket.categories?.[index]?.name
              : lookupAssetMetadata(activeMarket, assetId)?.name;

            const poolAssetBalance =
              reserves?.[index]?.div(ZTG) ?? new Decimal(0);
            const userBalanceInPool = poolAssetBalance
              .mul(userOwnershipRatio)
              .toNumber();
            const hasError = !!formState.errors[index.toString()]?.message;

            return (
              <div
                key={index}
                className="relative w-full"
              >
                <div className="relative h-ztg-40">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-[40%] truncate capitalize text-xs leading-tight text-white/90 pointer-events-none">
                    {assetName}
                  </div>
                  <Input
                    className={`h-ztg-40 w-full rounded-lg border-2 px-3 py-0 text-right text-xs leading-none font-medium text-white shadow-sm backdrop-blur-sm transition-all focus:shadow-md focus:outline-none
              ${
                hasError
                  ? "border-ztg-red-500/60 bg-ztg-red-900/30 text-ztg-red-400 focus:border-ztg-red-500/80"
                  : "border-white/10 bg-white/10 text-white/90 hover:bg-white/15 focus:border-white/20 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
              }
              `}
                    key={index}
                    type="number"
                    step="any"
                    {...register(index.toString(), {
                      value: 0,
                      required: {
                        value: true,
                        message: "Value is required",
                      },
                      validate: (value: number) => {
                        if (value > userBalanceInPool) {
                          return `Insufficient pool shares. Max amount to withdraw is ${userBalanceInPool.toFixed(
                            3,
                          )}`;
                        } else if (value <= 0) {
                          return "Value cannot be zero or less";
                        } else if (
                          activeMarket?.status.toLowerCase() !== "resolved" &&
                          poolAssetBalance.minus(value).lessThanOrEqualTo(0.01)
                        ) {
                          return "Pool cannot be emptied completely before the market resolves";
                        }
                      },
                    })}
                  />
                </div>
                {hasError && (
                  <div className="mt-1.5 mb-0.5 text-xs md:text-sm font-medium text-ztg-red-400 min-h-[1.25rem]">
                    {String(formState.errors[index.toString()]?.message || '')}
                  </div>
                )}
              </div>
            );
          })}
      </div>
      <GlassSlider
        className="w-full"
        min="0"
        max="100"
        step="1"
        value={poolSharesPercentageValue}
        {...register("poolSharesPercentage", { min: 0, max: 100, value: "0" })}
      />
      <FormTransactionButton
        loading={isLoading}
        className="!h-10 !text-sm !font-medium"
        disabled={formState.isValid === false || isLoading}
      >
        Exit Pool
      </FormTransactionButton>
    </form>
  );
};

export default ExitPoolForm;
