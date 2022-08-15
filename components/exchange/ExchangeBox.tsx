import { Skeleton } from "@material-ui/lab";
import { observer } from "mobx-react";
import { BehaviorSubject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { Decimal } from "decimal.js";
import MobxReactForm from "mobx-react-form";
import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { useModalStore } from "lib/stores/ModalStore";
import { useStore } from "lib/stores/Store";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { calcInGivenOut } from "lib/math";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { ztgAsset } from "lib/types";
import { defaultOptions, defaultPlugins } from "lib/form";
import { DEFAULT_SLIPPAGE_PERCENTAGE, ZTG } from "lib/constants";
import ExchangeStore, { OutcomeOption } from "lib/stores/ExchangeStore";
import AssetSelectView from "components/assets/AssetSelectView";
import AssetSelectButton from "components/assets/AssetSelectButton";
import TransactionButton from "components/ui/TransactionButton";
import SlippageSettingInput from "components/markets/SlippageInput";
import TypeSwitch from "./TypeSwitch";
import Slider from "../ui/Slider";
import { AmountInput } from "../ui/inputs";
import {
  generateSwapExactAmountInTx,
  generateSwapExactAmountOutTx,
} from "lib/util/pool";

const formFieldsDefaults = [
  {
    name: "amount",
    value: "",
    rules: ["amount_validation", "required"],
  },
  {
    name: "slippage",
    value: DEFAULT_SLIPPAGE_PERCENTAGE.toString(),
    rules: ["required"],
  },
];

const ExchangeConfirmModal = observer(
  ({
    type,
    txFee,
    total,
    exchangeStore,
  }: {
    type: string;
    txFee: string;
    total: Decimal;
    exchangeStore: ExchangeStore;
  }) => {
    return (
      <div className="mb-ztg-15">
        <div className="bg-sky-200 dark:bg-black h-ztg-60 px-ztg-30 flex items-center rounded-ztg-10 mb-ztg-15">
          <span className="capitalize font-bold text-ztg-16-150 mr-ztg-19">
            {type}
          </span>
          <span
            className="rounded-full w-ztg-20 h-ztg-20 border-sky-600 border-2 mr-ztg-8"
            style={{
              backgroundColor: exchangeStore.outcome.metadata["color"],
            }}
          ></span>
          <span className="font-bold font-space text-ztg-16-150">
            {exchangeStore.outcome.metadata["ticker"]}
          </span>
          <span className="font-mono text-ztg-16-150 ml-auto">
            {exchangeStore.amount.toFixed(4)}
          </span>
        </div>
        <div className="bg-sky-100 dark:bg-black px-ztg-30 py-ztg-20 rounded-ztg-10">
          <div className="flex mb-ztg-8">
            <div className="text-sky-600 text-ztg-14-150">ZTG amount:</div>
            <div className="font-mono text-ztg-14-150 ml-ztg-5">
              {exchangeStore.ztgAmount.toFixed(4)}
            </div>
          </div>
          <div className="flex mb-ztg-8">
            <div className="text-sky-600 text-ztg-14-150">Transaction fee:</div>
            <div className="font-mono text-ztg-14-150 ml-ztg-5">
              {txFee} ZTG
            </div>
          </div>
          <div className="flex mb-ztg-8">
            <div className="text-sky-600 text-ztg-14-150">Total ZTG spent:</div>
            <div className="font-mono text-ztg-14-150 ml-ztg-5">
              {type === "buy" ? total.toFixed(4) : txFee} ZTG
            </div>
          </div>
        </div>
      </div>
    );
  },
);

const ExchangeBox: FC<{ exchangeStore: ExchangeStore }> = observer(
  ({ exchangeStore }) => {
    const [type, setType] = useState<"buy" | "sell">("buy");
    const [exchangeForm, setExchangeForm] = useState(null);
    const [selectedAssetOption, setSelectedAssetOption] =
      useState<OutcomeOption>();
    const [slippagePercentage, setSlippagePercentage] = useState(
      DEFAULT_SLIPPAGE_PERCENTAGE.toString(),
    );
    const [percentage, setPercentage] = useState(0);
    const [percentageDisplay, setPercentageDisplay] = useState(0);
    const [tx$] = useState(() => new BehaviorSubject(null));
    const [txFee, setTxFee] = useState("0");
    const [initialChange, setInitialChange] = useState(false);

    const [isSelectView, setIsSelectView] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>();

    const store = useStore();
    const { wallets } = store;
    const modalStore = useModalStore();
    const notificationStore = useNotificationStore();

    const maxIn = useMemo<string>(() => {
      if (exchangeStore?.hasPoolBalances !== true) {
        return "0";
      }

      if (type === "buy") {
        const maxFromPool = exchangeStore.poolBalance;

        if (!wallets.connected) {
          return maxFromPool.toString();
        }

        const maxFromZtgBalance = Math.abs(
          calcInGivenOut(
            exchangeStore.poolBalance.toString(),
            exchangeStore.outcomeWeight,
            exchangeStore.ztgPoolBalance.toString(),
            exchangeStore.ztgWeight,
            wallets.activeBalance.toString(),
            exchangeStore.swapFee,
          ).toNumber(),
        );

        return maxFromPool.gt(maxFromZtgBalance)
          ? maxFromZtgBalance.toString()
          : maxFromPool.toString();
      }

      if (type === "sell") {
        return exchangeStore.balance?.toString() ?? "0";
      }
    }, [
      type,
      exchangeStore?.hasPoolBalances,
      exchangeStore?.balance,
      wallets.connected,
      wallets.activeBalance,
    ]);

    useEffect(() => {
      if (exchangeStore == null || +maxIn === 0) {
        return;
      }
      const max = new Decimal(maxIn);
      const amount = exchangeStore.amount ?? new Decimal(0);
      const perc = amount.div(max).mul(100).toFixed(2);
      setPercentageDisplay(+perc);
    }, [exchangeStore?.amount, maxIn]);

    useEffect(() => {
      if (!wallets.connected) return;
      if (exchangeStore?.amount == null || exchangeStore?.amount.eq(0)) {
        tx$.next(null);
        return;
      }
      if (exchangeStore == null || !exchangeStore?.hasOutcomeOptions) {
        tx$.next(null);
        return;
      }

      const { poolId, swapFee } = exchangeStore;

      const _tx =
        type === "buy"
          ? generateSwapExactAmountOutTx(
              store.sdk.api,
              ztgAsset,
              exchangeStore.outcome.asset,
              exchangeStore.ztgPoolBalance.mul(ZTG),
              new Decimal(exchangeStore.ztgWeight),
              exchangeStore.poolBalance.mul(ZTG),
              new Decimal(exchangeStore.outcomeWeight),
              exchangeStore.amount.mul(ZTG),
              swapFee,
              new Decimal(slippagePercentage).div(100),
              poolId,
            )
          : generateSwapExactAmountInTx(
              store.sdk.api,
              exchangeStore.outcome.asset,
              ztgAsset,
              exchangeStore.poolBalance.mul(ZTG),
              new Decimal(exchangeStore.outcomeWeight),
              exchangeStore.ztgPoolBalance.mul(ZTG),
              new Decimal(exchangeStore.ztgWeight),
              exchangeStore.amount.mul(ZTG),
              swapFee,
              new Decimal(slippagePercentage).div(100),
              poolId,
            );

      tx$.next(_tx);
    }, [
      exchangeStore?.amount,
      type,
      exchangeStore?.outcome,
      exchangeStore?.spotPrice,
      exchangeStore?.hasOutcomeOptions,
    ]);

    useEffect(() => {
      const sub = tx$
        .asObservable()
        .pipe(debounceTime(300))
        .subscribe(async (tx: any) => {
          let fee: string;
          if (tx == null || !wallets.connected) {
            fee = "0";
          } else {
            const paymentInfo = await tx.paymentInfo(
              wallets.activeAccount.address,
            );

            const partialFee = paymentInfo.partialFee.toNumber() / ZTG;

            fee = partialFee.toString();
          }

          setTxFee(fee);
        });

      return () => {
        sub.unsubscribe();
        exchangeStore?.setAmount();
      };
    }, []);

    useEffect(() => {
      inputRef.current?.focus();
    }, [inputRef.current]);

    useEffect(() => {
      exchangeStore?.setAmount();
      recreateForm();
    }, [type, exchangeStore?.outcomeOption]);

    useEffect(() => {
      if (exchangeStore == null) {
        return;
      }
      if (exchangeStore?.amount == null && initialChange === false) {
        return setInitialChange(true);
      }
      const p = new Decimal(percentage).div(100);
      changeInAmount(p.mul(maxIn).toFixed(10));
    }, [exchangeStore, percentage]);

    useEffect(() => {
      if (exchangeStore?.hasOutcomeOptions !== true) {
        return;
      }
      setSelectedAssetOption(exchangeStore?.outcomeOption);
    }, [exchangeStore?.outcomeOption]);

    const recreateForm = () => {
      setExchangeForm(
        new MobxReactForm(
          {
            fields: formFieldsDefaults,
          },
          {
            plugins: defaultPlugins,
            options: defaultOptions,
          },
        ),
      );
    };

    const processTransaction = async () => {
      const signer = wallets.getActiveSigner() as ExtSigner;
      const amount = exchangeStore.amount.toFixed(4);
      await signAndSend(
        tx$.value,
        signer,
        extrinsicCallback({
          notificationStore,
          successCallback: async () => {
            notificationStore.pushNotification(
              `Swapped ${amount} ${exchangeStore.outcome.metadata["name"]}`,
              { type: "Success" },
            );
            await exchangeStore.updateBalances();
            exchangeStore.updateSpotPrice();
            await exchangeStore.updateOutcomeBalance();
            exchangeStore.setAmount();
            recreateForm();
          },
          failCallback: ({ index, error }) => {
            notificationStore.pushNotification(
              store.getTransactionError(index, error),
              { type: "Error" },
            );
          },
        }),
      );
    };

    const openTransactionModal = async () => {
      const { wallets } = store;
      const { activeAccount } = wallets;
      if (!activeAccount) return;

      const total = new Decimal(txFee).add(exchangeStore.ztgAmount);

      modalStore.openConfirmModal(
        <ExchangeConfirmModal
          total={total}
          exchangeStore={exchangeStore}
          txFee={txFee}
          type={type}
        />,
        "Confirm and sign transaction",
        () => {
          processTransaction();
        },
        { styles: { width: "380px" } },
      );
    };

    const changeInAmount = (v: string) => {
      exchangeStore?.setAmount(v);
    };

    if (exchangeStore == null) {
      return (
        <Skeleton
          className="!py-ztg-10 !rounded-ztg-10 !transform-none"
          height={474}
        />
      );
    }

    const feeCurrencySymbol =
      type === "buy"
        ? store.config.tokenSymbol
        : selectedAssetOption.label.toUpperCase();

    return (
      <div className="py-ztg-10 rounded-ztg-10 bg-white dark:bg-sky-1000 max-h-[500px]">
        <div className="flex h-ztg-25 items-center px-ztg-16">
          <TypeSwitch type={type} onChange={(t) => setType(t)} />
          <SlippageSettingInput
            form={exchangeForm}
            name="slippage"
            label="slippage"
            value={slippagePercentage}
            onChange={(v) => setSlippagePercentage(v)}
            className="ml-auto"
          />
        </div>
        {!isSelectView ? (
          <div className="px-ztg-16">
            <AssetSelectButton
              selection={selectedAssetOption}
              onClick={() => {
                setIsSelectView(true);
              }}
              balance={exchangeStore?.balance?.toString()}
            />
            <AmountInput
              containerClass="dark:bg-sky-1000"
              className="mb-ztg-10"
              form={exchangeForm}
              name="amount"
              showErrorMessage={false}
              ref={inputRef}
              leftComponent={
                <button
                  className="absolute flex items-center h-ztg-40 text-gray-dark-3 ml-ztg-8 focus:outline-none"
                  onClick={() => {
                    changeInAmount(maxIn);
                  }}
                >
                  <div className="font-lato text-ztg-12-150 center">MAX</div>
                </button>
              }
              value={exchangeStore?.amount?.toString()}
              max={maxIn}
              onChange={(v) => {
                changeInAmount(v);
              }}
            />
            <div className="h-ztg-18 flex px-ztg-8 justify-between mb-ztg-16 text-sky-600">
              <span className="font-lato text-ztg-12-150">
                Price per Share:
              </span>
              <span className="font-mono text-ztg-12-150 text-right font-medium">
                {exchangeStore?.spotPrice?.toFixed(4)}
              </span>
            </div>
            <div className="w-full center h-ztg-40 flex items-center mb-ztg-10">
              <div className="font-space rounded-ztg-10 w-ztg-40 h-ztg-40 text-ztg-14-150 text-sky-600 center font-bold bg-sky-100 dark:bg-sky-1100">
                For
              </div>
            </div>
            <div className="flex h-ztg-36 items-center mb-ztg-10">
              <div className="w-ztg-108">
                <div className="flex h-ztg-20">
                  <div className="w-ztg-20 h-ztg-20 border-2 border-sky-600 rounded-full mr-ztg-8 bg-ztg-blue"></div>
                  <div className="font-space text-base font-bold flex items-center dark:text-white">
                    {store.config.tokenSymbol}
                  </div>
                </div>
              </div>
              <div className="flex-grow text-right font-mono text-ztg-12-150 text-sky-600">
                {exchangeStore?.ztgBalance?.toString()}
              </div>
            </div>
            <AmountInput
              containerClass="dark:bg-sky-1000"
              className="mb-ztg-10"
              value={exchangeStore?.ztgAmount?.toString()}
              disabled
            />
            <div className="h-ztg-53 mb-ztg-6 flex items-center px-ztg-5">
              <Slider value={percentageDisplay} onChange={setPercentage} />
            </div>
            <TransactionButton
              className="mb-ztg-10 shadow-ztg-2"
              disabled={
                !exchangeForm?.isValid || !exchangeStore.spotPrice?.gt(0)
              }
              onClick={() => {
                openTransactionModal();
              }}
            >
              Sign Transaction
            </TransactionButton>
            <div className="font-lato h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 font-bold text-sky-600">
              <span>Max profit:</span>
              <span className="font-mono">
                {exchangeStore?.maxProfit} {store.config.tokenSymbol}
              </span>
            </div>
            <div className="font-lato h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 font-bold text-sky-600">
              <span>Network Fee:</span>
              <span className="font-mono">
                {txFee} {store.config.tokenSymbol}
              </span>
            </div>
            <div className="font-lato h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 font-bold text-sky-600">
              <span>Trading Fee:</span>
              <span className="font-mono">
                {`${(
                  exchangeStore?.amount?.mul(exchangeStore.swapFee ?? 0) ?? 0
                ).toString()} ${feeCurrencySymbol}`}
              </span>
            </div>
          </div>
        ) : (
          <AssetSelectView
            onBack={() => setIsSelectView(false)}
            options={exchangeStore.outcomeOptions}
            selectedOption={selectedAssetOption}
            onOptionChange={(opt) => exchangeStore?.setOutcomeOption(opt)}
          />
        )}
      </div>
    );
  },
);

export default ExchangeBox;
