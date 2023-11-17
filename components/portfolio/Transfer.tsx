import { ArrowRight } from "react-feather";
import Image from "next/image";
import { CHAIN_IMAGES } from "lib/constants/chains";

const Transfer = ({
  sourceChain,
  destinationChain,
}: {
  sourceChain: string;
  destinationChain: string;
}) => {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center justify-center gap-4 md:w-[170px]">
        <Image
          className="h-[30px] w-[30px] sm:h-[50px] sm:w-[50px]"
          src={CHAIN_IMAGES[sourceChain]}
          alt={sourceChain}
          width={50}
          height={50}
        />
        <div>{sourceChain}</div>
      </div>
      <ArrowRight />
      <div className="flex items-center justify-center gap-4 md:w-[170px]">
        <Image
          className="h-[30px] w-[30px] sm:h-[50px] sm:w-[50px]"
          src={CHAIN_IMAGES[destinationChain]}
          alt={destinationChain}
          width={50}
          height={50}
        />
        <div>{destinationChain}</div>
      </div>
    </div>
  );
};

export default Transfer;
