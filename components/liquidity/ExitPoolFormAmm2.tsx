import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
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

      const minAssetsOut = poolAssets.map((assetId, index) => {
        const assetAmount = formValue[index] ?? 0;
        return assetAmount === ""
          ? "0"
          : new Decimal(assetAmount)
              .mul(ZTG)
              .mul(slippageMultiplier)
              .mul(feeMultiplier)
              .toFixed(0, Decimal.ROUND_DOWN);
      });

      const poolSharesPercentage: string | undefined =
        formValue["poolSharesPercentage"];

      if (poolSharesPercentage == null) return;

      const poolSharesAmount = userPoolShares.mul(
        Number(poolSharesPercentage) / 100,
      );
      try {
        return sdk.api.tx.utility.batchAll([
          // shares can't be withdrawn without claiming fees first
          sdk.api.tx.neoSwaps.withdrawFees(marketId),
          sdk.api.tx.neoSwaps.exit(
            marketId,
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
    <form className="flex flex-col gap-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex max-h-[200px] flex-col gap-y-6 overflow-y-auto py-5 md:max-h-[400px]">
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

            return (
              <div
                key={index}
                className="relative h-[56px] w-full text-ztg-18-150 font-medium"
              >
                <div className="absolute left-[15px] top-[14px] h-full w-[40%] truncate capitalize">
                  {assetName}
                </div>
                <Input
                  className={`h-[56px] w-full rounded-[5px] bg-anti-flash-white px-[15px] text-right outline-none
              ${
                formState.errors[index.toString()]?.message
                  ? "border-2 border-vermilion text-vermilion"
                  : ""
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
                <div className="mt-[4px] text-ztg-12-120 text-red-500">
                  <>{formState.errors[index.toString()]?.message}</>
                </div>
              </div>
            );
          })}
      </div>
      <input
        className="my-[20px]"
        type="range"
        {...register("poolSharesPercentage", { min: 0, value: "0" })}
      />
      <FormTransactionButton
        loading={isLoading}
        disabled={formState.isValid === false || isLoading}
      >
        Exit Pool
      </FormTransactionButton>
    </form>
  );
};

export default ExitPoolForm;
