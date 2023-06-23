import { createContext, useContext } from "react";

const MarketCardContext = createContext<{ baseAsset: string }>({
  baseAsset: "",
});

export default MarketCardContext;
