import AssetSelect, { AssetOption } from "components/ui/AssetSelect";
import {
  FOREIGN_ASSET_METADATA,
  findAssetImageForSymbol,
} from "lib/constants/foreign-asset";
import { useAllAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import useFeePayingAssetSelection from "lib/state/fee-paying-asset";
import { useMemo, useState } from "react";
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
      <div className="flex item-center">
        <label className="font-bold">Select asset to pay network fees</label>
        {showSaved && (
          <div className="flex gap-2 items-center ml-auto">
            <Check size={16} className="text-green-500" />
            <div className="text-sm">Saved</div>
          </div>
        )}
      </div>
      <div
        className={
          "h-14 w-full bg-anti-flash-white rounded-md relative border-1 border-transparent "
        }
      >
        <AssetSelect
          options={options}
          selectedOption={assetSelection}
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
