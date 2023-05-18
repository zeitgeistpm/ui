import {
  SupportedCurrencyTag,
  supportedCurrencies,
} from "lib/state/market-creation/types/currency";
import Image from "next/image";
import { FormEvent } from "../types";

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
    <div className="flex center gap-6">
      {supportedCurrencies
        .filter((currency) => options?.includes(currency.name) ?? true)
        .map((currency) => (
          <button
            type="button"
            className={`
              flex flex-col flex-1 max-w-xs rounded-md p-6 min-h-[300px] cursor-pointer transition-all 
              ${currency.name === value ? "bg-nyanza-base" : "bg-gray-200"}
            `}
            onClick={handleSelect(currency.name)}
          >
            <div className="w-full flex center mb-6">
              <div className="relative w-20 h-20">
                <Image
                  alt={`Currency token logo for ${currency.name}`}
                  fill
                  sizes="100vw"
                  src={currency.image}
                />
              </div>
            </div>
            <div className="flex-1 text-center">
              <h3 className="text-2xl mb-4">{currency.name}</h3>
              <p className="w-3/4 mx-auto">{currency.description}</p>
            </div>
          </button>
        ))}
    </div>
  );
};

export default CurrencySelect;
