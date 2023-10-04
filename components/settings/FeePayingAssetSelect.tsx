import AssetSelect, { AssetOption } from "components/ui/AssetSelect";
import {
  FOREIGN_ASSET_METADATA,
  findAssetImageForSymbol,
} from "lib/constants/foreign-asset";
import { useAllAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useMemo } from "react";

const isSupportedAsset = (id: number) => {
  return Object.keys(FOREIGN_ASSET_METADATA).includes(`${id}`);
};

const FeePayingAssetSelect = () => {
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

  return (
    <div>
      <label className="font-bold mb-2">Select asset to pay network fees</label>
      <div
        className={
          "mb-5 h-14 w-full bg-anti-flash-white rounded-md relative border-1 border-transparent "
        }
      >
        <AssetSelect
          options={options}
          selectedOption={options[0]}
          onChange={(option) => {
            //   onAssetChange?.(option);
          }}
        />
      </div>
    </div>
  );
};
export default FeePayingAssetSelect;
