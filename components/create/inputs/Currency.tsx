import { AssetId, ZtgAssetId } from "@zeitgeistpm/sdk-next";
import { Unpacked } from "@zeitgeistpm/utility/dist/array";
import Image from "next/image";

export type CurrencySelectProps = {
  value?: Unpacked<typeof supportedCurrencies>["name"];
  onChange?: (value: Unpacked<typeof supportedCurrencies>["name"]) => void;
  options: Array<Unpacked<typeof supportedCurrencies>["name"]>;
};

export type CurrencySpec = {
  name: string
  description: string
  image: string
  assetId: AssetId,
}

export const ztg = {
  name: "ZTG" as const,
  description:
    "Create market with the native Zeitgeist token as the base asset.",
  image: "/currencies/ztg_neue.png",
  assetId: { Ztg: null } as ZtgAssetId,
} satisfies CurrencySpec

export const dot = {
  name: "DOT" as const,
  description: "Create market with DOT as the base asset.",
  image: "/currencies/dot_filled.png",
  assetId: { ForeignAsset: 0 },
} satisfies CurrencySpec

export const supportedCurrencies = [ztg, dot];


export const CurrencySelect: React.FC<CurrencySelectProps> = ({ options, value, onChange }) => {
  return (
    <div className="flex center gap-6">
      {supportedCurrencies
        .filter((currency) => options?.includes(currency.name) ?? true)
        .map((currency) => (
          <div 
            className={`flex flex-col flex-1 max-w-xs rounded-md p-6 min-h-[300px] ${currency.name === value ? "bg-green-200" : "bg-gray-200"}`} 
            onClick={() => onChange(currency.name)}>
            <div className="flex center mb-6">
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
          </div>
        ))}
    </div>
  );
};

export default CurrencySelect;
