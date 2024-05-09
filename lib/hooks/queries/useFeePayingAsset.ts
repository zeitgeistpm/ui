import { UseQueryResult, useQuery } from "@tanstack/react-query";
import {
  AssetId,
  IOCampaignAssetId,
  IOForeignAssetId,
  IOZtgAssetId,
  ZTG,
} from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import useFeePayingAssetSelection from "lib/state/fee-paying-asset";
import { useWallet } from "lib/state/wallet";
import { AssetMetadata, useAllAssetMetadata } from "./useAssetMetadata";
import { ChainConstants, useChainConstants } from "./useChainConstants";
import { CurrencyBalance } from "./useCurrencyBalances";
import { useForeignAssetBalances } from "./useForeignAssetBalances";
import { useZtgBalance } from "./useZtgBalance";
import { useBalance } from "./useBalance";
import { isCampaignAsset, campaignID } from "lib/constants";

type FeeAsset = {
  assetId: AssetId;
  symbol: string;
  amount: Decimal;
  sufficientBalance: boolean;
};

// 2% buffer, extrinsic fees paid in foreign assets take a little more computation (approx 1.6%)
const foreignAssetFeeBuffer = 1.02;

export const feePayingAssetKey = "fee-paying-asset";

export const useFeePayingAsset = (
  baseFee?: Decimal,
): UseQueryResult<FeeAsset | null> => {
  const { activeAccount: activeAccount } = useWallet();
  const { data: nativeBalance } = useZtgBalance(activeAccount?.address);
  const { data: foreignAssetBalances } = useForeignAssetBalances(
    activeAccount?.address,
  );

  const { data: campaignAssetBalance } = useBalance(activeAccount?.address, {
    CampaignAsset: campaignID,
  });

  const { data: constants } = useChainConstants();
  const { data: assetMetadata } = useAllAssetMetadata();

  const { assetSelection } = useFeePayingAssetSelection();
  const enabled =
    !!nativeBalance &&
    !!foreignAssetBalances &&
    !!campaignAssetBalance &&
    !!activeAccount &&
    !!assetMetadata &&
    !!baseFee &&
    !!constants;

  const query = useQuery(
    [
      feePayingAssetKey,
      activeAccount?.address,
      nativeBalance,
      foreignAssetBalances,
      baseFee,
      assetSelection,
    ],
    async () => {
      if (enabled) {
        if (assetSelection.label === "Default" && !isCampaignAsset) {
          // if user has ztg, use that to pay
          if (nativeBalance.greaterThanOrEqualTo(baseFee)) {
            return {
              assetId: { Ztg: null },
              symbol: constants?.tokenSymbol ?? "",
              amount: baseFee,
              sufficientBalance: true,
            };
          }

          return findBestFeePayingAsset(
            foreignAssetBalances,
            assetMetadata,
            baseFee,
            constants,
          );
        } else {
          const isNative = IOZtgAssetId.is(assetSelection.value);
          if (isNative) {
            return {
              assetId: { Ztg: null },
              symbol: constants?.tokenSymbol ?? "",
              amount: baseFee,
              sufficientBalance: true,
            };
          } else if (IOCampaignAssetId.is(assetSelection.value)) {
            const balance = campaignAssetBalance;
            const metadata = assetMetadata?.find(
              (data) =>
                IOCampaignAssetId.is(assetSelection.value) &&
                assetSelection.value.CampaignAsset === data[0],
            )?.[1];
            const totalZtgIssuance = assetMetadata[0][1].totalIssuance;
            const feeFactor = metadata?.feeFactor;
            const totalCampaignAssetIssuance = metadata?.totalIssuance;
            const fee =
              feeFactor &&
              totalCampaignAssetIssuance &&
              totalZtgIssuance &&
              baseFee
                .mul(feeFactor)
                .mul(totalCampaignAssetIssuance)
                .div(totalZtgIssuance);
            if (metadata && fee && balance) {
              return {
                assetId: assetSelection.value,
                symbol: metadata?.symbol,
                amount: fee,
                sufficientBalance: fee && balance?.greaterThan(fee),
              };
            }
          } else if (IOForeignAssetId.is(assetSelection.value)) {
            const balance = foreignAssetBalances.find(
              (asset) =>
                IOForeignAssetId.is(assetSelection.value) &&
                assetSelection.value.ForeignAsset === asset.foreignAssetId,
            );
            const metadata = assetMetadata?.find(
              (data) =>
                IOForeignAssetId.is(assetSelection.value) &&
                assetSelection.value.ForeignAsset === data[0],
            )?.[1];

            const feeFactor = metadata?.feeFactor.div(ZTG);
            const fee =
              feeFactor && baseFee.mul(feeFactor).mul(foreignAssetFeeBuffer);

            if (metadata && fee && balance) {
              return {
                assetId: assetSelection.value,
                symbol: metadata?.symbol,
                amount: fee,
                sufficientBalance: fee && balance?.balance.greaterThan(fee),
              };
            }
          }
        }
      }
      return null;
    },
    {
      enabled: enabled,
    },
  );
  return query;
};

const findBestFeePayingAsset = (
  foreignAssetBalances: CurrencyBalance[],
  assetMetadata: [number | "Ztg", AssetMetadata][],
  baseFee: Decimal,
  constants: ChainConstants,
) => {
  // find first available asset to pay fee, else just return native asset
  const availableAsset = foreignAssetBalances.find((asset) => {
    const feeFactor = findFeeFactor(assetMetadata, asset);
    if (feeFactor) {
      return asset.balance.greaterThan(
        baseFee.mul(feeFactor).mul(foreignAssetFeeBuffer),
      );
    }
  });

  if (availableAsset && availableAsset.foreignAssetId != null) {
    const feeFactor =
      availableAsset && findFeeFactor(assetMetadata, availableAsset);
    return {
      assetId: {
        ForeignAsset: availableAsset.foreignAssetId,
      },
      symbol: availableAsset.symbol,
      amount: baseFee.mul(feeFactor ?? 1).mul(foreignAssetFeeBuffer),
      sufficientBalance: true,
    };
  } else {
    return {
      assetId: { Ztg: null },
      symbol: constants?.tokenSymbol ?? "",
      amount: baseFee,
      sufficientBalance: false,
    };
  }
};

const findFeeFactor = (
  assetMetadata: [number | "Ztg", AssetMetadata][],
  asset: CurrencyBalance,
) => {
  return assetMetadata
    .find((data) => asset.foreignAssetId === data[0])?.[1]
    .feeFactor.div(ZTG);
};
