import { Dialog } from "@headlessui/react";
import { AssetId, ZTG } from "@zeitgeistpm/sdk-next";
import AddressInput from "components/ui/AddressInput";
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
import { useWallet } from "lib/state/wallet";
import { formatNumberLocalized } from "lib/util";
import { isEmpty } from "lodash-es";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

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

const TransferModal = ({
  assetId,
  address,
}: {
  assetId: AssetId;
  address: string;
}) => {
  const { data: assetMetadata, isSuccess } = useAllAssetMetadata();

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
    formState: { errors },
  } = useForm<{ asset: { amount: string; assetOption?: AssetOption } }>({
    reValidateMode: "onChange",
    mode: "all",
  });

  const asset = watch("asset");
  const { data: balance } = useBalance(address, asset?.assetOption?.value);

  return (
    <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
      <h3 className="text-center mb-5 text-lg font-bold">On-Chain Transfers</h3>
      <form
        className="flex flex-col"
        onSubmit={handleSubmit((data) => console.log(data))}
      >
        <div className="flex justify-between mb-2 text-sm font-semibold">
          <div>Select Asset and Amount</div>
          {balance && (
            <div>
              Balance: {formatNumberLocalized(balance?.div(ZTG).toNumber())}
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
                if (v.amount === "0") {
                  return "Values must be greater than 0";
                }
                if (!v.assetOption) {
                  return "Currency selection missing";
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
        <AddressInput />
        <div className="mb-3 text-sm text-center">
          <span className="text-sky-600">Transfer Fee: 0.75 ZTG</span>
        </div>
        <FormTransactionButton disabled={!isEmpty(errors)}>
          Transfer
        </FormTransactionButton>
      </form>
    </Dialog.Panel>
  );
};

export default TransferButton;
