import { Badge } from "@zeitgeistpm/avatara-nft-sdk";
import { useAvatarContext } from "@zeitgeistpm/avatara-react";
import { cidToUrl, sanitizeIpfsUrl } from "@zeitgeistpm/avatara-util";
import { partial } from "lodash";

import { AnimatePresence, motion } from "framer-motion";
import { capitalize } from "lodash";
import { useEffect, useState } from "react";
import { AiFillInfoCircle } from "react-icons/ai";
import Select from "react-select";

export type RaritySelectValue = {
  label: string;
  value: Badge.Rarity;
};

const rarities: RaritySelectValue[] = [
  { value: "common", label: "Common" },
  { value: "rare", label: "Rare" },
  { value: "epic", label: "Epic" },
  { value: "legendary", label: "Legendary" },
  { value: "mythical", label: "Mythical" },
];

export const colorForRarity = (rarity: Badge.Rarity) => {
  return rarity === "common"
    ? "green-500"
    : rarity === "rare"
      ? "blue-500"
      : rarity === "epic"
        ? "purple-500"
        : "orange-1";
};

const BadgesPage = () => {
  const avatarContext = useAvatarContext();

  const [rarity, setRarity] = useState<RaritySelectValue>(rarities[1]);
  const [badgeSpecs, setBadgeSpecs] = useState<Badge.BadgeSpec[]>([]);

  useEffect(() => {
    if (avatarContext) {
      Badge.listBadgeSpecs(avatarContext).then(setBadgeSpecs);
    }
  }, [avatarContext]);

  const onChangeRarity = (rarity: RaritySelectValue) => {
    setRarity(rarity);
  };

  const badges = badgeSpecs
    .map(partial(Badge.discretize, rarity.value))
    .map((badge) => {
      if (badge._tag === "Right") {
        return badge.right;
      }
      return null;
    })
    .filter(Boolean);

  return (
    <div className={"pt-ztg-46 "}>
      <h2 className="mb-6">Badges</h2>
      <div className="mb-ztg-38 flex content-center items-center">
        <p className="flex-3 mr-8 text-gray-600">
          All available badges. Grouped by rarity. Select rarity to view how the
          badge looks at that level
        </p>
        <Select
          options={rarities}
          className="flex-1"
          onChange={onChangeRarity}
          value={rarity}
          styles={{
            control: (provided, state) => {
              return {
                ...provided,
                backgroundColor: `var(--singular)`,
              };
            },
            option: (provided, state) => {
              return {
                ...provided,
              };
            },
            menu: (provided, state) => {
              return {
                ...provided,
                backgroundColor: "white",
              };
            },
          }}
        />
      </div>
      <div className="mb-ztg-38 grid grid-cols-4 grid-rows-4 gap-4">
        {badges.map((item) => {
          if (item) {
            return <BadgeItem item={item} />;
          } else {
            return <></>;
          }
        })}
      </div>
    </div>
  );
};

const BadgeItem = (props: { item: Badge.DiscreteBadge<any> }) => {
  const { item } = props;

  const [hoverInfo, setHoverInfo] = useState(false);

  const mouseEnterInfoIcon = () => {
    setHoverInfo(true);
  };

  const mouseLeaveBadge = () => {
    setHoverInfo(false);
  };

  const rarityBgColor = colorForRarity(item.rarity);

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
                <h4 className="mb-3 text-lg font-bold">
                  {capitalize(item.rarity)} Badge
                </h4>
              </div>
              <div
                className={`mb-4 inline-block rounded-md px-2 py-1 text-sm text-white bg-${rarityBgColor} `}
              >
                {capitalize(item.slot.id)}
              </div>
            </div>
            <p className="mb-4 text-xs">{item.criteria.description}</p>
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
        <img src={sanitizeIpfsUrl(item.preview)} />
        <div className="absolute bottom-2 right-2 h-1/3 w-1/3 rounded-md border-2 border-solid border-gray-900/30">
          <img
            className="z-ztg-2"
            src={sanitizeIpfsUrl(
              cidToUrl("QmZHdCSRpCEfVDcqwkmo5ELrkuKXPBCtfs4fQ3RXibn1am"),
            )}
          />
          <img
            className="absolute left-0 top-0 z-ztg-3 h-full w-full"
            src={sanitizeIpfsUrl(item.src)}
          />
        </div>
      </div>
      <div>
        <h2 className="mb-1 text-xl font-bold">{capitalize(item.levelName)}</h2>
        <p className="text-lg text-sm text-gray-500">
          {capitalize(item.category)}
          {item.criteria.tag &&
            `: ${item.criteria.tag === "any" ? "All" : item.criteria.tag}`}
        </p>
      </div>
    </div>
  );
};

export default BadgesPage;
