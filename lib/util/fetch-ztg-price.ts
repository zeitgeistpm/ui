import Decimal from "decimal.js";
import { ZTGInfo } from "lib/stores/Store";

export const fetchZTGPrice = async (): Promise<ZTGInfo> => {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=zeitgeist&vs_currencies=usd&include_24hr_change=true",
  );
  const json = await res.json();

  return {
    price: new Decimal(json.zeitgeist.usd),
    change: new Decimal(json.zeitgeist.usd_24h_change),
  };
};
