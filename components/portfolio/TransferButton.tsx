import { Dialog } from "@headlessui/react";
import { AssetId, ZTG } from "@zeitgeistpm/sdk-next";
import AssetInput from "components/ui/AssetInput";
import AssetSelect, { AssetOption } from "components/ui/AssetSelect";
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
import React, { useEffect, useMemo, useState } from "react";

const isSupportedAsset = (id: number) => {
  return Object.keys(FOREIGN_ASSET_METADATA).includes(`${id}`);
};

const useTransferAssetOptions = (
  assetId: AssetId,
): {
  options: AssetOption[];
  selectedOption: AssetOption | undefined;
  setSelectedOption: (opt: AssetOption) => void;
} => {
  const { data: assetMetadata, isSuccess } = useAllAssetMetadata();
  const [selectedOption, setSelectedOption] = useState<
    AssetOption | undefined
  >();

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

  useEffect(() => {
    if (options.length === 0 || selectedOption !== undefined) {
      return;
    }
    const selected = options.find(
      (opt) => JSON.stringify(opt.value) === JSON.stringify(assetId),
    );
    setSelectedOption(selected);
  }, [options]);

  return {
    options,
    selectedOption,
    setSelectedOption,
  };
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
  const { options, selectedOption, setSelectedOption } =
    useTransferAssetOptions(assetId);

  const [amount, setAmount] = useState<string>("");

  const { data: balance } = useBalance(address, selectedOption?.value);

  return (
    <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
      <h3 className="text-center mb-5 text-lg font-bold">On-Chain Transfers</h3>
      <div className="flex flex-col">
        <div className="flex justify-between mb-3 text-sm font-semibold">
          <div>Select Asset and Amount</div>
          {balance && (
            <div>
              Balance: {formatNumberLocalized(balance?.div(ZTG).toNumber())}
            </div>
          )}
        </div>
        <div className="mb-5 h-14 w-full bg-anti-flash-white rounded-md relative">
          <AssetInput
            options={options}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            amount={amount}
            setAmount={setAmount}
          />
        </div>
        <div className="mb-3 text-sm font-semibold">To Address</div>
        <div className="mb-5 h-14 w-full bg-anti-flash-white rounded-md">
          Account Select
        </div>
        <div className="mb-3 text-sm text-center">
          <span className="text-sky-600">Transfer Fee: 0.75 ZTG</span>
        </div>
        <FormTransactionButton
          className="w-full max-w-[250px]"
          // disabled={formState.isValid === false || isLoading}
        >
          Transfer
        </FormTransactionButton>
      </div>
    </Dialog.Panel>
  );
};

export default TransferButton;
