import { Dialog } from "@headlessui/react";
import {
  BaseDotsamaWallet,
  PolkadotjsWallet,
  SubWallet,
  TalismanWallet,
} from "@talismn/connect-wallets";
import { useOnboarding } from "lib/state/onboarding";
import { range } from "lodash-es";
import Web3wallet from "components/web3wallet";
import { web3AuthWalletInstance } from "../../lib/state/util/web3auth-config";

import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Loader from "react-spinners/PulseLoader";
import WalletIcon from "./WalletIcon";
import { useWallet } from "lib/state/wallet";

interface StepperProps {
  start: number;
  end: number;
  currentStep: number;
  onStepClick: (step: number) => void;
}

const Stepper = ({ start, end, currentStep, onStepClick }: StepperProps) => {
  return (
    <div className="flex gap-x-[18px]">
      {range(start, end).map((step) => (
        <button
          key={step}
          onClick={() => onStepClick(step)}
          disabled={step === currentStep}
          className={`h-[7px] w-[7px] rounded-full ${
            step === currentStep ? "bg-black" : "bg-sky-600"
          }`}
        ></button>
      ))}
    </div>
  );
};

interface TextSectionProps {
  headerText: string;
  bodyText: string;
  leftButton?: {
    text: string;
    onClick: () => void;
    disabled?: boolean;
  };
  rightButton?: {
    text: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

const TextSection = ({
  headerText,
  bodyText,
  leftButton,
  rightButton,
}: TextSectionProps) => {
  return (
    <>
      <div className="text-center text-xl font-bold">{headerText}</div>
      <div className="mb-auto text-center">{bodyText}</div>
      <div className="flex h-[56px] w-full justify-center gap-x-5 px-5 font-medium">
        {leftButton && (
          <button
            className={`w-full rounded-[100px] border-2 border-pastel-blue ${
              leftButton.disabled === true
                ? "cursor-default bg-gray-light-2"
                : "border border-pastel-blue"
            }`}
            onClick={leftButton.onClick}
          >
            {leftButton.text}
          </button>
        )}
        {rightButton && (
          <button
            className={`w-full rounded-[100px] border-2 border-pastel-blue ${
              rightButton.disabled === true
                ? "cursor-default bg-gray-light-2"
                : "border border-pastel-blue"
            }`}
            onClick={rightButton.onClick}
          >
            {rightButton.text}
          </button>
        )}
      </div>
    </>
  );
};

const TopPic = () => (
  <div className="mb-auto h-[120px] w-[120px] overflow-hidden rounded-full">
    <Image
      alt="Portal Gate"
      src={"/misc/portal_gate.png"}
      objectFit="cover"
      width={120}
      height={120}
    />
  </div>
);

const walletsConfig = [
  new TalismanWallet(),
  new PolkadotjsWallet(),
  new SubWallet(),
  web3AuthWalletInstance,
];

const WalletSelection = () => {
  const { setWalletInstallConfirmed } = useOnboarding();
  const [isReloading, setIsReloading] = useState(false);

  const handleWalletSelect = async (wallet: BaseDotsamaWallet) => {
    window.open(wallet.installUrl);
  };

  const handleWalletInstalled = () => {
    setIsReloading(true);
    setWalletInstallConfirmed(true);
    setTimeout(() => {
      window.location.reload();
    }, 66);
  };

  return (
    <>
      <h3>Broswer-Extension (Option 1)</h3>
      <div className="flex w-full justify-between gap-6">
        {walletsConfig
          .filter((wallet) => wallet.extensionName !== "web3auth")
          .map((wallet, index) => (
            // <button
            //   key={index}
            //   className="flex h-[56px] w-full items-center justify-center rounded-ztg-10 border border-pastel-blue text-center"
            //   onClick={() => handleWalletSelect(wallet)}
            // >
            //   <Image
            //     src={wallet.logo.src}
            //     alt={wallet.logo.alt}
            //     width={30}
            //     height={30}
            //     quality={100}
            //   />
            //   <div className="relative ml-[15px] text-ztg-18-150 font-medium">
            //     <span>{wallet.title}</span>
            //     {wallet.title === "Talisman" && (
            //       <span className="absolute left-[90px] top-[4px] hidden rounded-md bg-green-light px-[8px] py-[4px] text-ztg-12-120 font-medium text-green sm:inline">
            //         Recommended
            //       </span>
            //     )}
            //   </div>
            // </button>
            <WalletIcon
              onClick={() => {
                handleWalletSelect(wallet);
              }}
              wallet={wallet}
              extensionName={wallet.extensionName}
              logoAlt={wallet.logo.alt}
              logoSrc={wallet.logo.src}
              hasError={false}
              error={null}
            />
          ))}
      </div>
      <h3>Social or Email (Option 2)</h3>
      <Web3wallet />
      <button
        disabled={isReloading}
        onClick={handleWalletInstalled}
        className="mb-5 mr-5 mt-6 w-full rounded bg-blue-600 px-5 py-2 text-center text-xl font-bold leading-[42px] text-white sm:w-fit sm:text-start"
      >
        {isReloading ? (
          <Loader color="white" size={12} />
        ) : (
          "I have installed a wallet!"
        )}
      </button>
    </>
  );
};

export const ExchangeTypeSelection = (props: {
  setStep: Dispatch<SetStateAction<number>>;
}) => {
  const exchangeTypes = [
    {
      name: "With Crypto or Fiat (CEX)",
      disabled: false,
      onClick: () => props.setStep(6),
    },
    {
      name: "With Crypto (DEX)",
      disabled: false,
      onClick: () => {
        window.open(
          "https://blog.zeitgeist.pm/how-to-buy-ztg-on-hydradxs-omnipool/",
        );
      },
    },
    {
      name: "Credit Card (Coming Soon)",
      disabled: true,
    },
  ];

  return (
    <>
      {exchangeTypes.map((exchangeType, index) => (
        <button
          key={index}
          disabled={exchangeType.disabled}
          onClick={exchangeType.onClick}
          className={`flex h-[56px] w-full items-center justify-center rounded-ztg-10 text-center ${
            exchangeType.disabled === true
              ? "bg-gray-light-2"
              : "border border-pastel-blue"
          }`}
        >
          <div className="ml-[15px] text-ztg-18-150 font-medium">
            {exchangeType.name}
          </div>
        </button>
      ))}
    </>
  );
};

export const MobileOnboardingModal = () => {
  const [step, setStep] = useState(0);

  const screens = [
    <TextSection
      headerText="Welcome to Zeitgeist"
      bodyText="Hey, it looks like you don’t have a wallet installed. Let me be your guide and help you get one, so you can get started making predictions."
      rightButton={{
        text: "Continue",
        onClick: () => setStep(1),
      }}
    />,
    <TextSection
      headerText="Download a wallet (Option 1)"
      bodyText="First thing you need to do is install a mobile wallet, we recommend Nova wallet. Once you've downloaded it you'll be able to find this site in the app and start making predictions. See you over there!"
      leftButton={{
        text: "Back",
        onClick: () => setStep(0),
      }}
      rightButton={{
        text: "Continue",
        onClick: () => setStep(2),
      }}
    />,
    <TextSection
      headerText="Sign Up Via Social or Email (Option 2)"
      bodyText="Alternatively, you can sign up using your email or social media account. To do that, simply login via the social icon or input your email in the next step and a wallet will be automatically generated for you."
      leftButton={{
        text: "Back",
        onClick: () => setStep(1),
      }}
      rightButton={{
        text: "Continue",
        onClick: () => setStep(3),
      }}
    />,
    <div>
      <div className="mb-8">
        <h3 className="mb-4 text-center">Nova Wallet (Option 1)</h3>
        <a
          href="https://novawallet.io/"
          className="flex h-[56px] w-full items-center justify-center rounded-md border text-center"
        >
          <Image
            src="/icons/nova.png"
            alt={"wallet.logo.alt"}
            width={30}
            height={30}
            quality={100}
          />
          <div className="relative ml-4 font-medium">
            <span>Nova Wallet</span>
          </div>
        </a>
      </div>
      <div>
        <h3 className="mb-4 text-center">Social or Email (Option 2)</h3>
        <Web3wallet />
      </div>
    </div>,
  ];
  return (
    <Dialog.Panel
      className="flex w-full max-w-[526px] flex-col items-center justify-center 
    gap-y-[20px] rounded-ztg-10 bg-white p-[30px]"
    >
      <TopPic />

      {screens[step]}

      <Stepper
        start={0}
        end={screens.length}
        currentStep={step}
        onStepClick={setStep}
      />
    </Dialog.Panel>
  );
};

export const DesktopOnboardingModal = (props: {
  step?: number;
  notice?: string;
}) => {
  const [step, setStep] = useState(props.step ?? 0);
  const { walletId } = useWallet();

  useEffect(() => {
    if (walletId === "web3auth") {
      setStep(4);
    }
  }, [walletId]);

  const screens = [
    <TextSection
      headerText="Welcome to Zeitgeist"
      bodyText="Hey, it looks like you don’t have a wallet installed. Let me be your Guide and help you get one, so you can get started making predictions."
      rightButton={{
        text: "Continue",
        onClick: () => setStep(1),
      }}
    />,
    <TextSection
      headerText="Choose A Browser Extension (Option 1)"
      bodyText="You can install a browser-based wallet known as a “browser extension”. To do that, simply click the wallet icon in the proceeding steps and go to its official download page. Once the extension is setup you'll need to refresh the page."
      leftButton={{
        text: "Back",
        onClick: () => setStep(0),
      }}
      rightButton={{
        text: "Continue",
        onClick: () => setStep(2),
      }}
    />,
    <TextSection
      headerText="Sign Up Via Social or Email (Option 2)"
      bodyText="Alternatively, you can sign up using your email or social media account. To do that, simply login via the social icon or input your email in the next step and a wallet will be automatically generated for you."
      leftButton={{
        text: "Back",
        onClick: () => setStep(1),
      }}
      rightButton={{
        text: "Continue",
        onClick: () => setStep(3),
      }}
    />,
    <WalletSelection />,
    <TextSection
      headerText="Wallet Successfully Installed"
      bodyText="Now the last step is to get some ZTG so that you can start trading Prediction Markets!"
      leftButton={{
        text: "Back",
        onClick: () => setStep(3),
      }}
      rightButton={{
        text: "Continue",
        onClick: () => setStep(5),
      }}
    />,
    <ExchangeTypeSelection setStep={setStep} />,
    <TextSection
      headerText=""
      bodyText="After installing a wallet, you can now send and receive ZTG, our native
          token. In the below tutorial, we show you how to get ZTG using Gate.io, a cryptocurrency exchange."
      leftButton={{
        text: "Use Gate.io",
        onClick: () =>
          window.open("https://blog.zeitgeist.pm/how-to-buy-ztg-on-gateio/"),
      }}
    />,
  ];

  return (
    <Dialog.Panel
      className="flex w-full max-w-[526px] flex-col items-center justify-center 
    gap-y-[20px] rounded-ztg-10 bg-white p-[30px]"
    >
      <TopPic />

      {screens[step]}

      {props.notice && (
        <div className="mb-3 rounded-md py-1 text-center text-orange-400">
          {props.notice}
        </div>
      )}

      {screens.length - (props.step ?? 0) > 1 && (
        <Stepper
          start={props.step ?? 0}
          end={screens.length}
          currentStep={step}
          onStepClick={setStep}
        />
      )}
    </Dialog.Panel>
  );
};
