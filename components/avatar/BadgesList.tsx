import { Badge } from "@zeitgeistpm/avatara-nft-sdk";
import { cidToUrl, sanitizeIpfsUrl } from "@zeitgeistpm/avatara-util";
import { AnimatePresence, motion } from "framer-motion";
import { useBadges } from "lib/hooks/queries/useBadges";
import { capitalize } from "lodash-es";
import { useState } from "react";
import { AiFillInfoCircle } from "react-icons/ai";

const BadgesList = ({ address }: { address: string }) => {
  const { data: badges } = useBadges(address);
  return (
    <div className="mb-ztg-38 grid gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 grid-rows-4">
      {badges?.map((item) => (
        <BadgeItem item={item} />
      ))}
    </div>
  );
};

const BadgeItem = (props: { item: Badge.IndexedBadge }) => {
  const { item } = props;

  const [hoverInfo, setHoverInfo] = useState(false);

  const mouseEnterInfoIcon = () => {
    setHoverInfo(true);
  };

  const mouseLeaveBadge = () => {
    setHoverInfo(false);
  };

  const rarity = item.metadata_properties?.badge.value.rarity;
  const rarityBgColor =
    rarity === "common"
      ? "green-500"
      : rarity === "rare"
      ? "blue-500"
      : rarity === "epic"
      ? "purple-500"
      : "orange-1";

  return (
    <div
      className="relative p-4 bg-gray-400/10 rounded-md"
      onMouseLeave={mouseLeaveBadge}
    >
      <div className="opacity-0 bg-green-500 bg-blue-500 bg-purple-500 bg-orange-1" />
      <AnimatePresence>
        {hoverInfo && (
          <motion.div
            key="child"
            initial={{ opacity: 0, transform: "translateY(-115%)" }}
            animate={{ opacity: 1, transform: "translateY(-105%)" }}
            exit={{ opacity: 0, transform: "translateY(-115%)" }}
            style={{ left: "2px" }}
            className="border-2 border-gray-500/10  absolute text-sm z-ztg-10 bg-gray-100 dark:bg-black rounded-ztg-10 text-black dark:text-white px-ztg-12 py-ztg-14  w-ztg-240"
          >
            <div className="flex mb-ztg-2">
              <div className="flex-1">
                <h5 className="font-bold mb-3">
                  {capitalize(item.metadata_properties?.badge.value.rarity)}{" "}
                  Badge
                </h5>
              </div>
              <div
                className={`rounded-md text-white inline-block text-sm mb-4 py-1 px-2 bg-${rarityBgColor} `}
              >
                {capitalize(item.metadata_properties?.badge.value.slot.id)}
              </div>
            </div>
            <p className="mb-4 text-xs">
              {item.metadata_properties?.badge.value.criteria.description}
            </p>
            {item.burned === "" ? (
              <a
                href={`${process.env.NEXT_PUBLIC_SINGULAR_URL}/collectibles/${item.id}`}
                target="_blank"
              >
                <div
                  className="inline-flex items-center py-1 px-2 rounded-md border-2 cursor-pointer"
                  style={{ borderColor: "#EB3089", color: "#EB3089" }}
                >
                  <img src="/icons/singular.svg" className="h-6 w-6 mr-2" />
                  <div>View on Singular 2.0</div>
                </div>
              </a>
            ) : (
              ""
            )}
            <div
              className="absolute bottom-0 left-6 w-0 h-0 border-t-8 dark:border-black"
              style={{
                transform: "translateY(100%)",
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative overflow-hidden rounded-md mb-6">
        <div className="absolute top-2 left-2">
          <AiFillInfoCircle
            onMouseEnter={mouseEnterInfoIcon}
            className="cursor-pointer"
            size={32}
            color={"rgb(20,20,20, 0.8)"}
          />
        </div>
        <img
          src={sanitizeIpfsUrl(item.metadata_properties?.badge.value.preview)}
        />
        <div className="absolute bottom-2 right-2 rounded-md w-1/3 h-1/3 border-2 border-solid border-gray-900/30">
          <img
            className="z-ztg-2"
            src={sanitizeIpfsUrl(
              cidToUrl("QmZHdCSRpCEfVDcqwkmo5ELrkuKXPBCtfs4fQ3RXibn1am"),
            )}
          />
          <img
            className="absolute top-0 left-0 w-full h-full z-ztg-3"
            src={sanitizeIpfsUrl(item.metadata_properties?.badge.value.src)}
          />
        </div>
      </div>
      <div>
        <h2 className="mb-1 text-xl font-bold">
          {item.metadata_properties?.badge.value.levelName ||
            item.metadata_properties?.badge.value.name}
        </h2>
        <p className="text-sm text-lg text-gray-500">
          {capitalize(item.metadata_properties?.badge.value.category)}
        </p>
      </div>
    </div>
  );
};

export default BadgesList;
