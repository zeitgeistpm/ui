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
    <div className="md:flex md:justify-center md:gap-6 mb-6">
      {supportedCurrencies
        .filter((currency) => options?.includes(currency.name) ?? true)
        .map((currency) => (
          <button
            type="button"
            className={`
              flex flex-col justify-center flex-1 w-full md:max-w-xs rounded-md p-6 md:min-h-[300px] min-h-[150px] 
              cursor-pointer transition-all mb-4 active:scale-95
              ${currency.name === value ? "bg-nyanza-base" : "bg-gray-100"}
            `}
            onClick={handleSelect(currency.name)}
          >
            <div className="flex md:block items-center gap-6">
              <div className="flex w-20 md:justify-center md:items-center md:mb-6 md:w-auto">
                <div className="relative w-20 h-20">
                  <Image
                    alt={`Currency token logo for ${currency.name}`}
                    fill
                    sizes="100vw"
                    src={currency.image}
                  />
                </div>
              </div>
              <div className="text-left md:text-center">
                <h3 className="text-2xl mb-2 md:mb-4">{currency.name}</h3>
                <p className="text-sm md:text-base">{currency.description}</p>
              </div>
            </div>
          </button>
        ))}
    </div>
  );
};

export default CurrencySelect;
