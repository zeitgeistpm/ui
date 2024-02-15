import Image from "next/image";
import Link from "next/link";
import { useWallet } from "lib/state/wallet";
import { useEffect, useState } from "react";

export const HeroBannerNTT = () => {
  const { selectWallet, realAddress } = useWallet();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setShowButton(!realAddress);
  }, [realAddress]);

  return (
    <div className="main-container md:mt-18 z-2 relative my-16">
      <div className="relative flex flex-col-reverse md:flex-row md:gap-8">
        <div className=" md:w-[890px] md:pt-8 lg:w-[690px]">
          <h1 className="text-ntt-blue mb-2 text-6xl leading-none">
            NTT Global
          </h1>
          <h2 className="text-ntt-blue mb-8 text-3xl">
            Project Management Portal
          </h2>
          <h3 className="mb-8 text-lg leading-6">
            Helping you make decisions with the power of prediction markets.
          </h3>
          <div className="flex gap-4">
            <Link
              href="https://www.global.ntt/"
              target="_blank"
              className="border-ntt-blue bg-ntt-blue flex-1 rounded-md border-2 px-6 py-3 text-white sm:flex-none"
            >
              Learn More
            </Link>
            {/* {showButton && (
              <button
                onClick={() => selectWallet("web3auth")}
                className="flex-1 rounded-md border-2 border-black bg-transparent px-6 py-3 text-black sm:flex-none"
              >
                Get Started
              </button>
            )} */}
          </div>
        </div>
        <div className="relative mb-8 h-64 w-full overflow-hidden rounded-lg md:mb-0 md:h-auto">
          <Image
            alt="Metropolis"
            fill={true}
            priority
            className="object-cover"
            blurDataURL="ntt/hero-banner.png"
            placeholder="blur"
            src="/ntt/hero-banner.png"
          />
        </div>
      </div>
    </div>
  );
};
