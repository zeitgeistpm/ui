import { OutcomeOption } from "lib/stores/ExchangeStore";
import { observer } from "mobx-react";
import { ChevronDown } from "react-feather";

interface TokenSelectProps {
  selection: OutcomeOption;
  balance?: string;
  onClick: () => void;
}

const AssetSelectButton = observer(
  ({ selection, onClick, balance }: TokenSelectProps) => {
    return (
      <div className="flex h-ztg-36 items-center my-ztg-8">
        <div className="flex-shrink">
          <div className="flex h-ztg-20 cursor-pointer" onClick={onClick}>
            <div
              className="w-ztg-20 h-ztg-20 border-2 border-sky-600 rounded-full mr-ztg-8"
              style={{ background: `${selection?.color}` }}
            ></div>
            <div className=" text-base font-bold flex items-center dark:text-white">
              {selection?.label?.toUpperCase()}
            </div>
            <ChevronDown
              size={18}
              className="text-sky-600 ml-ztg-8 font-bold"
            />
          </div>
        </div>
        <div className="flex-grow text-right font-mono text-ztg-12-150 text-sky-600">
          {balance}
        </div>
      </div>
    );
  },
);

export default AssetSelectButton;
