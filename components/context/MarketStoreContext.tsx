import { createContext } from "react";
import MarketStore from "lib/stores/MarketStore";

export const MarketStoreContext = createContext<MarketStore>(null);
