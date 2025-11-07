import { InfoPopover } from "components/ui/InfoPopover";
import { PromotedMarket } from "lib/cms/get-promoted-markets";
import { MarketPageIndexedData } from "lib/gql/markets";
import Image from "next/image";
import dynamic from "next/dynamic";
import { FC, ReactNode } from "react";
import { HiOutlineShieldCheck, HiOutlineEye } from "react-icons/hi";
import { MdModeEdit } from "react-icons/md";
import { CompactAddress, CompactCreatorBadge } from "./MarketHeaderUtils";
import { MarketPromotionCallout } from "./PromotionCallout";

const QuillViewer = dynamic(() => import("../../components/ui/QuillViewer"), {
  ssr: false,
});

const MarketFavoriteToggle = dynamic(
  () => import("./MarketFavoriteToggle").then((m) => m.MarketFavoriteToggle),
  {
    ssr: false,
  },
);

// Reusable icon badge with tooltip
const IconBadge: FC<{
  icon: ReactNode;
  tooltip: string | ReactNode;
  bgColor: string;
  tooltipAlign?: "left" | "center" | "right";
  label?: string; // Optional label for two-line tooltips
}> = ({ icon, tooltip, bgColor, tooltipAlign = "center", label }) => {
  const tooltipPositionClasses = {
    left: "left-0",
    center: "left-1/2 -translate-x-1/2",
    right: "right-0",
  };

  return (
    <div className="group relative">
      <div
        className={`flex h-6 w-6 cursor-help items-center justify-center rounded-lg ${bgColor} backdrop-blur-sm transition-all hover:scale-110 hover:opacity-95 hover:shadow-md`}
      >
        {icon}
      </div>
      <div
        className={`pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 ${tooltipPositionClasses[tooltipAlign]}`}
      >
        <div className="rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
          {label ? (
            <>
              <div className="mb-0.5 font-medium">{label}</div>
              <div className="font-mono text-xxs">{tooltip}</div>
            </>
          ) : (
            <>{tooltip}</>
          )}
        </div>
      </div>
    </div>
  );
};

interface MarketMetadataBadgesProps {
  market: MarketPageIndexedData;
  token?: string;
  imagePath: string;
  promotionData?: PromotedMarket | null;
}

export const MarketMetadataBadges: FC<MarketMetadataBadgesProps> = ({
  market,
  token,
  imagePath,
  promotionData,
}) => {
  // Get dispute mechanism description based on type
  const getDisputeMechanismDescription = (
    mechanism: MarketPageIndexedData["disputeMechanism"] | null | undefined,
  ): string => {
    switch (mechanism) {
      case "Authorized":
        return "Disputes are resolved by an authorized party. The authorized resolver has the authority to determine the final outcome of this market.";
      case "SimpleDisputes":
        return "Uses a simple community dispute mechanism. Community members can dispute the reported outcome, and disputes are resolved through a straightforward voting process.";
      case "Court":
        return "Uses the Court dispute mechanism for resolution.";
      case null:
      case undefined:
      default:
        return "No dispute mechanism - resolves automatically when reported.";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
      <CompactCreatorBadge address={market.creator} />

      {/* Oracle Badge - Icon Only with Tooltip */}
      <IconBadge
        icon={<HiOutlineEye size={14} className="text-amber-600" />}
        label="Oracle"
        tooltip={market.oracle}
        bgColor="bg-amber-100/80"
        tooltipAlign="left"
      />

      {/* Token Badge - Icon Only */}
      <IconBadge
        icon={
          <Image
            width={14}
            height={14}
            src={imagePath}
            alt="Currency token"
            className="rounded-full"
          />
        }
        label="Currency"
        tooltip={token ?? "—"}
        bgColor="bg-white/60"
      />

      {/* Court Badge - Icon Only */}
      {market.disputeMechanism === "Court" && (
        <IconBadge
          icon={
            <Image width={12} height={12} src="/icons/court.svg" alt="court" />
          }
          tooltip="Court Dispute Mechanism"
          bgColor="bg-purple-100/80"
        />
      )}

      {/* Verified Badge - Icon Only */}
      <IconBadge
        icon={
          <Image
            width={14}
            height={14}
            src="/icons/verified-icon.svg"
            alt="verified"
          />
        }
        tooltip="Verified Market"
        bgColor="bg-green-100/80"
      />

      {/* Trusted Badge - Click for Details */}
      {(market.disputeMechanism === "Authorized" ||
        market.disputeMechanism === "SimpleDisputes" ||
        !market.disputeMechanism) && (
        <div className="group relative">
          <InfoPopover
            position="bottom-end"
            icon={
              <div className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-orange-100/80 backdrop-blur-sm transition-all hover:scale-110 hover:bg-orange-200/80 hover:shadow-md">
                <HiOutlineShieldCheck size={14} className="text-orange-700" />
              </div>
            }
          >
            <div className="text-left">
              <h4 className="mb-2 text-sm font-bold">Trusted Market</h4>
              <div className="mb-3 text-xs text-gray-500">
                {getDisputeMechanismDescription(market.disputeMechanism)}
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-xs text-gray-500">Creator:</span>
                  <CompactAddress address={market.creator} />
                </div>
                <div>
                  <span className="text-xs text-gray-500">Oracle:</span>
                  <CompactAddress address={market.oracle} />
                </div>
              </div>
            </div>
          </InfoPopover>
        </div>
      )}

      {/* Edited Badge - Click for Details */}
      {market.hasEdits && (
        <div className="group relative">
          <InfoPopover
            position="bottom-end"
            icon={
              <div className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-yellow-100/80 backdrop-blur-sm transition-all hover:scale-110 hover:bg-yellow-200/80 hover:shadow-md">
                <MdModeEdit size={14} className="text-yellow-700" />
              </div>
            }
          >
            <div className="text-left">
              <h4 className="mb-1 text-sm font-bold">Market Edited</h4>
              <p className="mb-3 text-xs text-gray-500">
                Edited in CMS. Original immutable metadata shown below.
              </p>

              {market.originalMetadata?.question && (
                <div className="mb-2">
                  <label className="mb-1 text-xs font-semibold text-gray-700">
                    Original Question:
                  </label>
                  <div className="text-xs text-gray-600">
                    {market.originalMetadata.question}
                  </div>
                </div>
              )}

              {market.originalMetadata?.description && (
                <div className="mb-2">
                  <label className="mb-1 text-xs font-semibold text-gray-700">
                    Original Description:
                  </label>
                  <div className="text-xs">
                    <QuillViewer value={market.originalMetadata.description} />
                  </div>
                </div>
              )}
            </div>
          </InfoPopover>
        </div>
      )}

      {/* Favorite Toggle */}
      <MarketFavoriteToggle size={14} marketId={market.marketId} />

      {promotionData && (
        <MarketPromotionCallout market={market} promotion={promotionData} />
      )}
    </div>
  );
};
