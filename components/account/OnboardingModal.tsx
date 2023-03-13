import { Dialog } from "@headlessui/react";
import { useOnboarding } from "lib/state/onboarding";
import { BaseDotsamaWallet } from "lib/wallets/base-dotsama-wallet";
import { PolkadotjsWallet } from "lib/wallets/polkadotjs-wallet";
import { SubWallet } from "lib/wallets/subwallet";
import { TalismanWallet } from "lib/wallets/talisman-wallet";
import { range } from "lodash-es";
import { observer } from "mobx-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useState } from "react";
import Loader from "react-spinners/PulseLoader";

interface StepperProps {
  start: number;
  end: number;
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const Stepper = ({ start, end, currentStep, onStepClick }: StepperProps) => {
  return (
    <div className="flex gap-x-[18px]">
      {range(start, end).map((step) => (
        <button
          key={step}
          onClick={() => onStepClick(step)}
          disabled={step === currentStep}
          className={`rounded-full h-[7px] w-[7px] ${
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
      <div className="font-bold text-ztg-22-120">{headerText}</div>
      <div className="text-center mb-auto">{bodyText}</div>
      <div className="flex justify-center  gap-x-[20px] w-full px-[20px] h-[56px] font-medium">
        {leftButton && (
          <button
            className={`rounded-[100px] border-2 border-pastel-blue w-full ${
              leftButton.disabled === true
                ? "bg-gray-light-2 cursor-default"
                : "border border-pastel-blue"
            }`}
            onClick={leftButton.onClick}
          >
            {leftButton.text}
          </button>
        )}
        {rightButton && (
          <button
            className={`rounded-[100px] border-2 border-pastel-blue w-full ${
              rightButton.disabled === true
                ? "bg-gray-light-2 cursor-default"
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

const walletsConfig = [
  new TalismanWallet(),
  new PolkadotjsWallet(),
  new SubWallet(),
];

const WalletSelection = observer(() => {
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
      {walletsConfig.map((wallet, index) => (
        <button
          key={index}
          className="flex items-center justify-center h-[56px] border border-pastel-blue rounded-ztg-10 text-center w-full"
          onClick={() => handleWalletSelect(wallet)}
        >
          <Image
            src={wallet.logo.src}
            alt={wallet.logo.alt}
            width={30}
            height={30}
            quality={100}
          />
          <div className="relative font-medium text-ztg-18-150 ml-[15px]">
            <span>{wallet.title}</span>
            {wallet.title === "Talisman" && (
              <span className="hidden sm:inline absolute left-[90px] top-[4px] text-ztg-12-120 font-medium bg-green-light text-green py-[4px] px-[8px] rounded-md">
                Recommended
              </span>
            )}
          </div>
        </button>
      ))}

      <button
        disabled={isReloading}
        onClick={handleWalletInstalled}
        className="leading-[42px] w-full mt-6 sm:w-fit text-xl text-center sm:text-start bg-blue-600 text-white rounded px-5 py-2 mb-5 mr-5 font-bold"
      >
        {isReloading ? (
          <Loader color="white" size={12} />
        ) : (
          "I have installed a wallet!"
        )}
      </button>
    </>
  );
});

export const ExchangeTypeSelection = (props: {
  setStep: Dispatch<SetStateAction<number>>;
}) => {
  const exchangeTypes = [
    {
      name: "With Crypto or Fiat (CEX)",
      disabled: false,
      onClick: () => props.setStep(5),
    },
    {
      name: "Credit Card (Coming Soon)",
      disabled: true,
    },
    {
      name: "With Crypto (DEX) (Coming Soon)",
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
          className={`flex items-center justify-center h-[56px] rounded-ztg-10 text-center w-full ${
            exchangeType.disabled === true
              ? "bg-gray-light-2"
              : "border border-pastel-blue"
          }`}
        >
          <div className="font-medium text-ztg-18-150 ml-[15px]">
            {exchangeType.name}
          </div>
        </button>
      ))}
    </>
  );
};

const OnBoardingModal = (props: { step?: number; notice?: string }) => {
  const [step, setStep] = useState(props.step ?? 0);
  const router = useRouter();

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
      headerText="Choose A Browser Extension"
      bodyText="First thing you need to do is install a browser-based wallet (known as a “browser extension”). To do that, simply click the wallet icon to go to its official download page. Once the extension is setup you'll need to refresh the page."
      leftButton={{
        text: "Back",
        onClick: () => setStep(0),
      }}
      rightButton={{
        text: "Continue",
        onClick: () => setStep(2),
      }}
    />,
    <WalletSelection />,
    <TextSection
      headerText="Success on getting a wallet!"
      bodyText="Now to get ZTG."
      leftButton={{
        text: "Back",
        onClick: () => setStep(3),
      }}
      rightButton={{
        text: "Continue",
        onClick: () => setStep(4),
      }}
    />,
    <ExchangeTypeSelection setStep={setStep} />,
    <TextSection
      headerText=""
      bodyText="After installing a wallet, you can now send and receive ZTG, our native
          token. In the below tutorials, we show you how to get ZTG using one of
          either the “MEXC” exchange or “GATE” exchange."
      leftButton={{
        text: "Use Gate.io",
        onClick: () =>
          window.open("https://blog.zeitgeist.pm/how-to-buy-ztg-on-gateio/"),
      }}
      rightButton={{
        text: "Use MEXC",
        onClick: () =>
          window.open("https://blog.zeitgeist.pm/how-to-buy-ztg-on-mexc/"),
      }}
    />,
  ];

  return (
    <Dialog.Panel>
      <div
        className="flex flex-col gap-y-[20px] justify-center items-center bg-white 
             w-full max-w-[526px] p-[30px] rounded-ztg-10"
      >
        <div className="rounded-full w-[120px] h-[120px] mb-auto">
          <Image
            alt="AI Logan?"
            src={"/misc/face.png"}
            width={120}
            height={120}
          />
        </div>

        {screens[step]}

        {props.notice && (
          <div className="text-center py-1 mb-3 text-orange-400 rounded-md">
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
      </div>
    </Dialog.Panel>
  );
};

export default OnBoardingModal;
