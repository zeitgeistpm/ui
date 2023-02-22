import Image from "next/image";

const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="flex gap-x-[15px]">
      {Array(steps)
        .fill(null)
        .map((_, index) => (
          <div
            className={`rounded-full h-[6px] w-[6px] ${
              index === currentStep ? "bg-black" : "bg-sky-600"
            }`}
          ></div>
        ))}
    </div>
  );
};

interface TextSectionProps {
  headerText: string;
  bodyText: string;
  leftButtonText: string;
  rightButtonText: string;
  onLeftButtonClick: () => void;
  onRightButtonClick: () => void;
}
const TextSection = ({
  headerText,
  bodyText,
  leftButtonText,
  rightButtonText,
  onLeftButtonClick,
  onRightButtonClick,
}: TextSectionProps) => {
  return (
    <>
      <div className="font-bold text-ztg-22-120">{headerText}</div>
      <div className="text-center">{bodyText}</div>
      <div className="flex justify-center  gap-x-[20px] w-full px-[20px] h-[56px] font-medium">
        <button
          className="rounded-[100px] border-2 border-pastel-blue w-full"
          onClick={onLeftButtonClick}
        >
          {leftButtonText}
        </button>
        <button
          className="rounded-[100px] border-2 border-pastel-blue w-full"
          onClick={onRightButtonClick}
        >
          {rightButtonText}
        </button>
      </div>
    </>
  );
};

const WalletSelection = () => {
  const wallets = [
    {
      name: "Talisman",
      image: "talisman.png",
      recommended: true,
    },
    {
      name: "Polkadot.js",
      image: "Polkadot-js.png",
      recommended: false,
    },
    {
      name: "Subwallet",
      image: "subwallet.png",
      recommended: false,
    },
  ];

  return (
    <>
      {wallets.map((wallet, index) => (
        <div
          key={index}
          className="flex items-center justify-center h-[56px] border border-pastel-blue rounded-ztg-10 text-center w-full"
        >
          <Image
            src={`/icons/${wallet.image}`}
            alt={wallet.name}
            width={30}
            height={30}
          />
          <div className="font-medium text-ztg-18-150 ml-[15px]">
            {wallet.name}
          </div>
        </div>
      ))}
    </>
  );
};
const ExchangeTypeSelection = () => {
  const exchangeTypes = [
    {
      name: "With Crypto or Fiat (CEX)",
      disabled: false,
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
        <div
          key={index}
          className={`flex items-center justify-center h-[56px] rounded-ztg-10 text-center w-full ${
            exchangeType.disabled === true
              ? "bg-gray-light-2"
              : "border border-pastel-blue"
          }`}
        >
          <div className="font-medium text-ztg-18-150 ml-[15px]">
            {exchangeType.name}
          </div>
        </div>
      ))}
    </>
  );
};

const OnBoardingModal = () => {
  return (
    <div
      className="flex flex-col gap-y-[20px] justify-center items-center bg-white border 
                border-black h-[438px] w-full max-w-[526px] p-[30px] rounded-ztg-10"
    >
      <div className="bg-ztg-blue rounded-full w-[120px] h-[120px]"></div>
      {/* <Image
            alt=
            src={imageUrl}
            fill
            className="rounded-full"
            style={{
              objectFit: "cover",
              objectPosition: "50% 50%",
            }}
            sizes={size}
          /> */}
      <ExchangeTypeSelection />
      <Stepper steps={5} currentStep={1} />
    </div>
  );
};

export default OnBoardingModal;
