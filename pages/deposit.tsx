import { encodeAddress } from "@polkadot/keyring";
import { ZTG } from "@zeitgeistpm/sdk";
import CopyIcon from "components/ui/CopyIcon";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Input from "components/ui/Input";
import QrCode from "components/ui/QrCode";
import TabGroup from "components/ui/TabGroup";
import { StartTradingActionableCard } from "components/ui/actionable/cards/StartTrading";
import Decimal from "decimal.js";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useCurrencyBalances } from "lib/hooks/queries/useCurrencyBalances";
import { useCrossChainExtrinsic } from "lib/hooks/useCrossChainExtrinsic";
import { useChain } from "lib/state/cross-chain";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { shortenAddress } from "lib/util";
import { formatNumberCompact } from "lib/util/format-compact";
import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { SVGProps, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "react-feather";
import { useForm } from "react-hook-form";

const ZtgIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={40}
    fill="none"
    {...props}
  >
    <path
      fill={props.fill ?? "#0001FE"}
      d="M20.167 40c11.045 0 20-8.954 20-20s-8.955-20-20-20c-11.046 0-20 8.954-20 20s8.954 20 20 20Z"
    />
    <path fill="#fff" d="M27.707 11.337h-15.62V16.7h15.62v-5.363Z" />
    <path
      fill="#fff"
      d="m15.707 28.71 11.988-11.987-3.793-3.792-11.986 11.987 3.791 3.792Z"
    />
    <path fill="#B5C1CA" d="M28.09 23.118h-6.685v5.997h6.685v-5.997Z" />
  </svg>
);

const DotIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={40}
    fill="none"
    {...props}
  >
    <g
      fill={props.fill ?? "#e6007a"}
      clipPath="url(#a)"
      transform="matrix(1.1765 0 0 1.14295 0 -.571)"
    >
      <path d="M16.997 7.841c3.6 0 6.52-1.643 6.52-3.67 0-2.028-2.92-3.671-6.52-3.671-3.601 0-6.52 1.643-6.52 3.67 0 2.028 2.919 3.671 6.52 3.671zM16.997 35.497c3.6 0 6.52-1.643 6.52-3.67s-2.92-3.67-6.52-3.67c-3.601 0-6.52 1.643-6.52 3.67s2.919 3.67 6.52 3.67zM7.91 12.922c1.8-3.019 1.79-6.288-.026-7.302C6.07 4.606 3.14 6.23 1.338 9.25c-1.8 3.018-1.789 6.288.026 7.302 1.815 1.014 4.746-.61 6.546-3.63ZM32.656 26.748c1.8-3.018 1.79-6.287-.024-7.3-1.814-1.014-4.743.611-6.544 3.63-1.8 3.018-1.79 6.287.024 7.3 1.814 1.014 4.744-.612 6.544-3.63zM7.884 30.378c1.815-1.015 1.827-4.284.026-7.302-1.8-3.019-4.73-4.644-6.546-3.63-1.815 1.015-1.826 4.284-.026 7.303 1.8 3.018 4.731 4.643 6.546 3.629zM32.632 16.552c1.813-1.014 1.824-4.283.024-7.301s-4.73-4.644-6.544-3.63c-1.814 1.013-1.825 4.282-.024 7.3 1.8 3.019 4.73 4.644 6.544 3.63z" />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 .5h34v35H0z" />
      </clipPath>
    </defs>
  </svg>
);

const UsdtIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} {...props}>
    <path
      fill={props.fill ?? "#53ae94"}
      d="M20 0c11.045 0 20 8.955 20 20s-8.955 20-20 20S0 31.048 0 20 8.954 0 20 0"
      style={{
        strokeWidth: 0.02,
      }}
    />
    <path
      fill="#fff"
      d="M22.468 17.335V14.36h6.804V9.827H10.746v4.533h6.804v2.973c-5.53.254-9.688 1.349-9.688 2.661s4.16 2.407 9.688 2.663v9.53h4.92v-9.531c5.52-.255 9.67-1.35 9.67-2.66s-4.15-2.405-9.67-2.66m0 4.513v-.003c-.139.01-.852.052-2.44.052-1.27 0-2.163-.036-2.478-.052v.004c-4.885-.217-8.532-1.068-8.532-2.086 0-1.018 3.647-1.867 8.532-2.084v3.322c.32.022 1.236.076 2.499.076 1.517 0 2.28-.063 2.42-.076V17.68c4.876.217 8.514 1.069 8.514 2.083 0 1.015-3.64 1.867-8.514 2.084"
      style={{
        strokeWidth: 0.02,
      }}
    />
  </svg>
);

