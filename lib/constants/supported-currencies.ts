import { AssetId } from "@zeitgeistpm/sdk-next";
import { Unpacked } from "@zeitgeistpm/utility/dist/array";

export type CurrencyMetadata = {
  name: string;
  description: string;
  image: string;
  assetId: AssetId;
};

export const supportedCurrencies = [
  {
    name: "ZTG" as const,
    description:
      "Create market with the native Zeitgeist token as the base asset.",
    image: "/currencies/ztg.svg",
    assetId: { Ztg: null } as const,
  } satisfies CurrencyMetadata,
  {
    name: "DOT" as const,
    description: "Create market with DOT as the base asset.",
    image: "/currencies/dot_filled.png",
    assetId: { ForeignAsset: 0 } as const,
  } satisfies CurrencyMetadata,
] as const;

export type SupportedCurrencyTag = Unpacked<
  typeof supportedCurrencies
>[number]["name"];
