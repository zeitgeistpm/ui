import { Dialog } from "@headlessui/react";
import { range } from "lodash-es";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useWallet } from "lib/state/wallet";
import WalletSelect from "./WalletSelect";
import WalletIcon from "./WalletIcon";
import { getWallets } from "@talismn/connect-wallets";
import { SUPPORTED_WALLET_NAMES } from "lib/constants";

interface StepperProps {
  start: number;
  end: number;
  currentStep: number;
  onStepClick: (step: number) => void;
}

interface ButtonProps {
  className?: string;
  title: string;
  icon?: React.ReactNode | string;
  disabled: boolean;
  onClick: () => void;
}
interface ButtonListProps {
  setStep?: Dispatch<SetStateAction<number>>;
  buttonList: ButtonProps[];
}

const exchangeList = [
  {
    title: "HydraDX (DEX)",
    disabled: false,
    onClick: () => {
      window.open(
        "https://blog.zeitgeist.pm/how-to-buy-ztg-on-hydradxs-omnipool/",
      );
    },
  },
  {
    className: "",
    title: "Banxa (Fiat)",
    icon: (
      <span className="rounded bg-green-600 px-2 py-1 text-xs text-white">
        NEW
      </span>
    ),
    disabled: false,
    onClick: () =>
      window.open(
        "https://checkout.banxa.com/?coinType=ZTG&blockchain=ZTG&orderMode=BUY",
      ),
  },
];

const resourceList = [
  {
    title: "Blog",
    disabled: false,
    icon: "/icons/google-g.svg",
    onClick: () => window.open("https://blog.zeitgeist.pm"),
  },
  {
    title: "Discord",
    disabled: false,
    icon: "/icons/discord.svg",
    onClick: () => window.open("https://discord.com/invite/xv8HuA4s8v"),
  },
  {
    title: "Telegram",
    disabled: false,
    icon: "/icons/telegram.svg",
    onClick: () => window.open("https://t.me/zeitgeist_official"),
  },
  {
    title: "Twitter",
    disabled: false,
    icon: "/icons/x-logo.svg",
    onClick: () => window.open("https://twitter.com/ZeitgeistPM"),
  },
];

const Stepper = ({ start, end, currentStep, onStepClick }: StepperProps) => {
  return (
    <div className="mt-4 flex gap-x-2">
      {range(start, end).map((step) => (
        <button
          key={step}
          onClick={() => onStepClick(step)}
          disabled={step === currentStep}
          className={`h-[5px] w-full ${step === currentStep ? "bg-black" : "bg-mystic"
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
      <div className="text-2xl font-bold">{headerText}</div>
      <p>{bodyText}</p>
      {children && children}
      {(leftButton || rightButton) && (
        <div className="flex h-[56px] w-full gap-x-5 font-medium">
          {leftButton && (
            <button
              className={`w-full rounded-[100px] bg-mystic hover:bg-gray-100 ${leftButton.disabled === true
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
              className={`w-full rounded-[100px] bg-ztg-blue text-white hover:bg-black ${rightButton.disabled === true
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

export const ButtonList: React.FC<ButtonListProps> = ({ buttonList }) => {
  const [isDisclaimerChecked, setIsDisclaimerChecked] = useState(false);

  return (
    <>
      {buttonList.map((button, index) => {
        if (button.title === "Banxa (Fiat)") {
          return (
            <>
              <button
                key={index}
                disabled={button.disabled || !isDisclaimerChecked}
                onClick={button.onClick}
                className={`flex min-h-[56px] w-full items-center justify-center rounded-lg bg-mystic p-2 text-center hover:bg-gray-100 ${button?.className} ${button.disabled === true || !isDisclaimerChecked ? "bg-gray-light-2 cursor-not-allowed opacity-50" : "border"
                  }`}
              >
                <div className="ml-4 flex items-center gap-2 text-lg font-medium">
                  <span>{button.title}</span>
                  <span>{button?.icon}</span>
                </div>
              </button>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="banxa-disclaimer"
                  checked={isDisclaimerChecked}
                  onChange={() => setIsDisclaimerChecked(!isDisclaimerChecked)}
                />
                <label htmlFor="banxa-disclaimer" className="ml-2 text-sm">
                  I understand that I will be redirected to Banxa, a third-party website to complete the payment and will be subject to their terms of service.
                </label>
              </div>
            </>
          );
        } else {
          return (
            <button
              key={index}
              disabled={button.disabled}
              onClick={button.onClick}
              className={`flex min-h-[56px] w-full items-center justify-center rounded-lg bg-mystic p-2 text-center hover:bg-gray-100 ${button?.className} ${button.disabled === true ? "bg-gray-light-2" : "border"
                }`}
            >
              <div className="ml-4 flex items-center gap-2 text-lg font-medium">
                <span>{button.title}</span>
                <span>{button?.icon}</span>
              </div>
            </button>
          );
        }
      })}
    </>
  );
};

export const ResourceList: React.FC<ButtonListProps> = ({ buttonList }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {resourceList.map((resource, index) =>
        resource.title === "Blog" ? (
          <button
            key={index}
            disabled={resource.disabled}
            onClick={resource.onClick}
            className={`col-span-3 flex min-h-[56px] w-full items-center justify-center rounded-lg bg-mystic p-2 text-center hover:bg-gray-100 ${resource.disabled === true ? "bg-gray-light-2" : "border"
              }`}
          >
            <span className="ml-4 flex items-center gap-2 text-lg font-medium">
              {resource.title}
            </span>
          </button>
        ) : (
          <WalletIcon
            onClick={resource.onClick}
            logoAlt={resource.title}
            logoSrc={resource.icon}
            className={resource.title == "Twitter" ? "invert" : ""}
            extensionName="web3auth"
          />
        ),
      )}
    </div>
  );
};

export const DesktopOnboardingModal = (props: {
  step?: number;
  notice?: string;
}) => {
  const [step, setStep] = useState(props.step ?? 0);
  const { walletId, activeAccount } = useWallet();

  const hasWallet =
    typeof window !== "undefined" &&
    getWallets().some(
      (wallet) =>
        wallet?.installed &&
        SUPPORTED_WALLET_NAMES.some(
          (walletName) => walletName === wallet.extensionName,
        ),
    );

  useEffect(() => {
    if (hasWallet && activeAccount) {
      setStep(1);
    }
  }, [hasWallet, activeAccount]);

  const screens = [
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
      children={<ResourceList setStep={setStep} buttonList={resourceList} />}
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
      className="mt-8 flex w-full max-w-[450px]  
    flex-col gap-y-[20px] rounded-ztg-10 bg-white p-8"
    >
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
