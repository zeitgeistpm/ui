import Input from "components/ui/Input";

type FeePreset = { type: "preset" | "custom"; value: string };
const Fee = ({
  presets,
  value,
  onChange,
  isValid,
}: {
  presets: string[];
  val;
}) => {
  return (
    <div className="relative flex justify-end pr-8 mr-4 md:mr-0">
      <div className="flex items-center gap-2">
        {presets.map((preset, index) => (
          <button
            key={index}
            type="button"
            onClick={handleSwapFeePresetChange(preset)}
            className={`flex center rounded-full bg-gray-100 py-3 px-6 transition-all active:scale-9 ${
              value?.swapFee?.type === "preset" &&
              value?.swapFee?.value === preset.value &&
              "bg-nyanza-base"
            }`}
          >
            {preset.value}%
          </button>
        ))}
        <div className="relative inline-block">
          <Input
            type="number"
            min={0}
            className={`rounded-md bg-gray-100 py-3 pl-4 pr-34 text-right w-64 outline-none ${
              value?.swapFee?.type === "custom" &&
              fieldState.isValid &&
              "bg-nyanza-base"
            }`}
            value={Number(value?.swapFee?.value).toString()}
            onChange={handleSwapFeeCustomChange}
          />
          <div className="absolute bottom-[50%] center text-gray-600 right-0 rounded-r-md border-2 border-gray-100 border-l-0 px-4 bg-white h-full translate-y-[50%] translate-x-[0%] pointer-events-none">
            % swap fee
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fee;
