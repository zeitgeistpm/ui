import { createContext, useContext } from "react";

const MarketCardContext = createContext<{ baseAsset: string }>(null);

export default MarketCardContext;
