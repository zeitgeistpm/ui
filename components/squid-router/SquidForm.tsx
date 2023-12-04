import { Transition } from "@headlessui/react";
import { useSquid } from "lib/hooks/squid-router/useSquid";
import Image from "next/image";
import { Fragment, useState } from "react";
import { FaAngleLeft, FaLongArrowAltLeft } from "react-icons/fa";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useNetwork,
  useSwitchNetwork,
} from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

export const SquidForm = () => {
  const squid = useSquid();
  const { address, isConnected } = useAccount();

  const { disconnect } = useDisconnect();

  const { connect, connectors, error, isLoading, isSuccess, pendingConnector } =
    useConnect();

  return (
    <div className="h-full w-full">
      <WalletConnectButton />
      <SwapTransactionButton />
    </div>
  );
};

const SwapTransactionButton = () => {
  const { address, isConnected } = useAccount();
  const { chain: currentEvmChain } = useNetwork();

  const { switchNetwork, chains } = useSwitchNetwork();
  return <></>;
};

const WalletConnectButton = () => {
  const [showWalletSelect, setShowWalletSelect] = useState(false);
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();

  return (
    <>
      <button
        className="z-10"
        onClick={() => {
          setShowWalletSelect(true);
        }}
      >
        Connect Wallet
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
        <div className="absolute bottom-0 left-0 right-0 top-0 z-30 h-full w-full bg-white bg-opacity-30 p-4 backdrop-blur-sm">
          <div className="relative mb-6 text-gray-700">
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
            {connectors.map((connector) => (
              <button
                className="mb-2 flex w-full items-center gap-2 rounded-lg"
                disabled={!connector.ready}
                key={connector.id}
                onClick={() => connect({ connector })}
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