const DepositMethodItems = ["buy", "deposit"] as const;
type DepositMethod = (typeof DepositMethodItems)[number];

const DepositMethodLabels: Record<DepositMethod, string> = {
  buy: "Buy",
  deposit: "Deposit from a Wallet or an Exchange",
};

const DepositCurrencyItems = ["ztg", "dot", "usdt"] as const;
const ss58PrefixLookup = { ztg: 73, dot: 0, usdt: 0 };
type DepositCurrency = (typeof DepositCurrencyItems)[number];

const DepositCurrencyLabels: Record<DepositCurrency, string> =
  DepositCurrencyItems.reduce(
    (acc, item) => {
      return { ...acc, [item]: item.toUpperCase() };
    },
    {} as Record<DepositCurrency, string>,
  );

const DepositCurrencyIcons: Record<DepositCurrency, React.FC> = {
  ztg: ZtgIcon,
  dot: DotIcon,
  usdt: UsdtIcon,
};

const DepositPaymentMethodItems = ["card", "crypto"] as const;
type DepositPaymentMethod = (typeof DepositPaymentMethodItems)[number];

const DepositPaymentMethodLabels: Record<DepositPaymentMethod, string> = {
  card: "Use Credit Card",
  crypto: "with Crypto",
};

const ResultButtons = ({
  items,
}: {
  items: { label: string; url: string }[];
}) => {
  const size = items.length;
  return (
    <div className={"grid gap-3 " + `grid-cols-${size}`}>
      {items.map((item, id) => {
        return (
          <Link
            key={id}
            href={item.url}
            target="_blank"
            className={
              "center flex h-16 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white outline-none"
            }
          >
            <div>{item.label}</div>
            <ExternalLink size={16} />
          </Link>
        );
      })}
    </div>
  );
};

const DotDeposit = ({ address }: { address: string }) => {
  const { data: balances } = useCurrencyBalances(address);
  const wallet = useWallet();
  const notificationStore = useNotifications();
  const { chain, api } = useChain("Polkadot");
  const { data: constants } = useChainConstants();

  const dotAddress = wallet.realAddress && encodeAddress(wallet.realAddress, 0);

  const fee = chain?.depositFee;
  const feeEstimate = new Decimal(fee?.mul(1.01) ?? 0).div(ZTG); //add 1% buffer to feeQ
  //assumes source chain fee is paid in currency that is being transferred

  const existentialDepositWarningThreshold = 0.1;
  const {
    register,
    formState: { errors, isValid },
    watch,
    handleSubmit,
  } = useForm<{ amount: string }>();

  const balance = balances?.find(
    (b) => b.symbol === "DOT" && b.chain === "Polkadot",
  );

  const dotBalance = new Decimal(balance?.balance.toString() ?? 0).div(ZTG);
  const existentialDeposit = new Decimal(balance?.existentialDeposit ?? 0).div(
    ZTG,
  );

  const maxTransferAmount = dotBalance.minus(feeEstimate);
  const amount = watch("amount");
  const amountDecimal: Decimal = amount ? new Decimal(amount) : new Decimal(0);
  const remainingSourceBalance = dotBalance
    .minus(amountDecimal)
    .minus(feeEstimate);

  const { send: transfer, isLoading } = useCrossChainExtrinsic(
    () => {
      if (!chain || !api || !wallet.realAddress || !constants) return;
      const tx = chain.createDepositExtrinsic(
        api,
        wallet.realAddress,
        amountDecimal.toFixed(0),
        constants.parachainId,
      );
      return tx;
    },
    "Polkadot",
    "Zeitgeist",
    {
      onSourceSuccess: () => {
        notificationStore.pushNotification(`Moving DOT to Zeitgeist`, {
          type: "Info",
          autoRemove: true,
        });
      },
      onDestinationSuccess: () => {
        notificationStore.pushNotification(
          `Successfully moved DOT to Zeitgeist`,
          {
            type: "Success",
          },
        );
      },
    },
  );

  return (
    <form onSubmit={handleSubmit(() => transfer())}>
      <div className="mx-7 mb-6 mt-9 flex h-10 items-center gap-2 rounded-lg bg-anti-flash-white">
        <div className="h-[35px] w-[35px]">
          <Image
            src="/currencies/dot.png"
            width={35}
            height={35}
            alt="Polkadot currency"
          />
        </div>
        <div className="text-lg font-medium">DOT</div>
        <div className="ml-10 flex-grow">
          Your Balance: {dotBalance.toFixed(4)}
        </div>
        <div className="flex flex-col">
          <Input
            {...register("amount", {
              validate: (v) => {
                if (!v) {
                  return "Required";
                }
                if (maxTransferAmount.lessThan(v)) {
                  return `Insufficient balance. Current balance: ${maxTransferAmount.toFixed(
                    5,
                  )}`;
                } else if (+v <= 0) {
                  return "Value cannot be zero or less";
                }
              },
            })}
            className={
              "ml-auto h-10 w-[300px] rounded-none bg-white px-5 text-right " +
              (errors.amount ? "border-vermilion" : "")
            }
            type="number"
            min="0"
          />
        </div>
      </div>
      <div className="h-[16px] text-right text-ztg-12-120 text-vermilion">
        <>{errors["amount"]?.message}</>
        {!errors["amount"]?.message &&
          remainingSourceBalance.lessThan(existentialDeposit ?? 0) &&
          remainingSourceBalance.greaterThan(
            existentialDepositWarningThreshold,
          ) && (
            <>{`Warning! The remaining ${formatNumberCompact(
              remainingSourceBalance.toNumber(),
            )} DOT on Polkadot network will be lost`}</>
          )}
      </div>
      <FormTransactionButton
        className="w-full rounded-none !bg-white !text-black disabled:bg-white disabled:text-white"
        disabled={isValid === false || isLoading}
        disableFeeCheck={true}
      >
        Deposit to Zeitgeist
      </FormTransactionButton>
    </form>
  );
};

