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
} from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { Connector } from "wagmi";
import { Loader } from "../ui/Loader";
import { ChainData, Token } from "@0xsquid/squid-types";
import { shortenAddress } from "lib/util";
import { formatNumberCompact } from "lib/util/format-compact";

export const SquidForm = () => {
  const squid = useSquid();
  const { address, isConnected } = useAccount();

  const { disconnect } = useDisconnect();

  const { connect, connectors, error, isLoading, isSuccess, pendingConnector } =
    useConnect();

  const [selectedChainId, setSelectedChainId] = useState("Ethereum");
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState("USDC");

  const selectedChain = useMemo(() => {
    if (squid.connected) {
      return squid.sdk.chains.find(
        (c) => c.networkIdentifier === selectedChainId,
      );
    }
    return null;
  }, [squid, selectedChainId]);

  const availableTokens = useMemo(() => {
    if (squid.connected) {
      return squid.sdk.tokens.filter((t) => {
        return t.chainId === selectedChain?.chainId;
      });
    }
    return [];
  }, [squid, selectedChain]);

  const selectedToken = useMemo(() => {
    if (availableTokens) {
      return availableTokens.find((t) => t.symbol === selectedTokenSymbol);
    }
    return availableTokens?.[0];
  }, [availableTokens, selectedTokenSymbol]);

  const [amount, setAmount] = useState<number | undefined>(0);

  return (
    <div className="h-full w-full">
      {squid.connected ? (
        <>
          <div className="mb-4">
            <div className="mb-2 flex items-center">
              <h3 className="flex-1 pl-1 text-base text-white">From</h3>
              <WalletConnectButton selectedChain={selectedChain} />
            </div>
            <div className="relative flex gap-2">
              <ChainSelect
                className="flex-1"
                value={selectedChainId}
                onChange={(chainId) => setSelectedChainId(chainId)}
              />
              <TokenSelect
                className="flex-1"
                value={selectedTokenSymbol}
                tokens={availableTokens}
                onChange={(tokenSymbol) => setSelectedTokenSymbol(tokenSymbol)}
              />
            </div>
          </div>

          <div className="w-full rounded-lg border-1 border-none bg-black bg-opacity-30 p-4">
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

          <SwapTransactionButton />
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
      return squid.sdk.chains
        .filter((c) => !c.networkName.toLowerCase().match("moonbeam"))
        .map((c) => ({
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
    if (!selectedChainIsConnectedChain && selectedChain) {
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
          "Connect Wallet"
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
