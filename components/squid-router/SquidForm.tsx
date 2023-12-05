import { Listbox, Transition } from "@headlessui/react";
import { useSquid } from "lib/hooks/squid-router/useSquid";
import Image from "next/image";
import { Fragment, useEffect, useMemo, useState } from "react";

import { FaAngleLeft, FaLongArrowAltLeft } from "react-icons/fa";
import { MdCheckCircleOutline, MdKeyboardArrowDown } from "react-icons/md";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useNetwork,
  useSwitchNetwork,
  useSigner,
} from "wagmi";
import { BigNumber, parseFixed, formatFixed } from "@ethersproject/bignumber";
import { InjectedConnector } from "wagmi/connectors/injected";
import { Connector } from "wagmi";
import { Loader } from "../ui/Loader";
import { ChainData, Token } from "@0xsquid/squid-types";
import { shortenAddress } from "lib/util";
import { formatNumberCompact } from "lib/util/format-compact";
import { persistentAtom } from "lib/state/util/persistent-atom";
import { useAtom } from "jotai";
import TransactionButton from "components/ui/TransactionButton";
import { al } from "vitest/dist/reporters-5f784f42";
import Decimal from "decimal.js";
import { RouteResponse, TransactionResponse } from "@0xsquid/sdk/dist/types";
import { useDebounce } from "use-debounce";
import Skeleton from "components/ui/Skeleton";
import { CircularProgressbar } from "react-circular-progressbar";

const userConfigAtom = persistentAtom({
  key: "squid-router-user-config",
  defaultValue: {
    selectedChainId: "Ethereum",
    selectedTokenSymbol: "USDC",
  },
});

