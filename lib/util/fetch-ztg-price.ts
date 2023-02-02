import Decimal from "decimal.js";
import { ZTGInfo } from "lib/stores/Store";

async function fetchCoinGecko(): Promise<ZTGInfo> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=zeitgeist&vs_currencies=usd&include_24hr_change=true",
  );
  const json = await res.json();

  return {
    price: new Decimal(json.zeitgeist.usd),
    change: new Decimal(json.zeitgeist.usd_24h_change),
  };
}

async function fetchSubscan(): Promise<ZTGInfo> {
  const res = await fetch("https://zeitgeist.api.subscan.io/api/scan/token");
  const json = await res.json();

  return {
    price: new Decimal(json.data.detail.ZTG.price),
    change: new Decimal(json.data.detail.ZTG.price_change),
  };
}

export const fetchZTGPrice = async (): Promise<ZTGInfo> => {
  let res: ZTGInfo;
  for (const fetchFunc of [fetchCoinGecko, fetchSubscan]) {
    if (res != null) {
      break;
    }
    res = await fetchFunc();
  }
  return res;
};
