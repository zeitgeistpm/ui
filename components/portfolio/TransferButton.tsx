import { Dialog } from "@headlessui/react";
import Decimal from "decimal.js";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { ApiPromise } from "@polkadot/api";
import { encodeAddress } from "@polkadot/keyring";
import {
  AssetId,
  IOForeignAssetId,
  ZTG,
  isRpcSdk,
} from "@zeitgeistpm/sdk-next";
import AddressInput, { AddressOption } from "components/ui/AddressInput";
import AssetInput from "components/ui/AssetInput";
import { AssetOption } from "components/ui/AssetSelect";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Modal from "components/ui/Modal";
import SecondaryButton from "components/ui/SecondaryButton";
import {
  FOREIGN_ASSET_METADATA,
  findAssetImageForSymbol,
} from "lib/constants/foreign-asset";
import { useAllAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useExtrinsicFee } from "lib/hooks/queries/useExtrinsicFee";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useWallet } from "lib/state/wallet";
import { formatNumberLocalized, isValidPolkadotAddress } from "lib/util";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useNotifications } from "lib/state/notifications";

const isSupportedAsset = (id: number) => {
  return Object.keys(FOREIGN_ASSET_METADATA).includes(`${id}`);
};

export type TransferButtonProps = {
  assetId: AssetId;
};

