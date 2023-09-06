import {
  isMarketImageBase64Encoded,
  MarketImageString,
} from "lib/types/create-market";
import Image from "next/image";
import { useEffect, useState } from "react";

const getImageUrl = (image: MarketImageString) => {
  if (isMarketImageBase64Encoded(image)) {
    return image;
  }
  return `https://ipfs-gateway.zeitgeist.pm/ipfs/${image}`;
};

const fallbackImageUrl = "/icons/default-market.png";

const MarketImage = ({
  alt = "",
  className = "",
  size = "70px",
  status = "",
  tags,
}: {
  className?: string;
  alt?: string;
  size?: string;
  status?: string;
  tags?: string[];
}) => {
  const [imageUrl, setImageUrl] = useState<string>(fallbackImageUrl);

  const onError = () => {
    setImageUrl(fallbackImageUrl);
  };

  useEffect(() => {
    if (!tags || tags.length === 0) {
      return;
    }
    const tag = tags?.[0];
    setImageUrl(`/category/${tag.toLowerCase()}.png`);
  }, [tags]);

  return (
    <Image
      alt={alt ?? "Market image"}
      src={imageUrl}
      fill
      className="overflow-hidden rounded-lg"
      style={{
        objectFit: "cover",
        objectPosition: "50% 50%",
      }}
      sizes={size}
      onError={onError}
      blurDataURL={fallbackImageUrl}
      placeholder="blur"
    />
  );
};

export default MarketImage;
