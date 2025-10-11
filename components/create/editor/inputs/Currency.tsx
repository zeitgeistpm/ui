import Image from "next/image";
import { FormEvent } from "../types";
import {
  SupportedCurrencyTag,
  supportedCurrencies,
} from "lib/constants/supported-currencies";

export type CurrencySelectProps = {
  name: string;
  value?: SupportedCurrencyTag;
  onChange: (event: FormEvent<SupportedCurrencyTag>) => void;
  onBlur: (event: FormEvent<SupportedCurrencyTag>) => void;
  options: Array<SupportedCurrencyTag>;
};

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  name,
  options,
  value,
  onChange,
  onBlur,
}) => {
  const handleSelect = (tag: SupportedCurrencyTag) => () => {
    onChange({ target: { name, value: tag }, type: "change" });
    onBlur({ target: { name, value: tag }, type: "blur" });
  };

  return (
    <div className="flex flex-col gap-2 md:flex-row md:gap-2">
      {supportedCurrencies
        .filter((currency) => options?.includes(currency.name) ?? true)
        .map((currency) => (
          <button
            key={currency.name}
            type="button"
            className={`flex h-[72px] flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border p-2 backdrop-blur-md transition-all active:scale-95 ${
              currency.name === value
                ? "border-sky-600/50 bg-sky-600/90 text-white shadow-md"
                : "border-sky-200/30 bg-white/80 text-sky-900 hover:bg-sky-100/80"
            }`}
            onClick={handleSelect(currency.name)}
          >
            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
              <Image
                alt={`Currency token logo for ${currency.name}`}
                fill
                sizes="100vw"
                src={currency.image}
              />
            </div>
            <h3 className="text-xs font-semibold">{currency.name}</h3>
          </button>
        ))}
    </div>
  );
};

export default CurrencySelect;
