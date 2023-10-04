import { useAtom } from "jotai";
import { persistentAtom } from "./util/persistent-atom";

const feePayingAssetStateAtom = persistentAtom<any>({
  key: "fee-paying-asset",
  defaultValue: "",
});

const useFeePayingAssetSelection = () => {
  const [state, setState] = useAtom(feePayingAssetStateAtom);

  const setAsset = (selection: any) => {
    setState(selection);
  };

  return { assetSelection: state, setAsset };
};

export default useFeePayingAssetSelection;
