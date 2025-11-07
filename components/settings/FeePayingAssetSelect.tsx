import { Transition } from "@headlessui/react";
import AssetSelect, { AssetOption } from "components/ui/AssetSelect";
import {
  FOREIGN_ASSET_METADATA,
  findAssetImageForSymbol,
} from "lib/constants/foreign-asset";
import { useAllAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import useFeePayingAssetSelection from "lib/state/fee-paying-asset";
import { Fragment, useMemo, useState, useEffect, useRef } from "react";
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
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let portal = document.getElementById("select-menu-portal") as HTMLDivElement;
    if (!portal) {
      portal = document.createElement("div") as HTMLDivElement;
      portal.id = "select-menu-portal";
      portal.style.position = "fixed";
      portal.style.top = "0";
      portal.style.left = "0";
      portal.style.zIndex = "9999";
      document.body.appendChild(portal);
    }
    portalRef.current = portal;
    return () => {
      // Don't remove portal on unmount as it might be used by other selects
    };
  }, []);

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
        <label className="text-sm font-semibold text-white/90">
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
            <div className="text-xs">Saved</div>
          </div>
        </Transition>
      </div>
      <div className="relative h-10 w-full rounded-lg border-2 border-white/10 bg-white/10 shadow-sm backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/20">
        <AssetSelect
          options={options}
          selectedOption={assetSelection}
          showArrowRight={true}
          menuPortalTarget={portalRef.current}
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
