import { Dialog } from "@headlessui/react";
import {
  PolkadotjsWallet,
  SubWallet,
  TalismanWallet,
} from "@talismn/connect-wallets";
import { range } from "lodash-es";
import { web3AuthWalletInstance } from "../../lib/state/util/web3auth-config";

import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { useWallet } from "lib/state/wallet";

import TwitterIcon from "components/icons/TwitterIcon";
import { BsTelegram, BsDiscord } from "react-icons/bs";
import { isWSX } from "lib/constants";

interface StepperProps {
  start: number;
  end: number;
  currentStep: number;
  onStepClick: (step: number) => void;
}

interface ButtonProps {
  title: string;
  icon?: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}
interface ButtonListProps {
  setStep?: Dispatch<SetStateAction<number>>;
  buttonList: ButtonProps[];
}

const exchangeList = [
  {
    title: "Purchase ZTG with Crypto or Fiat (CEX)",
    disabled: false,
    onClick: () =>
      window.open("https://blog.zeitgeist.pm/how-to-buy-ztg-on-gateio/"),
  },
  {
    title: "Trade for ZTG with Crypto (DEX)",
    disabled: false,
    onClick: () => {
      window.open(
        "https://blog.zeitgeist.pm/how-to-buy-ztg-on-hydradxs-omnipool/",
      );
    },
  },
];

const resourceList = isWSX
  ? [
      {
        title: "Discord",
        icon: <BsDiscord />,
        disabled: false,
        onClick: () => window.open("https://discord.com/invite/xv8HuA4s8v"),
      },
      {
        title: "Telegram",
        icon: <BsTelegram />,
        disabled: false,
        onClick: () => window.open("https://t.me/zeitgeist_official"),
      },
      {
        title: "Twitter",
        icon: <TwitterIcon />,
        disabled: false,
        onClick: () => window.open("https://twitter.com/ZeitgeistPM"),
      },
    ]
  : [
      {
        title: "Blog",
        disabled: false,
        onClick: () => window.open("https://blog.zeitgeist.pm"),
      },
      {
        title: "Discord",
        icon: <BsDiscord />,
        disabled: false,
        onClick: () => window.open("https://discord.com/invite/xv8HuA4s8v"),
      },
      {
        title: "Telegram",
        icon: <BsTelegram />,
        disabled: false,
        onClick: () => window.open("https://t.me/zeitgeist_official"),
      },
      {
        title: "Twitter",
        icon: <TwitterIcon />,
        disabled: false,
        onClick: () => window.open("https://twitter.com/ZeitgeistPM"),
      },
    ];

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
  children?: React.ReactNode;
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
  children,
}: TextSectionProps) => {
  return (
    <>
      <div className="text-center text-2xl font-bold">{headerText}</div>
      <div className="mb-auto text-center">{bodyText}</div>
      {children && children}
      {(leftButton || rightButton) && (
        <div className="flex h-[56px] w-full justify-center gap-x-5 px-5 font-medium">
          {leftButton && (
            <button
              className={`w-full rounded-[100px] border-2 hover:bg-gray-200 ${
                leftButton.disabled === true
                  ? "cursor-default bg-gray-light-2"
                  : "border"
              }`}
              onClick={leftButton.onClick}
            >
              {leftButton.text}
            </button>
          )}
          {rightButton && (
            <button
              className={`w-full rounded-[100px] border-2 hover:bg-gray-200 ${
                rightButton.disabled === true
                  ? "cursor-default bg-gray-light-2"
                  : "border"
              }`}
              onClick={rightButton.onClick}
            >
              {rightButton.text}
            </button>
          )}
        </div>
      )}
    </>
  );
};

const TopPic = () => (
  <div className="mb-6">
    <Image
      alt="Portal Gate"
      src={"/wsx/wsx-logo-header.svg"}
      objectFit="cover"
      width={200}
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

export const ButtonList: React.FC<ButtonListProps> = ({ buttonList }) => {
  return (
    <>
      {buttonList.map((button, index) => (
        <button
          key={index}
          disabled={button.disabled}
          onClick={button.onClick}
          className={`flex h-[56px] w-full items-center justify-center rounded-lg text-center hover:bg-gray-200 ${
            button.disabled === true ? "bg-gray-light-2" : "border"
          }`}
        >
          <div className="ml-4 flex items-center gap-2 text-lg font-medium">
            <span>{button.title}</span>
            <span>{button?.icon}</span>
          </div>
        </button>
      ))}
    </>
  );
};

export const DesktopOnboardingModal = (props: {
  step?: number;
  notice?: string;
}) => {
  const [step, setStep] = useState(props.step ?? 0);
  const { walletId } = useWallet();

  useEffect(() => {
    if (walletId) {
      setStep(1);
    }
  }, [walletId]);

  const screens = isWSX
    ? [
        <TextSection
          children={<WalletSelect />}
          headerText="Create an Account"
          bodyText="Use one of the following options to create a wallet and start trading."
        />,
        <TextSection
          headerText="Account Created"
          bodyText="Your account will soon be funded with 2 Million WSX tokens so that you can start trading! Please allow a few minutes for the tokens to appear in your wallet."
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
          children={<ButtonList setStep={setStep} buttonList={resourceList} />}
          headerText="You're All Set!"
          bodyText="If you have any questions, feel free to check out our community channels."
          leftButton={{
            text: "Back",
            onClick: () => setStep(1),
          }}
        />,
      ]
    : [
        <TextSection
          children={<WalletSelect />}
          headerText="Create an Account"
          bodyText="Use one of the following options to create a wallet and start trading."
        />,
        <TextSection
          children={<ButtonList setStep={setStep} buttonList={exchangeList} />}
          headerText="Wallet Successfully Installed"
          bodyText="It's time to get ZTG so that you can start trading!"
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
          children={<ButtonList setStep={setStep} buttonList={resourceList} />}
          headerText="You're All Set!"
          bodyText="If you have any questions, feel free to check out our community channels."
          leftButton={{
            text: "Back",
            onClick: () => setStep(1),
          }}
        />,
      ];

  return (
    <Dialog.Panel
      className="flex w-full max-w-[450px] flex-col items-center justify-center 
    gap-y-[20px] rounded-ztg-10 bg-white p-8"
    >
      {/* <TopPic /> */}

      {screens[step]}

      {props.notice && (
        <div className="mb-3 rounded-md py-1 text-center text-orange-400">
          {props.notice}
        </div>
      )}

      {screens.length - (props.step ?? 0) > 1 && walletId && (
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
