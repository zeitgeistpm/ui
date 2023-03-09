import { BaseDotsamaWallet } from "lib/wallets/base-dotsama-wallet";
import { PolkadotjsWallet } from "lib/wallets/polkadotjs-wallet";
import { SubWallet } from "lib/wallets/subwallet";
import { TalismanWallet } from "lib/wallets/talisman-wallet";
import { range } from "lodash-es";
import { observer } from "mobx-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useState } from "react";

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
  const handleWalletSelect = async (wallet: BaseDotsamaWallet) => {
    window.open(wallet.installUrl);
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

const OnBoardingModal = (props: { step?: number }) => {
  const [step, setStep] = useState(props.step ?? 0);
  const router = useRouter();
  return (
    <div
      className="flex flex-col gap-y-[20px] justify-center items-center bg-white 
            h-[438px] w-full max-w-[526px] p-[30px] rounded-ztg-10"
    >
      <div className="rounded-full w-[120px] h-[120px] mb-auto">
        <Image
          alt="AI Logan?"
          src={"/misc/face.png"}
          width={120}
          height={120}
        />
      </div>
      {step === 0 && (
        <TextSection
          headerText="Welcome to Zeitgeist"
          bodyText="Hey, it looks like you don’t have a wallet installed. Let me be your Guide and help you get one, so you can get started making predictions."
          rightButton={{
            text: "Continue",
            onClick: () => setStep(1),
          }}
        />
      )}

      {step === 1 && (
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
        />
      )}

      {step === 2 && <WalletSelection />}

      {step === 3 && (
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
        />
      )}

      {step === 4 && <ExchangeTypeSelection setStep={setStep} />}

      {step === 5 && (
        <TextSection
          headerText=""
          bodyText="After installing a wallet, you can now send and receive ZTG, our native
          token. In the below tutorials, we show you how to get ZTG using one of
          either the “MEXC” exchange or “GATE” exchange."
          leftButton={{
            text: "Use Gate.io",
            onClick: () =>
              router.push("https://www.gate.io/trade/ZTG_USDT", "_blank"),
          }}
          rightButton={{
            text: "Use MEXC",
            onClick: () => null,
            disabled: true,
          }}
        />
      )}

      {6 - (props.step ?? 0) > 1 && (
        <Stepper
          start={props.step ?? 0}
          end={6}
          currentStep={step}
          onStepClick={setStep}
        />
      )}
    </div>
  );
};

export default OnBoardingModal;
