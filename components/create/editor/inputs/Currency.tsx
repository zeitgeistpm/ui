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
  const availableCurrencies = supportedCurrencies.filter(
    (currency) => options?.includes(currency.name) ?? true,
  );

  return (
    <div className="flex h-12 w-full items-center rounded-lg border-2 border-white/20 bg-white/10 backdrop-blur-sm transition-all hover:border-white/30">
      <select
        value={value || ""}
        className="h-full w-full bg-transparent px-4 py-3 text-left text-sm text-white outline-none placeholder:text-white/50"
        onChange={(e) => {
          const selectedValue = e.target.value || undefined;
          onChange({
            target: {
              name,
              value: selectedValue as SupportedCurrencyTag | undefined,
            },
            type: "change",
          });
          onBlur({
            target: {
              name,
              value: selectedValue as SupportedCurrencyTag | undefined,
            },
            type: "blur",
          });
        }}
      >
        <option value="" className="bg-ztg-primary-600 text-white">
          Select currency
        </option>
        {availableCurrencies.map((currency) => (
          <option
            key={currency.name}
            value={currency.name}
            className="bg-ztg-primary-600 text-white"
          >
            {currency.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelect;