const DepositPage: NextPage = () => {
  const wallet = useWallet();

  const [method, setMethod] = useState<DepositMethod | undefined>("buy");
  const [currency, setCurrency] = useState<DepositCurrency | undefined>("ztg");
  const [paymentMethod, setPaymentMethod] = useState<
    DepositPaymentMethod | undefined
  >("crypto");

  const disabledPaymentMethods = useMemo<
    DepositPaymentMethod[] | undefined
  >(() => {
    if (currency === "ztg") {
      return ["card"];
    }
  }, [currency]);

  useEffect(() => {
    if (currency === "ztg" && method === "buy" && paymentMethod === "card") {
      setPaymentMethod(undefined);
    }
  }, [currency, method, paymentMethod]);

  const encodedAddress =
    wallet.realAddress &&
    currency &&
    encodeAddress(wallet.realAddress, ss58PrefixLookup[currency]);

  return (
    <>
      <h2 className="mb-6 px-2">Deposit Tokens</h2>
      <div className="[&>*:not(:last-child)]:mb-8">
        <p className="mt-3 p-2">
          You need some funds to make predictions on our platform. Select from
          among the following options, and we will direct you to a tutorial that
          will help you get started.
        </p>
        <TabGroup
          items={DepositMethodItems}
          labels={DepositMethodLabels}
          selected={method}
          onChange={setMethod}
          className="h-16"
          itemClassName="center outline-none rounded-lg bg-white"
          selectedItemClassName="!bg-ice-hush"
        />
        <TabGroup
          items={DepositCurrencyItems}
          labels={DepositCurrencyLabels}
          selected={currency}
          icons={DepositCurrencyIcons}
          onChange={setCurrency}
          disabled={["usdt"]}
          className="h-36"
          itemClassName="center outline-none rounded-lg bg-white"
          disabledItemClassName="!bg-misty-harbor text-sky-600"
          selectedItemClassName="!bg-ice-hush"
        />
        {method === "buy" && (
          <TabGroup
            items={DepositPaymentMethodItems}
            labels={DepositPaymentMethodLabels}
            selected={paymentMethod}
            onChange={setPaymentMethod}
            disabled={disabledPaymentMethods}
            disabledItemClassName="!bg-misty-harbor text-sky-600"
            className="h-16"
            itemClassName="center outline-none rounded-lg bg-white"
            selectedItemClassName="!bg-ice-hush"
          />
        )}
        {method === "buy" &&
          currency === "ztg" &&
          paymentMethod === "crypto" && (
            <ResultButtons
              items={[
                {
                  label: "Hydra DX",
                  url: "https://app.hydradx.io/trade?assetIn=5&assetOut=12",
                },
                { label: "Gate.io", url: "https://www.gate.io/trade/ZTG_USDT" },
              ]}
            />
          )}
        {method === "buy" &&
          currency === "dot" &&
          paymentMethod === "crypto" && (
            <ResultButtons
              items={[
                {
                  label: "DEX",
                  url: "https://app.hydradx.io/trade?assetIn=10&assetOut=5",
                },
                {
                  label: "CEX",
                  url: "https://www.binance.com/en/trade/DOT_USDT",
                },
              ]}
            />
          )}
        {method === "buy" &&
          currency === "dot" &&
          paymentMethod === "card" &&
          encodedAddress && (
            <div className={"grid gap-3 " + `grid-cols-1`}>
              <ResultButtons
                items={[
                  {
                    label: "Banxa",
                    url: `https://checkout.banxa.com/?fiatAmount=50&fiatType=EUR&coinAmount=8&coinType=DOT&lockFiat=false&orderMode=BUY&walletAddress=${encodedAddress}`,
                  },
                ]}
              />
              <div className="mt-7 flex flex-col gap-2 md:flex-row">
                <div className="item-center flex gap-2">
                  <Image
                    src="/currencies/dot.png"
                    width={25}
                    height={25}
                    alt="Polkadot currency"
                  />
                  <div>Polkadot Address:</div>
                </div>
                <div className="flex font-semibold">
                  <span className="hidden sm:inline">{encodedAddress}</span>
                  <span className="inline sm:hidden">
                    {shortenAddress(encodedAddress, 12, 12)}
                  </span>
                  <CopyIcon
                    size={24}
                    className="ml-3 cursor-pointer"
                    copyText={encodedAddress}
                  />
                </div>
              </div>
            </div>
          )}
        {currency === "dot" && method === "buy" && (
          <div className="mt-2">
            After purchasing DOT return to this page and select the Deposit tab
            to move it to your account on Zeitgeist
          </div>
        )}
      </div>
      {method === "deposit" && encodedAddress && currency && (
        <>
          <h3 className="my-8 p-2">
            Fund your {currency.toUpperCase()} Wallet
          </h3>
          <div className="flex flex-row">
            <div className="mr-14 h-48 w-48 flex-shrink-0">
              <QrCode text={encodedAddress} width={192} />
            </div>
            <div className="flex flex-col">
              <div className="flex-shrink text-lg font-medium">
                <div className="flex">
                  {shortenAddress(encodedAddress, 12, 12)}{" "}
                  <CopyIcon
                    size={24}
                    className="ml-3 cursor-pointer"
                    copyText={encodedAddress}
                  />
                </div>
              </div>
              <div className="my-auto">
                {
                  {
                    ztg: "Copy your address above or from the QR code and transfer ZTG to your address.",
                    dot: "Copy your address above or from the QR code and transfer DOT to your address. If you already DOT on your wallet you can go to the Deposit section below.",
                  }[currency]
                }
                {
                  //todo: need to add video
                  // {
                  //   ztg: "Copy your address above or from the QR code and transfer ZTG to your address. Need help? See the video below.",
                  //   dot: "Copy your address above or from the QR code and transfer DOT to your address. If you already DOT on your wallet you can go to the Deposit section below. Need help? See the video below.",
                  // }[currency]
                }
              </div>
            </div>
          </div>
        </>
      )}
      {method === "deposit" && !wallet.connected && (
        <div className="my-8 p-2">
          Wallet not connected. Please connect wallet or{" "}
          <Link href="/create-account" className="text-blue" shallow>
            create an account first
          </Link>
          .
        </div>
      )}
      {method === "deposit" && wallet.realAddress && currency === "dot" && (
        <DotDeposit address={wallet.realAddress} />
      )}
      {/* TODO: Update href attribute */}
      {/* <div className="flex text-blue my-9 p-2">
        <Link href="#" className="flex">
          <div className="mr-3">
            Watch this tutorial about how to buy tokens using crypto
          </div>
          <Video />
        </Link>
      </div> */}
      <h2 className="my-9">Next Steps</h2>
      <div className="flex flex-col gap-4 md:flex-row">
        <StartTradingActionableCard />
      </div>
    </>
  );
};

export default DepositPage;
