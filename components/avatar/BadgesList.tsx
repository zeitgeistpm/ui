import { Badge } from "@zeitgeistpm/avatara-nft-sdk";
import { cidToUrl, sanitizeIpfsUrl } from "@zeitgeistpm/avatara-util";
import EmptyPortfolio from "components/portfolio/EmptyPortfolio";
import { AnimatePresence, motion } from "framer-motion";
import { useBadges } from "lib/hooks/queries/useBadges";
import { capitalize } from "lodash-es";
import { useState } from "react";
import { AiFillInfoCircle } from "react-icons/ai";

const BadgesList = ({ address }: { address: string }) => {
  const { data: badges, isLoading } = useBadges(address);

  return (
    <>
      {isLoading === false && badges?.length === 0 ? (
        <EmptyPortfolio
          headerText="You don't have any badges"
          bodyText="Trade to earn badges"
          buttonText="View Markets"
          buttonLink="/markets"
        />
      ) : (
        <div className="mb-ztg-38 grid grid-cols-2 grid-rows-4 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {badges?.map((item, index) => <BadgeItem key={index} item={item} />)}
        </div>
      )}
    </>
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
      className="relative rounded-md bg-gray-400/10 p-4"
      onMouseLeave={mouseLeaveBadge}
    >
      <div className="bg-blue-500 bg-green-500 bg-orange-1 bg-purple-500 opacity-0" />
      <AnimatePresence>
        {hoverInfo && (
          <motion.div
            key="child"
            initial={{ opacity: 0, transform: "translateY(-115%)" }}
            animate={{ opacity: 1, transform: "translateY(-105%)" }}
            exit={{ opacity: 0, transform: "translateY(-115%)" }}
            style={{ left: "2px" }}
            className="absolute z-ztg-10  w-ztg-240 rounded-ztg-10 border-2 border-gray-500/10 bg-gray-100 px-ztg-12 py-ztg-14 text-sm text-black dark:bg-black  dark:text-white"
          >
            <div className="mb-ztg-2 flex">
              <div className="flex-1">
                <h5 className="mb-3 font-bold">
                  {capitalize(item.metadata_properties?.badge.value.rarity)}{" "}
                  Badge
                </h5>
              </div>
              <div
                className={`mb-4 inline-block rounded-md px-2 py-1 text-sm text-white bg-${rarityBgColor} `}
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
                rel="noreferrer"
              >
                <div
                  className="inline-flex cursor-pointer items-center rounded-md border-2 px-2 py-1"
                  style={{ borderColor: "#EB3089", color: "#EB3089" }}
                >
                  <img src="/icons/singular.svg" className="mr-2 h-6 w-6" />
                  <div>View on Singular 2.0</div>
                </div>
              </a>
            ) : (
              ""
            )}
            <div
              className="absolute bottom-0 left-6 h-0 w-0 border-t-8 dark:border-black"
              style={{
                transform: "translateY(100%)",
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative mb-6 overflow-hidden rounded-md">
        <div className="absolute left-2 top-2">
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
        <div className="absolute bottom-2 right-2 h-1/3 w-1/3 rounded-md border-2 border-solid border-gray-900/30">
          <img
            className="z-ztg-2"
            src={sanitizeIpfsUrl(
              cidToUrl("QmZHdCSRpCEfVDcqwkmo5ELrkuKXPBCtfs4fQ3RXibn1am"),
            )}
          />
          <img
            className="absolute left-0 top-0 z-ztg-3 h-full w-full"
            src={sanitizeIpfsUrl(item.metadata_properties?.badge.value.src)}
          />
        </div>
      </div>
      <div>
        <h2 className="mb-1 text-xl font-bold">
          {item.metadata_properties?.badge.value.levelName ||
            item.metadata_properties?.badge.value.name}
        </h2>
        <p className="text-lg text-sm text-gray-500">
          {capitalize(item.metadata_properties?.badge.value.category)}
        </p>
      </div>
    </div>
  );
};

export default BadgesList;
