import {
  useInventoryManagement,
  useAvatarContext,
  ZeitgeistAvatar,
  UseInventoryManagement,
} from "@zeitgeistpm/avatara-react";
import Link from "next/link";
import { formatBalance } from "@polkadot/util";
import { Avatar, Badge, Tarot } from "@zeitgeistpm/avatara-nft-sdk";
import { cidToUrl, sanitizeIpfsUrl } from "@zeitgeistpm/avatara-util";
import Checkbox from "components/ui/Checkbox";
import DiscordIcon from "components/icons/DiscordIcon";
import TwitterIcon from "components/icons/TwitterIcon";
import CopyIcon from "components/ui/CopyIcon";
import { encodeAddress } from "@polkadot/util-crypto";
import { useModalStore } from "lib/stores/ModalStore";
import { useStore } from "lib/stores/Store";
import { UserIdentity, useUserStore } from "lib/stores/UserStore";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { BsGearFill } from "react-icons/bs";
import { AiFillFire } from "react-icons/ai";
import { IoIosNotifications, IoIosWarning } from "react-icons/io";
import { AiFillInfoCircle } from "react-icons/ai";
import Loader from "react-spinners/PulseLoader";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { capitalize } from "lodash";
import { motion, AnimatePresence } from "framer-motion";
import { shortenAddress } from "lib/util";
import { PendingInventoryItem } from "@zeitgeistpm/avatara-nft-sdk/dist/core/inventory";
import { ZTG } from "lib/constants";
import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { delay } from "lib/util/delay";

