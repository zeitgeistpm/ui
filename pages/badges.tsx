import { useAvatarContext } from "@zeitgeistpm/avatara-react";
import { Badge } from "@zeitgeistpm/avatara-nft-sdk";
import { cidToUrl, sanitizeIpfsUrl } from "@zeitgeistpm/avatara-util";
import { partial } from "lodash";
import { useStore } from "lib/stores/Store";
import { useUserStore } from "lib/stores/UserStore";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Select from "react-select";
import { AiFillInfoCircle } from "react-icons/ai";
import { capitalize } from "lodash";
import { motion, AnimatePresence } from "framer-motion";

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

const BadgesPage = observer(() => {
  const router = useRouter();
  const store = useStore();
  const avatarContext = useAvatarContext();

  const { getIdentity, toggleHelpNotification, helpnotifications } =
    useUserStore();

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

  const { theme } = useUserStore();

  return (
    <div className={"pt-ztg-46 "}>
      <h2 className="header mb-ztg-23">Badges</h2>
      <div className="flex content-center items-center mb-ztg-38">
        <p className="text-gray-600 flex-3 mr-8">
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
                ...(theme === "dark"
                  ? {
                      backgroundColor: state.isSelected
                        ? "blue"
                        : state.isFocused
                        ? "rgb(93, 186, 252)"
                        : "transparent",
                    }
                  : {}),
              };
            },
            menu: (provided, state) => {
              return {
                ...provided,
                backgroundColor: theme === "dark" ? "black" : "white",
              };
            },
          }}
        />
      </div>
      <div className="mb-ztg-38 grid gap-4 grid-cols-4 grid-rows-4">
        {badges.map((item) => (
          <BadgeItem item={item} />
        ))}
      </div>
    </div>
  );
});

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
                <h4 className="font-bold text-lg mb-3">
                  {capitalize(item.rarity)} Badge
                </h4>
              </div>
              <div
                className={`rounded-md text-white inline-block text-sm mb-4 py-1 px-2 bg-${rarityBgColor} `}
              >
                {capitalize(item.slot.id)}
              </div>
            </div>
            <p className="mb-4 text-xs">{item.criteria.description}</p>
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
        <img src={sanitizeIpfsUrl(item.preview)} />
        <div className="absolute bottom-2 right-2 rounded-md w-1/3 h-1/3 border-2 border-solid border-gray-900/30">
          <img
            className="z-ztg-2"
            src={sanitizeIpfsUrl(
              cidToUrl("QmZHdCSRpCEfVDcqwkmo5ELrkuKXPBCtfs4fQ3RXibn1am"),
            )}
          />
          <img
            className="absolute top-0 left-0 w-full h-full z-ztg-3"
            src={sanitizeIpfsUrl(item.src)}
          />
        </div>
      </div>
      <div>
        <h2 className="mb-1 text-xl font-bold">{capitalize(item.levelName)}</h2>
        <p className="text-sm text-lg text-gray-500">
          {capitalize(item.category)}
          {item.criteria.tag &&
            `: ${item.criteria.tag === "any" ? "All" : item.criteria.tag}`}
        </p>
      </div>
    </div>
  );
};

export default BadgesPage;
