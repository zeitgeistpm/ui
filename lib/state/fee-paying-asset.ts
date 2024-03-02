import { useAtom } from "jotai";
import { persistentAtom } from "./util/persistent-atom";
import { AssetOption } from "components/ui/AssetSelect";
import { isWSX, wsxID } from "lib/constants";
import { useEffect } from "react";

type SelectedFeeAsset = AssetOption;

const feePayingAssetStateAtom = persistentAtom<SelectedFeeAsset>({
  key: "fee-paying-asset",
  defaultValue: {
    label: "Default",
    additionalText: "Uses first available asset",
  },
});

const useFeePayingAssetSelection = () => {
  const [state, setState] = useAtom(feePayingAssetStateAtom);

  useEffect(() => {
    isWSX && setState({ label: "WSX", value: { ForeignAsset: wsxID } });
  }, [isWSX]);

  const setAsset = (selection: SelectedFeeAsset) => {
    setState(selection);
  };

  return { assetSelection: state, setAsset };
};

export default useFeePayingAssetSelection;
