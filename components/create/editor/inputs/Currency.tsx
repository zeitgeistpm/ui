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
    <div className="mb-6 md:flex md:justify-center md:gap-6">
      {supportedCurrencies
        .filter((currency) => options?.includes(currency.name) ?? true)
        .map((currency) => (
          <button
            key={currency.name}
            type="button"
            className={`
              mb-4 flex min-h-[150px] w-full flex-1 cursor-pointer flex-col justify-center rounded-md p-6 
              transition-all active:scale-95 md:min-h-[300px] md:max-w-xs
              ${currency.name === value ? "bg-nyanza-base" : "bg-gray-100"}
            `}
            onClick={handleSelect(currency.name)}
          >
            <div className="flex items-center gap-6 md:block">
              <div className="flex w-20 md:mb-6 md:w-auto md:items-center md:justify-center">
                <div className="relative h-20 w-20 overflow-hidden rounded-full">
                  <Image
                    alt={`Currency token logo for ${currency.name}`}
                    fill
                    sizes="100vw"
                    src={currency.image}
                  />
                </div>
              </div>
              <div className="text-left md:text-center">
                <h3 className="mb-2 text-2xl md:mb-4">{currency.name}</h3>
                <p className="text-sm md:text-base">{currency.description}</p>
              </div>
            </div>
          </button>
        ))}
    </div>
  );
};

export default CurrencySelect;
