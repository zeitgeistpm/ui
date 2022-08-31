import { observer } from "mobx-react";
import { Skeleton } from "@material-ui/lab";
import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { X } from "react-feather";
import { Decimal } from "decimal.js";

import {
  useTradeSlipStore,
  TradeSlipBoxState,
  tradeSlipForm,
} from "lib/stores/TradeSlipStore";
import { compareJSON } from "lib/util";
import Slider from "../ui/Slider";
import { AmountInput } from "../ui/inputs";
import { useStore } from "lib/stores/Store";
import { ZTG } from "lib/constants";

const ToggleSlider: FC<{ className: string }> = ({ className }) => {
  return (
    <svg
      width="20"
      height="8"
      viewBox="0 0 20 8"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 4L8 4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 4L19 4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 1L8 7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export type TradeSlipBoxProps = {
  state: TradeSlipBoxState;
  onClose?: () => void;
};

const TradeSlipBoxLoader = observer(() => (
  <Skeleton
    height={156}
    className="!rounded-ztg-10 !transform-none !mb-ztg-15"
  />
));

const TradeSlipBoxContent = observer<FC<TradeSlipBoxProps>>(
  ({ state, onClose }) => {
    const { config } = useStore();
    const [sliderShown, setSliderShown] = useState(false);
    const [percentage, setPercentage] = useState(0);
    const tradeSlipStore = useTradeSlipStore();
    const { focusedItem } = tradeSlipStore;
    const {
      amount,
      percentageDisplay,
      setByPercentage,
      sliderDisabled,
      ztgTransferAmount,
      swapFee,
    } = state;

    const [boxAmount, setBoxAmount] = useState(() => {
      return amount?.toString() || "";
    });

    useEffect(() => {
      setBoxAmount(amount?.toString());
    }, [amount]);

    const isFocused = useMemo(() => {
      if (focusedItem == null) {
        return false;
      }
      return (
        focusedItem.type === state.type &&
        compareJSON(focusedItem.assetId, state.assetId)
      );
    }, [state.type, state.assetId, tradeSlipStore.focusedItem]);

    const inputRef = useRef<HTMLInputElement>(null);

    const boxAmountDecimal: Decimal =
      boxAmount === "" || boxAmount == null
        ? new Decimal(0)
        : new Decimal(boxAmount);

    useEffect(() => {
      isFocused && inputRef?.current?.focus();
    }, [isFocused]);

    useEffect(() => {
      if (sliderShown === false) {
        return;
      }
      setByPercentage(percentage);
    }, [percentage]);

    return (
      <div className="rounded-ztg-10 mb-ztg-15">
        <div className="px-ztg-16 h-ztg-30 flex items-center rounded-t-ztg-10 bg-sky-300 dark:bg-sky-700">
          <div
            className={
              "w-ztg-33 text-ztg-14-150 uppercase font-space font-bold " +
              `${state.type === "buy" ? "text-sunglow-2" : "text-red-crayola"}`
            }
          >
            {state.type}
          </div>
          <div className="text-ztg-10-150 break-words whitespace-nowrap overflow-hidden overflow-ellipsis text-gray-dark-3 text-center font-lato font-bold uppercase flex-grow mx-ztg-10">
            {state.slug}
          </div>
          <div className="w-ztg-16 h-ztg-16 rounded-full bg-sky-400 dark:bg-black center">
            <X
              size={16}
              className="cursor-pointer text-sky-600"
              onClick={() => onClose()}
            />
          </div>
        </div>
        <div className="py-ztg-8 px-ztg-16 bg-white dark:bg-sky-1000 flex flex-col items-center mb-ztg-8 rounded-b-ztg-10">
          {state.disabled ? (
            <div className="text-vermilion font-lato font-bold text-ztg-12-120 h-ztg-30 center">
              Market Ended
            </div>
          ) : (
            <>
              <div className="flex items-center h-ztg-30 w-full">
                <div
                  className="w-ztg-20 h-ztg-20 rounded-full border-2 border-sky-600 flex-shrink-0"
                  style={{ background: `${state.assetColor}` }}
                ></div>
                <div className="uppercase font-space font-bold text-ztg-14-150 ml-ztg-8 mr-ztg-10 text-black dark:text-white">
                  {state.assetTicker}
                </div>
                <div className="font-lato font-bold text-ztg-12-150 ml-auto text-black dark:text-white">
                  @{state.assetZtgPrice?.toFixed(4)} {config.tokenSymbol}
                </div>
              </div>
              <div className="h-ztg-15 w-full mb-ztg-10 font-lato text-ztg-10-150 flex items-center text-gray-dark-3">
                Balance:
                <div className="text-black dark:text-white ml-1">
                  {state.assetBalance?.toFixed(4)}
                </div>
              </div>
              <div className="flex w-full h-ztg-34 mb-ztg-10">
                <div className="h-full w-ztg-164">
                  <AmountInput
                    value={boxAmount}
                    ref={inputRef}
                    form={tradeSlipForm}
                    name={"items." + state.fieldName}
                    containerClass="h-full"
                    className={
                      "!h-full w-full rounded-ztg-8 text-right mb-ztg-2"
                    }
                    onChange={(value) => {
                      setBoxAmount(value);
                      state.setAmount(value);
                    }}
                    max={state.maxLimit?.toString()}
                  />
                </div>
                <div className="ml-ztg-10 h-full flex flex-col text-sky-600 font-lato text-ztg-10-150 text-right flex-grow">
                  {state.type === "sell" ? (
                    <div>To Receive</div>
                  ) : (
                    <div>To Spend:</div>
                  )}
                  <div className="font-bold text-black dark:text-white">
                    {ztgTransferAmount?.isNaN()
                      ? "---"
                      : ztgTransferAmount?.toFixed(4, Decimal.ROUND_DOWN)}{" "}
                    {config.tokenSymbol}
                  </div>
                </div>
              </div>
              <div className="flex w-full font-lato text-ztg-10-150 text-gray-dark-3 mt-ztg-5">
                Trading Fee:
                <div className="text-black dark:text-white ml-1">
                  {boxAmountDecimal.mul(swapFee?.mul(ZTG) ?? 0).toString()}{" "}
                  {state.type === "sell"
                    ? state.assetTicker.toUpperCase()
                    : config.tokenSymbol}
                </div>
              </div>

              {sliderShown && (
                <div className="h-ztg-43 w-full px-ztg-5 mt-ztg-20">
                  <Slider
                    value={+percentageDisplay}
                    onChange={setPercentage}
                    disabled={sliderDisabled}
                  />
                </div>
              )}
              <div className="h-ztg-16 w-full center">
                {/* Temporary remove slider becuase of bugs */}
                {/* <div */}
                {/*   className="cursor-pointer" */}
                {/*   onClick={() => { */}
                {/*     setSliderShown(!sliderShown); */}
                {/*     tradeSlipStore.recheckScrollbar.next(); */}
                {/*   }} */}
                {/* > */}
                {/*   <ToggleSlider */}
                {/*     className={ */}
                {/*       "stroke-current " + */}
                {/*       `${ */}
                {/*         sliderShown */}
                {/*           ? "text-black dark:text-aquarium-blue" */}
                {/*           : "text-starfall dark:text-white" */}
                {/*       }` */}
                {/*     } */}
                {/*   /> */}
                {/* </div> */}
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
);

const TradeSlipBox: FC<TradeSlipBoxProps> = observer((props) => {
  const { state } = props;

  if (state.init === false) {
    return <TradeSlipBoxLoader />;
  } else {
    return <TradeSlipBoxContent {...props} />;
  }
});

export default TradeSlipBox;
