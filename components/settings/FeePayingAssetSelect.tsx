import { Transition } from "@headlessui/react";
import AssetSelect, { AssetOption } from "components/ui/AssetSelect";
import {
  FOREIGN_ASSET_METADATA,
  findAssetImageForSymbol,
} from "lib/constants/foreign-asset";
import { useAllAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import useFeePayingAssetSelection from "lib/state/fee-paying-asset";
import { Fragment, useMemo, useState } from "react";
import { Check } from "react-feather";

const isSupportedAsset = (id: number) => {
  return Object.keys(FOREIGN_ASSET_METADATA).includes(`${id}`);
};

const defaultSelection = {
  label: "Default",
  additionalText: "Uses first available asset",
};

const FeePayingAssetSelect = () => {
  const { data: assetMetadata, isSuccess } = useAllAssetMetadata();
  const { assetSelection, setAsset } = useFeePayingAssetSelection();
  const [showSaved, setShowSaved] = useState(false);

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

    options.push(defaultSelection);
    return options;
  }, [assetMetadata, isSuccess]);

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center">
        <label className="font-bold text-white/90">
          Select asset to pay network fees
        </label>
        <Transition
          as={Fragment}
          show={showSaved}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <div className="ml-auto flex items-center gap-2 text-white/90">
            <Check size={16} className="text-green-500" />
            <div className="text-sm">Saved</div>
          </div>
        </Transition>
      </div>
      <div
        className={
          "relative h-14 w-full rounded-md border-2 border-transparent bg-anti-flash-white "
        }
      >
        <AssetSelect
          options={options}
          selectedOption={assetSelection}
          showArrowRight={true}
          onChange={(option) => {
            setAsset(option);
            setShowSaved(true);
            setTimeout(() => {
              setShowSaved(false);
            }, 1000);
          }}
        />
      </div>
    </div>
  );
};
export default FeePayingAssetSelect;
