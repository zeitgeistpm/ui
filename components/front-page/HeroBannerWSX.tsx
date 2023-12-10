import Image from "next/image";
import Link from "next/link";
import { useWallet } from "lib/state/wallet";

export const HeroBannerWSX = ({}: {}) => {
  const { selectWallet, realAddress } = useWallet();

  return (
    <div className="main-container md:mt-18 z-2 relative my-16">
      <div className="relative flex flex-col-reverse md:flex-row md:gap-8">
        <div className="md:w-[890px] md:pt-8 lg:w-[690px]">
          <h1 className="mb-8 text-5xl leading-tight">
            Welcome to the Future of Politics
          </h1>
          <h2 className="mb-8 text-xl leading-6">
            The Washington Stock Exchange is a new innovative platform for
            predicting future political events
          </h2>
          <div className="flex gap-4">
            <Link
              href="https://thewsx.com/"
              target="_blank"
              className="flex-1 rounded-md border-2 border-vermilion bg-vermilion px-6 py-3 text-white sm:flex-none"
            >
              Learn More
            </Link>
            {!realAddress && (
              <button
                onClick={() => selectWallet("web3auth")}
                className="flex-1 rounded-md border-2 border-black bg-transparent px-6 py-3 text-black sm:flex-none"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
        <div className="relative mb-8 h-64 w-full overflow-hidden rounded-lg md:mb-0 md:h-auto">
          <Image
            alt="Futuristic City Image"
            fill={true}
            priority
            className="object-cover"
            blurDataURL="wsx/wsx-hero.svg"
            placeholder="blur"
            src="/wsx/wsx-hero.png"
          />
        </div>
      </div>
    </div>
  );
};
