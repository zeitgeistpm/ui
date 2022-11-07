import { useState, useEffect } from "react";
import {
  MarketImageString,
  isMarketImageBase64Encoded,
} from "lib/types/create-market";

const useMarketImageUrl = (image?: MarketImageString) => {
  const [imageUrl, setImageUrl] = useState<string>("/icons/default-market.png");

  useEffect(() => {
    if (image == null) {
      return;
    }
    if (isMarketImageBase64Encoded(image)) {
      return setImageUrl(image);
    }
    const ipfsUrl = `https://ipfs-gateway.zeitgeist.pm/ipfs/${image}`;
    return setImageUrl(ipfsUrl);
  }, [image]);

  return imageUrl;
};

export default useMarketImageUrl;