const TransferButton: React.FC<TransferButtonProps> = ({ assetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wallet = useWallet();
  const address = wallet.activeAccount?.address;

  return (
    <>
      <SecondaryButton onClick={() => setIsOpen(true)} disabled={!address}>
        Transfer
      </SecondaryButton>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        {address && <TransferModal assetId={assetId} address={address} />}
      </Modal>
    </>
  );
};

const createTransferExtrinsic = (
  api: ApiPromise,
  assetId: AssetId,
  amount: string,
  destAddress: string,
) => {
  amount = new Decimal(amount).mul(ZTG).toFixed(0, Decimal.ROUND_FLOOR);
  return api.tx.assetManager.transfer(destAddress, assetId, amount);
};

const TransferModal = ({
  assetId,
  address,
}: {
  assetId: AssetId;
  address: string;
}) => {
  const { data: assetMetadata, isSuccess } = useAllAssetMetadata();
  const { data: chainConstants } = useChainConstants();
  const notifications = useNotifications();

  const options = useMemo<AssetOption[]>(() => {
    if (!isSuccess) {
      return [];
    }
    let options: AssetOption[] = [];
    for (const [id, meta] of assetMetadata) {
      if (id === "Ztg") {
        options = [
          ...options,
          {
            label: meta.symbol,
            value: { Ztg: null },
            image: findAssetImageForSymbol(),
          },
        ];
      } else {
        if (!isSupportedAsset(id)) {
          continue;
        }
        options = [
          ...options,
          {
            label: meta.symbol,
            value: { ForeignAsset: id },
            image: findAssetImageForSymbol(meta.symbol),
          },
        ];
      }
    }
    return options;
  }, [assetMetadata, isSuccess]);

  const defaultOption = options.find(
    (opt) => JSON.stringify(opt.value) === JSON.stringify(assetId),
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<{
    asset: { amount: string; assetOption?: AssetOption };
    address: AddressOption | null;
  }>({
    reValidateMode: "onChange",
    mode: "all",
  });

  const asset = watch("asset");
  const isNativeCurrency = !IOForeignAssetId.is(asset?.assetOption?.value);

  const { data: balanceRaw } = useBalance(address, asset?.assetOption?.value);
  const balance = balanceRaw?.div(ZTG);

  const targetAddress = watch("address");

  const wallet = useWallet();
  const [sdk] = useSdkv2();

  // Dummy extrinsic for fee calculation since real extrinsic depends on form values
  // Don't use this for anything else but fetching the fee
  const feeExtrinsic = useMemo(() => {
    if (!isRpcSdk(sdk)) {
      return;
    }
    return createTransferExtrinsic(
      sdk.api,
      { Ztg: null },
      "1",
      encodeAddress(new Uint8Array(32)),
    );
  }, [sdk]);

  const extrinsic = useMemo(() => {
    if (
      !(
        isRpcSdk(sdk) &&
        wallet.activeAccount &&
        asset?.assetOption?.value &&
        targetAddress?.value &&
        asset?.amount &&
        isValid
      )
    ) {
      return;
    }
    return createTransferExtrinsic(
      sdk.api,
      asset.assetOption.value,
      asset.amount,
      targetAddress.value,
    );
  }, [
    wallet.activeAccount,
    asset?.assetOption?.value,
    targetAddress?.value,
    isValid,
  ]);

  const { data: feeRaw } = useExtrinsicFee(feeExtrinsic);
  const fee = feeRaw && new Decimal(feeRaw).div(ZTG);

  let maxAmount = "";

  if (balance) {
    if (isNativeCurrency) {
      maxAmount = balance.sub(fee ?? 0).toString();
    } else {
      maxAmount = balance.toString();
    }
  }

  const { send, isLoading: txIsLoading } = useExtrinsic(
    () => {
      return extrinsic;
    },
    {
      onSuccess: () => {
        notifications.pushNotification(
          `Successfully transfered ${asset.amount} ${asset.assetOption?.label} to ${targetAddress?.label}`,
          {
            type: "Success",
          },
        );
        reset({
          asset: { amount: "", assetOption: defaultOption },
          address: null,
        });
      },
    },
  );

  const submit = () => {
    if (!isValid) return;
    send();
  };

  return (
    <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
      <h3 className="text-center mb-5 text-lg font-bold">On-Chain Transfers</h3>
      <form className="flex flex-col" onSubmit={handleSubmit(submit)}>
        <div className="flex justify-between mb-2 text-sm font-semibold">
          <div>Select Asset and Amount</div>
          {balance && (
            <div
              className="cursor-pointer"
              onClick={() => {
                if (!maxAmount) return;
                setValue(
                  "asset",
                  { ...asset, amount: maxAmount },
                  { shouldValidate: true },
                );
              }}
            >
              Balance: {formatNumberLocalized(balance?.toNumber())}
            </div>
          )}
        </div>
        {defaultOption && (
          <Controller
            control={control}
            name="asset"
            defaultValue={{ amount: "", assetOption: defaultOption }}
            rules={{
              validate: (v) => {
                if (v.amount === "") {
                  return "Value is required";
                }
                if (Number(v.amount) <= 0) {
                  return "Value cannot be zero or less";
                }
                if (!v.assetOption) {
                  return "Currency selection missing";
                }
                if (
                  (isNativeCurrency && fee && balance?.sub(fee).lt(v.amount)) ||
                  balance?.lt(v.amount)
                ) {
                  return "Insufficient balance";
                }
              },
            }}
            render={({ field: { onChange, value } }) => {
              return (
                <AssetInput
                  options={options}
                  error={errors.asset?.message}
                  amount={value.amount}
                  selectedOption={value.assetOption}
                  onAssetChange={(opt) => {
                    onChange({ ...value, assetOption: opt });
                  }}
                  onAmountChange={(amount) => {
                    onChange({ ...value, amount });
                  }}
                />
              );
            }}
          />
        )}
        <div className="mb-2 text-sm font-semibold">To Address</div>
        <Controller
          name="address"
          control={control}
          rules={{
            validate: (v) => {
              if (!v) {
                return "Value is required";
              }
              if (!isValidPolkadotAddress(v.value)) {
                return "Not a valid address";
              }
            },
          }}
          render={({ field: { onChange } }) => {
            return (
              <AddressInput
                onChange={(opt) => onChange(opt)}
                value={targetAddress}
                error={errors.address?.message}
              />
            );
          }}
        />
        <div className="mb-3 text-sm text-center">
          <span className="text-sky-600">
            Transfer Fee:{" "}
            {fee ? `${fee.toFixed(4)} ${chainConstants?.tokenSymbol}` : ""}
          </span>
        </div>
        <FormTransactionButton disabled={!isValid || txIsLoading}>
          Transfer
        </FormTransactionButton>
      </form>
    </Dialog.Panel>
  );
};

export default TransferButton;