const AvatarPage = observer(() => {
  const router = useRouter();
  const store = useStore();
  const avatarContext = useAvatarContext();

  const address = router.query.address as string;
  const zeitAddress = encodeAddress(router.query.address as string, 73);

  const { getIdentity, toggleHelpNotification, helpnotifications } =
    useUserStore();

  const modalStore = useModalStore();

  const [loading, setLoading] = useState(true);
  const [mintingAvatar, setMintingAvatar] = useState(false);
  const [identity, setIdentity] = useState<UserIdentity>();
  const [burnAmount, setBurnAmount] = useState<number>();
  const [hasCrossed, setHasCrossed] = useState(false);

  const [earnedBadges, setEarnedBadges] = useState<Badge.IndexedBadge[]>([]);

  const [tarotStats, setTarotStats] =
    useState<Tarot.TarotStatsForAddress>(null);

  const isOwner =
    store.wallets.activeAccount?.address === address ||
    store.wallets.activeAccount?.address === zeitAddress;

  const inventory = useInventoryManagement(
    (isOwner
      ? (store.wallets.getActiveSigner() as ExtSigner) || address
      : address) as any,
  );

  const loadData = async () => {
    try {
      const [burnAmount, identity, tarotStats, earnedBadges] =
        await Promise.all([
          store.sdk.api.query.styx.burnAmount(),
          getIdentity(address),
          Tarot.fetchStatsForAddress(avatarContext, address),
          Avatar.fetchEarnedBadgesForAddress(avatarContext, address),
        ]);
      setEarnedBadges(earnedBadges);
      setBurnAmount(burnAmount.toJSON() as number);
      setIdentity(identity);
      setTarotStats(tarotStats);
      if (store.wallets.activeAccount?.address) {
        const crossing = await store.sdk.api.query.styx.crossings(
          store.wallets.activeAccount.address,
        );
        setHasCrossed(!crossing.isEmpty);
      }
    } catch (error) {
      await delay(1000);
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (avatarContext) {
      loadData();
    }
  }, [avatarContext, address, store.wallets.activeAccount?.address]);

  const name = identity?.displayName || shortenAddress(address);

  const hasInventory = inventory.items.accepted.length > 0;
  const hasPendingItems = inventory.items.pending.length > 0;

  const onClickPendingItemNotification = () => {
    modalStore.openModal(
      <PendingItemsModal address={address} onClose={() => inventory.reset()} />,
      "You have pending items!",
      {
        styles: { width: "580px" },
      },
    );
  };

  const onClickSettingsButton = () => {
    modalStore.openModal(
      <InventoryModal address={address} onClose={() => inventory.reset()} />,
      "Inventory.",
      {
        styles: { width: "580px" },
      },
    );
  };

  const onClickMintAvatar = async () => {
    setMintingAvatar(true);
    modalStore.openModal(
      <ClaimModal
        burnAmount={burnAmount}
        isTarotHolder={tarotStats?.nfts.length > 0}
        address={address}
        onClaimSuccess={() => inventory.reset()}
        onClose={() => {
          setMintingAvatar(false);
        }}
      />,
      "Claim your avatar!",
      {
        styles: { width: "680px" },
      },
    );
  };

  return (
    <div className={"pt-ztg-46 "}>
      <AnimatePresence>
        {helpnotifications?.avatarKsmFeesInfo && (
          <motion.div
            className="mb-12"
            initial={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="rounded-md bg-red-200 flex p-5 items-center">
              <div className="text-red-800 mr-4">
                <IoIosWarning size={32} />
              </div>
              <div className="text-red-800 flex-1">
                All nft-transactions are made on the Kusama chain and will incur
                small fees in KSM.
              </div>
              <div
                onClick={() =>
                  toggleHelpNotification("avatarKsmFeesInfo", false)
                }
                className="border-2 self-end cursor-pointer border-red-800 py-2 px-4 text-red-800 rounded-md"
              >
                Got it!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mb-ztg-40">
        <div className="flex">
          <div className="relative rounded-full mr-ztg-40">
            <div
              style={{ overflow: "hidden" }}
              className={`rounded-full overflow-hidden border-2 border-black ${
                isOwner && hasPendingItems && " border-yellow-500 border-solid"
              }`}
            >
              <ZeitgeistAvatar
                size="196px"
                address={address}
                deps={[mintingAvatar, address]}
                style={{
                  zIndex: 0, // safari fix
                }}
                fallback={
                  isOwner ? (
                    <div className="flex w-full z-ztg-14 h-full items-center justify-center">
                      <button
                        disabled={loading || mintingAvatar}
                        className={`rounded-3xl text-black py-2 px-4 cursor-pointer ${
                          loading || mintingAvatar
                            ? "bg-blue-500"
                            : "bg-blue-700"
                        }  w-42 text-center`}
                        onClick={onClickMintAvatar}
                      >
                        {mintingAvatar ? (
                          <Loader size={8} />
                        ) : (
                          "Mint Avatar NFT"
                        )}
                      </button>
                    </div>
                  ) : undefined
                }
              />
            </div>

            {isOwner && hasInventory && (
              <div
                className="absolute rounded-full cursor-pointer bottom-3 z-ztg-6 right-3 bg-gray-900/70 flex justify-center items-center w-8 h-8"
                onClick={onClickSettingsButton}
              >
                <BsGearFill className="w-5 h-5" color="white" />
              </div>
            )}

            {isOwner && hasPendingItems && (
              <div
                className="absolute bg-yellow-500 bottom-12 -right-1 z-ztg-6 rounded-full cursor-pointer"
                onClick={onClickPendingItemNotification}
              >
                <div className="absolute top-0 left-0 h-full w-full bg-orange-1 rounded-full animate-ping"></div>
                <div className="bg-yellow-500 rounded-full cursor-pointer flex justify-center items-center w-8 h-8 overflow-hidden">
                  <IoIosNotifications className="w-5 h-5" color="white" />
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-ztg-14  text-ztg-[24px]">
              <span className="mr-4">{name}</span>
            </h3>

            <h4 className="flex mb-ztg-20">
              <div className="font-mono text-ztg-16-120 font-semibold mr-4">
                {address}
              </div>
              <CopyIcon copyText={address} className="flex-grow" />
            </h4>

            <div className="flex">
              <div className="flex flex-row py-ztg-15">
                {identity?.twitter?.length > 0 ? (
                  <a
                    className="flex items-center mr-ztg-40"
                    href={`https://twitter.com/${identity.twitter}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <TwitterIcon />
                    <span className="ml-ztg-10 ">{identity.twitter}</span>
                  </a>
                ) : (
                  <></>
                )}
                {identity?.discord?.length > 0 ? (
                  <div className="flex items-center">
                    <DiscordIcon />
                    <span className="ml-ztg-10">{identity.discord}</span>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <h3 className="mb-ztg-40  text-ztg-28-120 font-semibold">
        <span className="mr-4">Achievements</span>
      </h3>
      <p className="text-gray-600 mb-ztg-12">
        All badges earned for this account.{" "}
        <i>
          Includes all badges this user has earned even if the NFT has been
          traded or burnt.
        </i>
      </p>
      <Link href={"/badges"}>
        <div className="text-singular underline text-pink-600 cursor-pointer mb-ztg-38">
          See all available badges.
        </div>
      </Link>
      {earnedBadges.length === 0 ? (
        <>
          <p className="text-gray-600 mb-ztg-38 italic">
            You havent earned any badges yet.
          </p>
        </>
      ) : (
        <div className="mb-ztg-38 grid gap-4 grid-cols-4 grid-rows-4">
          {earnedBadges.map((item) => (
            <BadgeItem item={item} />
          ))}
        </div>
      )}
    </div>
  );
});

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
                <h4 className="font-bold text-lg mb-3">
                  {capitalize(item.metadata_properties?.badge.value.rarity)}{" "}
                  Badge
                </h4>
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

const ClaimModal = (props: {
  address: string;
  burnAmount: number;
  isTarotHolder: boolean;
  onClaimSuccess: () => void;
  onClose?: () => void;
}) => {
  const store = useStore();
  const modalStore = useModalStore();
  const notificationStore = useNotificationStore();
  const avatarSdk = useAvatarContext();

  const [isClaiming, setIsClaiming] = useState(false);
  const [fee, setFee] = useState<number>(null);

  const [hasCrossed, setHasCrossed] = useState(false);

  const balance = store.wallets.activeBalance;
  const hasEnoughBalance = balance.greaterThan((props.burnAmount + fee) / ZTG);

  const tx = useMemo(
    () => store.sdk.api.tx.styx.cross(),
    [props.address, props.burnAmount],
  );

  useEffect(() => {
    store.sdk.api.query.styx
      .crossings(store.wallets.activeAccount.address)
      .then((crossing) => {
        setHasCrossed(!crossing.isEmpty);
      });
  }, [props.address, isClaiming]);

  const doClaim = async () => {
    notificationStore.pushNotification("Minting Avatar.", {
      type: "Info",
      autoRemove: true,
    });
    notificationStore.removeNotification;
    const response = await Avatar.claim(avatarSdk, props.address);
    if (!response?.avatar) {
      throw new Error((response as any).message);
    }
    notificationStore.pushNotification("Avatar successfully minted!", {
      type: "Success",
    });
    props.onClaimSuccess();
    modalStore.closeModal();
  };

  const onClickBurn = async () => {
    setIsClaiming(true);
    try {
      if (hasCrossed) {
        try {
          await doClaim();
        } catch (error) {
          notificationStore.pushNotification(error.message, {
            type: "Error",
          });
        }
        setIsClaiming(false);
      } else {
        const signer = store.wallets.getActiveSigner() as ExtSigner;
        await signAndSend(
          tx,
          signer,
          extrinsicCallback({
            notificationStore,
            broadcastCallback: () => {
              notificationStore.pushNotification("Burning ZTG.", {
                type: "Info",
                autoRemove: true,
              });
            },
            successCallback: async () => {
              try {
                await delay(2000);
                await doClaim();
                setIsClaiming(false);
                props.onClose?.();
              } catch (error) {
                notificationStore.pushNotification(error.message, {
                  type: "Error",
                });
              }
            },
            retractedCallback: async () => {
              setIsClaiming(false);
            },
            failCallback: ({ index, error }) => {
              setIsClaiming(false);
              notificationStore.pushNotification(
                store.getTransactionError(index, error),
                { type: "Error" },
              );
            },
          }),
        );
      }
    } catch (error) {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    return () => {
      props.onClose?.();
    };
  }, [props.onClose]);

  return (
    <div className="flex">
      <div className="pr-4">
        <img
          className="rounded-md"
          src="/avatar_preview.jpeg"
          alt="Account balance"
        />
      </div>
      <div className="flex">
        <div className="pr-6 mb-8">
          <p className="mb-4">
            {props.isTarotHolder
              ? "Claim your avatar to be able to earn badges on the zeitgeist platform. It will be minted to the address you are logged in with."
              : `To claim your right to mint an avatar you have to pay the ferryman
              due respect, burning ${props.burnAmount / ZTG} ZTG.`}
          </p>
          {!hasCrossed ? (
            <div className="flex items-center">
              <div className="text-red-800 text-xs flex-1">
                The amount will be burned(slashed) and not paid to any address.
                Make sure you have {props.burnAmount / ZTG} + (fee {fee / ZTG})
                ZTG in your wallet.
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="text-green-500 mr-4">
                <AiFillFire size="22" />
              </div>
              <div className="text-green-500 text-xs flex-1">
                {props.isTarotHolder
                  ? "Holding tarot cards gives free claim."
                  : "You have already burned so feel free to claim your avatar."}
              </div>
            </div>
          )}
        </div>
        <div className="flex w-100 items-center justify-center h-full">
          <div>
            <div className="flex justify-center">
              <button
                disabled={isClaiming || !hasEnoughBalance}
                className={`rounded-3xl text-black py-3 px-5 mb-2 text-white ${
                  isClaiming || !hasEnoughBalance
                    ? "bg-blue-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-700 cursor-pointer"
                }  w-42 text-center`}
                onClick={onClickBurn}
              >
                {isClaiming ? (
                  <Loader size={8} />
                ) : (
                  <div className="flex items-center">
                    <span className="text-md">
                      {hasCrossed
                        ? "Claim"
                        : `Burn ${props.burnAmount / ZTG} ZTG`}
                    </span>
                    <div className="ml-2">
                      <AiFillFire />
                    </div>
                  </div>
                )}
              </button>
            </div>
            {!props.isTarotHolder && (
              <div className="text-center text-xs">
                <div className=" h-ztg-18 px-ztg-8 text-ztg-12-150 font-bold text-sky-600">
                  <div className="flex px-ztg-8 justify-between">
                    <span>Exchange Fee: </span>
                    <span className="font-mono">{(fee / ZTG).toFixed(4)}</span>
                  </div>
                  {!hasEnoughBalance && (
                    <div className="mt-2">
                      <span className="text-red-600">Missing balance.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryModal = (props: { address: string; onClose?: () => void }) => {
  const store = useStore();
  const inventory = useInventoryManagement(
    ((store.wallets.getActiveSigner() as ExtSigner) || props.address) as any,
  );
  const modalStore = useModalStore();

  const avatarSdk = useAvatarContext();

  useEffect(() => {
    return () => {
      props.onClose?.();
    };
  }, [props.onClose]);

  return (
    <div>
      <div className="flex items-center justify-center">
        <div className="rounded-md overflow-hidden">
          <ZeitgeistAvatar
            size={"288px"}
            address={props.address}
            layoutPreview={inventory.layout}
          />
        </div>
      </div>

      <div className="mb-8 overflow-scroll" style={{ maxHeight: "400px" }}>
        {inventory.loading && (
          <div className="mt-24 mb-4 flex items-center justify-center">
            <Loader color="rgba(210,210,210, 0.3)" size={12} />
          </div>
        )}

        {inventory.items.accepted.map((item) => (
          <div className="flex mt-12">
            <img
              className="h-16 w-16 rounded-md mr-4"
              src={sanitizeIpfsUrl(
                item.metadata_properties.badge.value.preview,
              )}
            />
            <div className="w-full">
              <h4 className="mb-ztg-8  text-ztg-16-150 font-semibold">
                {item.metadata_properties.badge.value.name}
              </h4>
              <p className="text-ztg-14-110 mb-4">
                {item.metadata_properties.badge.value.description}
              </p>
            </div>
            <div>
              <label className="block mb-2">Equipped</label>
              <div className="flex items-center justify-center">
                <div className="inline-block bg-gray-900/20 rounded-md">
                  <Checkbox
                    disabled={inventory.comitting}
                    value={inventory.hasSelected(item)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        inventory.select(item);
                      } else {
                        inventory.unselect(item);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center">
        <div className="flex-1 text-right mr-6">
          <i className="mr-2">Fees: </i>
          <span>
            {inventory.commitFees && inventory.hasChange
              ? formatBalance(inventory.commitFees, {
                  withSi: true,
                  withUnit: false,
                  decimals: avatarSdk.chainProperties.tokenDecimals,
                  forceUnit: "-",
                })
              : "0"}{" "}
          </span>
          <b className="text-gray-500 ml-1">
            {avatarSdk.chainProperties.tokenSymbol}
          </b>
        </div>
        <button
          disabled={inventory.comitting || !inventory.hasChange}
          onClick={async () => {
            await inventory.commit();
            modalStore.closeModal();
          }}
          className={`rounded-3xl text-center float-right text-sm w-44 inline-block ${
            inventory.comitting || !inventory.hasChange
              ? "bg-yellow-200 text-gray-400 cursor-default"
              : "bg-yellow-500 cursor-pointer"
          }  text-black px-2 py-2`}
        >
          {inventory.comitting ? <Loader size={8} /> : "Commit changes"}
        </button>
      </div>
    </div>
  );
};

const PendingItemsModal = (props: {
  address: string;
  onClose?: () => void;
}) => {
  const store = useStore();
  const inventory = useInventoryManagement(
    ((store.wallets.getActiveSigner() as ExtSigner) || props.address) as any,
  );
  const modalStore = useModalStore();

  const isAcceptingAll = inventory.items.pending.every((item) =>
    inventory.isAccepting(item),
  );

  useEffect(() => {
    if (!inventory.loading && inventory.items.pending.length === 0) {
      modalStore.closeModal();
    }
  }, [inventory.items.pending]);

  useEffect(() => {
    return () => {
      props.onClose?.();
    };
  }, [props.onClose]);

  return (
    <div>
      <div className="mb-ztg-24 max-h-[520px] overflow-scroll">
        {inventory.loading ? (
          <div className="my-20 flex items-center justify-center">
            <Loader color="rgba(210,210,210, 0.3)" size={12} />
          </div>
        ) : (
          inventory.items.pending.map((item) => (
            <div className="flex mt-12">
              <img
                className="h-24 w-24 rounded-md mr-4"
                src={sanitizeIpfsUrl(
                  item.metadata_properties.badge.value.preview,
                )}
              />
              <div className="w-full">
                <h4 className="mb-ztg-12  text-ztg-18-150 font-semibold">
                  {item.metadata_properties.badge.value.name}
                </h4>
                <p className="text-ztg-14-110 mb-4">
                  {item.metadata_properties.badge.value.description}
                </p>
                <div className="float-right">
                  <span className="mr-4">
                    <i className="mr-2">Fees: </i>
                    <AcceptFees inventory={inventory} item={item} />
                  </span>
                  <button
                    disabled={inventory.isAccepting(item)}
                    onClick={() => inventory.accept(item)}
                    className={`rounded-3xl cursor-pointer text-center text-sm w-20 inline-block ${
                      inventory.isAccepting(item)
                        ? "bg-yellow-200"
                        : "bg-yellow-500"
                    }  text-black px-2 py-2`}
                  >
                    {inventory.isAccepting(item) ? (
                      <Loader size={8} />
                    ) : (
                      "Accept"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {inventory.items.pending.length > 1 && (
        <div>
          <button
            disabled={isAcceptingAll}
            onClick={() => inventory.acceptAllPending()}
            className={`rounded-3xl float-right cursor-pointer text-center text-sm inline-block ${
              isAcceptingAll ? "bg-yellow-200" : "bg-yellow-500"
            }  text-black px-2 py-2`}
          >
            {isAcceptingAll ? <Loader size={8} /> : "Accept All Pending Items"}
          </button>
        </div>
      )}
    </div>
  );
};

export const AcceptFees = (props: {
  inventory: UseInventoryManagement;
  item: PendingInventoryItem;
}) => {
  const [fees, setFees] = useState(null);

  const avatarSdk = useAvatarContext();

  useEffect(() => {
    props.inventory.acceptFees(props.item).then(setFees);
  }, [props.item]);

  return (
    <>
      {fees && avatarSdk && (
        <>
          <span>
            {formatBalance(fees, {
              withSi: true,
              withUnit: false,
              decimals: avatarSdk.chainProperties.tokenDecimals,
              forceUnit: "-",
            })}
          </span>
          <b className="text-gray-500 ml-1">
            {avatarSdk.chainProperties.tokenSymbol}
          </b>
        </>
      )}
    </>
  );
};

export default AvatarPage;
