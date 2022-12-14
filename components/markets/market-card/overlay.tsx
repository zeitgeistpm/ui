import { MarketOutcomes } from "lib/types/markets";
import Link from "next/link";
import { ExternalLink, X } from "react-feather";
import MarketCardOverlayOutcomes from "./overlay-categories";

export type MarketCardOverlayProps = {
  marketId: number;
  outcomes: MarketOutcomes;
  className?: string;
  onCloseIconClick?: () => void;
};

const MarketCardOverlay = ({
  marketId,
  outcomes,
  className = "",
  onCloseIconClick,
}: MarketCardOverlayProps) => {
  return (
    <div
      className={
        "w-full absolute bg-white z-ztg-20 rounded-[10px] shadow-ztg-5 p-[16px] flex flex-col " +
        className
      }
    >
      <div className="flex flex-col mb-[25px]">
        <div className="flex flex-row justify-between">
          <div className=" font-bold text-ztg-16-150">
            {outcomes.length} Outcomes
          </div>
          <X
            onClick={onCloseIconClick}
            className="cursor-pointer text-sky-600"
            size={24}
          />
        </div>
        {/* <div className="flex flex-row items-center h-[26px] text-ztg-12-150 text-sky-600">
          Showing 1-4
        </div> */}
      </div>
      <MarketCardOverlayOutcomes marketId={marketId} outcomes={outcomes} />
      <Link
        href={`/markets/${marketId}`}
        className="flex flex-row mt-[30px] h-[24px] items-center cursor-pointer"
      >
        <ExternalLink size={24} className="text-sky-600" />
        <div className="ml-[11px] text-ztg-14-110 text-sky-600 font-bold">
          Go to Market
        </div>
      </Link>
    </div>
  );
};

export default MarketCardOverlay;