export const SquidForm = () => {
  const [userConfig, setUserConfig] = useAtom(userConfigAtom);

  const squid = useSquid();
  const { address, isConnected } = useAccount();

  const { disconnect } = useDisconnect();

  const { connect, connectors, error, isLoading, isSuccess, pendingConnector } =
    useConnect();

  const [amount, setAmount] = useState<number | undefined>(0);

  const [debouncedAmount] = useDebounce(amount, 500);

  const selectedChain = useMemo(() => {
    if (squid.connected) {
      return squid.sdk.chains.find(
        (c) => c.networkIdentifier === userConfig.selectedChainId,
      );
    }
    return null;
  }, [squid, userConfig.selectedChainId]);

  const { data: signer } = useSigner({
    chainId: Number(selectedChain?.chainId),
  });

  const availableTokens = useMemo(() => {
    if (squid.connected) {
      return squid.sdk.tokens.filter((t) => {
        return t.chainId === selectedChain?.chainId;
      });
    }
    return [];
  }, [squid, selectedChain]);

  const selectedToken = useMemo(() => {
    return (
      availableTokens?.find(
        (t) => t.symbol === userConfig.selectedTokenSymbol,
      ) ?? availableTokens?.[0]
    );
  }, [availableTokens, userConfig.selectedTokenSymbol]);

  const [route, setRoute] = useState<RouteResponse["route"] | null>(null);
  const [depositing, setDepositing] = useState(false);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [totalFeeCost, setTotalFeeCost] = useState<Decimal | null>(null);

  useEffect(() => {
    if (squid.connected && selectedChain && selectedToken && signer && amount) {
      const moonbeamChain = squid.sdk.chains.find((c) =>
        c.networkName.toLowerCase().match(/moonbeam|moonbase/),
      );

      const wormHoleToken = squid.sdk.tokens.find(
        (t) =>
          t.symbol.match(/USDC\.wh/gi) && t.chainId === moonbeamChain?.chainId,
      );

      if (!wormHoleToken) {
        return alert("Moonbeam token not found");
      }

      setCalculatingRoute(true);

      squid.sdk
        .getRoute({
          fromChain: selectedChain.chainId,
          fromAmount: parseFixed(
            amount?.toString(),
            Number(selectedToken.decimals),
          ).toString(),
          fromToken: selectedToken.address,
          toChain: wormHoleToken.chainId,
          toToken: wormHoleToken.address,
          fromAddress: address,
          toAddress: address,
          slippageConfig: {
            autoMode: 1,
          },
          enableBoost: true,
        })
        .then(({ route }) => {
          setRoute(route);

          const totalGasCost = route.estimate.gasCosts.reduce(
            (acc, gasCost) => {
              return acc.add(
                new Decimal(
                  formatFixed(
                    gasCost.amount,
                    Number(gasCost.token.decimals),
                  ).toString(),
                ).mul(selectedToken.usdPrice ?? 0),
              );
            },
            new Decimal(0),
          );

          const totalFeeCost = route.estimate.feeCosts.reduce(
            (acc, feeCost) => {
              return acc.add(
                new Decimal(
                  formatFixed(
                    feeCost.amount,
                    Number(feeCost.token.decimals),
                  ).toString(),
                ).mul(selectedToken.usdPrice ?? 0),
              );
            },
            new Decimal(0),
          );

          setTotalFeeCost(totalGasCost.add(totalFeeCost));
        })
        .finally(() => {
          setCalculatingRoute(false);
        });
    }
  }, [debouncedAmount, squid.connected, selectedChain, selectedToken, signer]);

  const onClickDeposit = async () => {
    if (route && squid.connected && signer) {
      setDepositing(true);
      try {
        const tx = (await squid.sdk.executeRoute({
          route,
          signer,
        })) as TransactionResponse;

        console.log({ tx });

        const result = await tx.wait();

        console.log({ result });
      } catch (error) {
        console.warn(error);
      }

      setDepositing(false);
    }
  };

  return (
    <div className="h-full w-full">
      {squid.connected && squid.sdk.chains.length && squid.sdk.tokens.length ? (
        <>
          <div className="mb-4">
            <div className="mb-2 flex items-center">
              <h3 className="flex-1 pl-1 text-base text-white">From</h3>
              <WalletConnectButton selectedChain={selectedChain} />
            </div>
            <div className="relative flex gap-2">
              <ChainSelect
                className="flex-1"
                value={userConfig.selectedChainId}
                onChange={(chainId) =>
                  setUserConfig((r) => ({ ...r, selectedChainId: chainId }))
                }
              />
              <TokenSelect
                className="flex-1"
                value={userConfig.selectedTokenSymbol}
                tokens={availableTokens}
                onChange={(tokenSymbol) =>
                  setUserConfig((r) => ({
                    ...r,
                    selectedTokenSymbol: tokenSymbol,
                  }))
                }
              />
            </div>
          </div>

          <div className="mb-3 w-full rounded-lg border-1 border-none bg-black bg-opacity-30 p-4">
            <div className="relative mb-2">
              <input
                value={amount === 0 ? undefined : amount}
                type="number"
                placeholder="0.00"
                onChange={(e) => {
                  if (e.target.value === "") return setAmount(undefined);
                  setAmount(Number(e.target.value));
                }}
                className="w-full rounded-md bg-transparent bg-opacity-0 text-2xl text-white text-opacity-80 focus:outline-none"
              />
              <div className="absolute right-2 top-[50%] translate-y-[-50%]">
                {selectedToken?.symbol}
              </div>
            </div>
            <div className="text-sm text-white text-opacity-60">
              $
              {formatNumberCompact(
                (amount ?? 0) * (selectedToken?.usdPrice ?? 0),
              )}
            </div>
          </div>

          <div className="center h-12 gap-1 text-sm">
            {calculatingRoute ? (
              <>
                <div className="font-bold text-white text-opacity-70">
                  Routing..
                </div>
                <div className="h-[9px] w-[9px] animate-pulse-scale rounded-full bg-purple-400" />
              </>
            ) : (
              <>
                <span className="text-white text-opacity-40">Fees + Gas:</span>
                <span className="text-white text-opacity-70">
                  $ {totalFeeCost?.toFixed(2) ?? "0.00"}
                </span>
              </>
            )}
          </div>

          <div className="center mt-4">
            <TransactionButton
              className="w-full"
              disabled={
                !isConnected || !amount || calculatingRoute || depositing
              }
              onClick={onClickDeposit}
            >
              {calculatingRoute ? "..." : "Deposit"}
            </TransactionButton>
          </div>
        </>
      ) : (
        <div className="center absolute bottom-0 left-0 right-0 top-0">
          <div className="overflow-hidden rounded-full bg-black bg-opacity-50 ">
            <Loader loading variant={"Success"} className="h-12 w-12" />
          </div>
        </div>
      )}
    </div>
  );
};

const SwapTransactionButton = () => {
  const { address, isConnected } = useAccount();
  const { chain: currentEvmChain } = useNetwork();

  const { switchNetwork, chains } = useSwitchNetwork();
  return <></>;
};

const ChainSelect = ({
  value,
  className,
  onChange,
}: {
  value: string;
  className?: string;
  onChange: (value: string) => void;
}) => {
  const squid = useSquid();

  const options = useMemo<SelectOption<string>[]>(() => {
    if (squid.connected) {
      return squid.sdk.chains.map((c) => ({
        imageSrc: c.chainIconURI,
        label: c.networkName,
        value: c.networkIdentifier,
      }));
    }
    return [];
  }, [squid, value]);

  const selected = options?.find((o) => o.value === value);

  return (
    <Select
      options={options}
      value={selected!}
      className={className}
      onChange={(a) => {
        onChange(a.value);
      }}
    />
  );
};

const TokenSelect = ({
  value,
  tokens,
  className,
  onChange,
}: {
  value: string;
  tokens: Token[];
  className?: string;
  onChange: (value: string) => void;
}) => {
  const squid = useSquid();

  const options = useMemo<SelectOption<string>[]>(() => {
    if (squid.connected) {
      return tokens.map((c) => ({
        imageSrc: c.logoURI ?? "",
        label: c.symbol,
        value: c.symbol,
      }));
    }
    return [];
  }, [squid, value]);

  const selected = options?.find((o) => o.value === value) ?? options?.[0];

  return (
    <Select
      options={options}
      value={selected!}
      className={className}
      onChange={(a) => {
        onChange(a.value);
      }}
    />
  );
};

