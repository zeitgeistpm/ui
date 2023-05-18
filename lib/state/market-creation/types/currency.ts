import { AssetId } from "@zeitgeistpm/sdk-next"
import { Unpacked } from "@zeitgeistpm/utility/dist/array"

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
  assetId: { Ztg: null } as const,
} satisfies CurrencySpec

export const dot = {
  name: "DOT" as const,
  description: "Create market with DOT as the base asset.",
  image: "/currencies/dot_filled.png",
  assetId: { ForeignAsset: 0 } as const,
} satisfies CurrencySpec

export const supportedCurrencies = [ztg, dot] as const;

export type SupportedCurrencyTag = Unpacked<typeof supportedCurrencies>[number]["name"]