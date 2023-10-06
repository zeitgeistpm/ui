import { useAtom } from "jotai";
import { persistentAtom } from "./util/persistent-atom";
import { AssetOption } from "components/ui/AssetSelect";

type SelectedFeeAsset = "Default" | AssetOption;

const feePayingAssetStateAtom = persistentAtom<SelectedFeeAsset>({
  key: "fee-paying-asset",
  defaultValue: "Default",
});

const useFeePayingAssetSelection = () => {
  const [state, setState] = useAtom(feePayingAssetStateAtom);

  const setAsset = (selection: SelectedFeeAsset) => {
    setState(selection);
  };

  return { assetSelection: state, setAsset };
};

export default useFeePayingAssetSelection;