type SelectOption<T> = {
  label: string;
  imageSrc: string;
  value: T;
};

const Select = <T,>({
  value,
  options,
  className,
  onChange,
}: {
  value: SelectOption<T>;
  options: SelectOption<T>[];
  className?: string;
  onChange: (value: SelectOption<T>) => void;
}) => {
  const squid = useSquid();

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className={`relative ${className}`}>
          <Listbox.Button
            className={`relative flex w-full cursor-default items-center gap-2 rounded-full bg-gray-800 py-2 pl-3 pr-10 text-left text-white focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm `}
          >
            {value && (
              <img
                src={value.imageSrc}
                height={24}
                width={24}
                alt={"chain.networkIdentifier"}
              />
            )}

            <span className="block truncate">{value?.label}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <MdKeyboardArrowDown
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            show={open}
          >
            <Listbox.Options className="subtle-scroll-bar absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md py-1 text-base  focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.label}
                  className={({ active }) =>
                    `relative mb-1 cursor-default select-none rounded-full bg-gray-800 bg-opacity-20 px-3 py-2 text-xs ${
                      active ? " bg-opacity-90 text-white" : "text-black"
                    }`
                  }
                  value={option}
                >
                  {({ selected }) => (
                    <div className="flex items-center gap-2">
                      <img
                        src={option.imageSrc}
                        height={24}
                        width={24}
                        alt={option.label}
                      />
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {option.label}
                      </span>
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
};

const WalletConnectButton = ({
  selectedChain,
}: {
  selectedChain?: ChainData | null;
}) => {
  const squid = useSquid();
  const [showWalletSelect, setShowWalletSelect] = useState(false);
  const { connect, connectors, error, isLoading, pendingConnector, isSuccess } =
    useConnect();

  const { address, isConnected } = useAccount();
  const { chain: currentEvmChain } = useNetwork();
  const { switchNetwork, chains } = useSwitchNetwork();

  const selectedChainIsConnectedChain =
    Number(selectedChain?.chainId) === currentEvmChain?.id;

  useEffect(() => {
    if (isSuccess) {
      setShowWalletSelect(false);
    }
  }, [isSuccess]);

  const onClickConnect = () => {
    if (isConnected && !selectedChainIsConnectedChain && selectedChain) {
      switchNetwork?.(Number(selectedChain.chainId));
    } else {
      setShowWalletSelect(true);
    }
  };

  return (
    <>
      <button
        className="group relative z-10 flex w-32 items-center rounded-full bg-black bg-opacity-40 px-2 py-1 text-xs text-white transition-all hover:bg-gray-200 hover:text-black"
        onClick={onClickConnect}
      >
        {!isConnected ? (
          <div className="flex flex-1 items-center justify-center gap-1 self-end text-center">
            Connect Wallet
          </div>
        ) : selectedChainIsConnectedChain ? (
          <>
            <div className="flex flex-1 items-center gap-1 group-hover:hidden">
              <div className="flex-1">{shortenAddress(address!, 6, 3)}</div>
              <div className="h-2 w-2 justify-end rounded-full bg-green-400" />
            </div>
            <div className="hidden flex-1 items-center justify-center gap-1 self-end text-center group-hover:flex">
              Change Wallet
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-1 items-center justify-center gap-1 self-end text-center">
              Switch Network
            </div>
            <div className="h-2 w-2 rounded-full bg-orange-300" />
          </>
        )}
      </button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 :scale-95"
        show={showWalletSelect}
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 z-30 h-full w-full bg-gray-900 bg-opacity-90 p-4 backdrop-blur-sm">
          <div className="relative mb-6 text-gray-100">
            <FaAngleLeft
              size={32}
              className="absolute -left-2 top-[50%] translate-y-[-50%]"
              onClick={() => setShowWalletSelect(false)}
            />
            <div className="flex-1 text-center text-base font-bold">
              Wallets
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {selectedChain &&
              connectors.map((connector) => (
                <button
                  className="mb-2 flex w-full items-center gap-2 rounded-lg"
                  disabled={!connector.ready}
                  key={connector.id}
                  onClick={() => {
                    connect({
                      connector,
                      chainId: Number(selectedChain.chainId),
                    });
                  }}
                >
                  <Image
                    src={`/wallets/${connector.name.toLowerCase()}.svg`}
                    alt={`${connector.name} icon`}
                    height={24}
                    width={24}
                  />
                  {connector.name}
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 :scale-95"
                    show={isLoading && connector.id === pendingConnector?.id}
                  >
                    <div className="h-2 w-2 animate-pulse-scale rounded-full bg-orange-400" />
                  </Transition>
                </button>
              ))}
          </div>
        </div>
      </Transition>
    </>
  );
};

export default SquidForm;
