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

const OnBoardingModal = () => {
  return (
    <div
      className="flex flex-col gap-y-[20px] justify-center items-center bg-white border 
                border-black h-[438px] w-full max-w-[526px] p-[30px] rounded-ztg-10"
    >
      <div className="bg-ztg-blue rounded-full w-[120px] h-[120px]"></div>
      <div className="font-bold text-ztg-22-120">Getting Started</div>
      <div className="text-center">
        First thing you need to do is to Install the right extension for your
        account. To do that, you need to click the wallet icon to go to its
        download page (e.g. Talisman).
      </div>
      <div className="flex justify-center  gap-x-[20px] w-full px-[20px] h-[56px] font-medium">
        <button className="rounded-[100px] border-2 border-pastel-blue w-full">
          Back
        </button>
        <button className="rounded-[100px] border-2 border-pastel-blue w-full">
          Continue
        </button>
      </div>
      <Stepper steps={5} currentStep={1} />
    </div>
  );
};

export default OnBoardingModal;
