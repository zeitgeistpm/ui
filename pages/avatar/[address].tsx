// import { Dialog } from "@headlessui/react";
// import { formatBalance } from "@polkadot/util";
// import { encodeAddress } from "@polkadot/util-crypto";
// import { Avatar, Badge, Tarot } from "@zeitgeistpm/avatara-nft-sdk";
// import { PendingInventoryItem } from "@zeitgeistpm/avatara-nft-sdk/dist/core/inventory";
// import {
//   useAvatarContext,
//   useInventoryManagement,
//   UseInventoryManagement,
//   ZeitgeistAvatar,
// } from "@zeitgeistpm/avatara-react";
// import { sanitizeIpfsUrl } from "@zeitgeistpm/avatara-util";
// import { isRpcSdk } from "@zeitgeistpm/sdk";
// import { tryCatch } from "@zeitgeistpm/utility/dist/either";
// import { fromNullable } from "@zeitgeistpm/utility/dist/option";
// import DiscordIcon from "components/icons/DiscordIcon";
// import TwitterIcon from "components/icons/TwitterIcon";
// import CopyIcon from "components/ui/CopyIcon";
// import Skeleton from "components/ui/Skeleton";
// import Modal from "components/ui/Modal";
// import { AnimatePresence, motion } from "framer-motion";
// import { ZTG } from "lib/constants";
// import { useIdentity } from "lib/hooks/queries/useIdentity";
// import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
// import { useLocalStorage } from "lib/hooks/useLocalStorage";
// import { useSdkv2 } from "lib/hooks/useSdkv2";
// import { useNotifications } from "lib/state/notifications";
// import { useWallet } from "lib/state/wallet";
// import { shortenAddress } from "lib/util";
// import { delay } from "lib/util/delay";
// import { extrinsicCallback, signAndSend } from "lib/util/tx";
// import Link from "next/link";
// import { useRouter } from "next/router";
// import NotFoundPage from "pages/404";
// import { useEffect, useMemo, useState } from "react";
// import { AiFillFire } from "react-icons/ai";
// import { BsGearFill } from "react-icons/bs";
// import { IoIosNotifications, IoIosWarning } from "react-icons/io";
// import Loader from "react-spinners/PulseLoader";
// import BadgesList from "components/avatar/BadgesList";

// const AvatarPage = () => {
//   const router = useRouter();

//   const zeitAddress = fromNullable(router.query.address as string).map(
//     (address) => {
//       return tryCatch(() => encodeAddress(address, 73));
//     },
//   );

//   if (zeitAddress.isNone()) return <Skeleton height={524} />;

//   if (zeitAddress.unwrap().isLeft()) return <NotFoundPage />;

//   return (
//     <Inner
//       ztgEncodedAddress={zeitAddress.unwrap().unwrap()}
//       address={router.query.address as string}
//     />
//   );
// };

// const Inner = ({
//   ztgEncodedAddress,
//   address,
// }: {
//   ztgEncodedAddress: string;
//   address: string;
// }) => {
//   const [sdk] = useSdkv2();
//   const avatarContext = useAvatarContext();
//   const wallet = useWallet();

//   const [loading, setLoading] = useState(true);
//   const [mintingAvatar, setMintingAvatar] = useState(false);
//   const [burnAmount, setBurnAmount] = useState<number>();

//   const [earnedBadges, setEarnedBadges] = useState<Badge.IndexedBadge[]>([]);

//   const [showKsmInfo, setShowKsmInfo] = useLocalStorage(
//     "avatar-page:show-ksm-info",
//     true,
//   );

//   const [tarotStats, setTarotStats] =
//     useState<Tarot.TarotStatsForAddress>(null);
//   const { data: identity } = useIdentity(address);

//   const isOwner =
//     wallet.activeAccount?.address === address ||
//     wallet.activeAccount?.address === ztgEncodedAddress;

//   const inventory = useInventoryManagement(
//     (isOwner ? (wallet.activeAccount as ExtSigner) || address : address) as any,
//   );

//   const loadData = async () => {
//     if (isRpcSdk(sdk)) {
//       try {
//         const [burnAmount, tarotStats, earnedBadges] = await Promise.all([
//           sdk.api.query.styx.burnAmount(),
//           Tarot.fetchStatsForAddress(avatarContext, address),
//           Avatar.fetchEarnedBadgesForAddress(avatarContext, address),
//         ]);
//         setEarnedBadges(earnedBadges);
//         setBurnAmount(burnAmount.toJSON() as number);
//         setTarotStats(tarotStats);
//       } catch (error) {
//         await delay(1000);
//         await loadData();
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   useEffect(() => {
//     if (avatarContext) {
//       loadData();
//     }
//   }, [avatarContext, address, wallet.activeAccount?.address]);

//   const name = identity?.displayName || shortenAddress(address);

//   const hasPendingItems = inventory.items.pending.length > 0;

//   const [pendingItemsOpen, setPendingItemsOpen] = useState(false);
//   const [inventoryOpen, setInventoryOpen] = useState(false);
//   const [claimOpen, setClaimOpen] = useState(false);

//   const onClickPendingItemNotification = () => {
//     setPendingItemsOpen(true);
//   };

//   const onClickSettingsButton = () => {
//     setInventoryOpen(true);
//   };

//   const onClickMintAvatar = async () => {
//     setClaimOpen(true);
//     setMintingAvatar(true);
//   };

//   return (
//     <>
//       <Modal
//         open={pendingItemsOpen}
//         onClose={() => {
//           setPendingItemsOpen(false);
//           inventory.reset();
//         }}
//       >
//         <Dialog.Panel className="bg-white w-[624px] rounded-ztg-10 p-[15px]">
//           <div>
//             <div className="font-bold text-ztg-16-150 text-black">
//               <div className="ml-[15px] mt-[15px]">You have pending items!</div>
//             </div>
//             <PendingItemsModal address={address} />
//           </div>
//         </Dialog.Panel>
//       </Modal>

//       <Modal
//         open={inventoryOpen}
//         onClose={() => {
//           setInventoryOpen(false);
//           inventory.reset();
//         }}
//       >
//         <Dialog.Panel className="bg-white w-[624px] rounded-ztg-10 p-[15px]">
//           <div>
//             <div className="font-bold text-ztg-16-150 text-black">
//               <div className="ml-[15px] mt-[15px]">Inventory</div>
//             </div>
//             <InventoryModal address={address} />
//           </div>
//         </Dialog.Panel>
//       </Modal>

//       <Modal open={claimOpen} onClose={() => setClaimOpen(false)}>
//         <Dialog.Panel className="bg-white w-[680px] rounded-ztg-10 p-[15px]">
//           <div>
//             <div className="font-bold text-ztg-16-150 text-black">
//               <div className="ml-[15px] mt-[15px]">Claim your avatar!</div>
//             </div>
//             <ClaimModal
//               burnAmount={burnAmount}
//               isTarotHolder={tarotStats?.nfts.length > 0}
//               address={address}
//               onClaimSuccess={() => inventory.reset()}
//               onClose={() => {
//                 setClaimOpen(false);
//                 setMintingAvatar(false);
//               }}
//             />
//           </div>
//         </Dialog.Panel>
//       </Modal>

//       <div className={"pt-ztg-46 "}>
//         <AnimatePresence>
//           {showKsmInfo && (
//             <motion.div
//               className="mb-12"
//               initial={{ opacity: 0 }}
//               exit={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//             >
//               <div className="rounded-md bg-red-200 flex p-5 items-center">
//                 <div className="text-red-800 mr-4">
//                   <IoIosWarning size={32} />
//                 </div>
//                 <div className="text-red-800 flex-1">
//                   All nft-transactions are made on the Kusama chain and will
//                   incur small fees in KSM.
//                 </div>
//                 <div
//                   onClick={() => setShowKsmInfo(false)}
//                   className="border-2 self-end cursor-pointer border-r-2ed-800 py-2 px-4 text-red-800 rounded-md"
//                 >
//                   Got it!
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//         <div className="mb-ztg-40">
//           <div className="flex flex-col sm:flex-row gap-6">
//             <div className="relative rounded-full mr-ztg-40">
//               <div
//                 style={{ overflow: "hidden" }}
//                 className={`w-fit rounded-full overflow-hidden border-2 border-b-2lack ${
//                   isOwner &&
//                   hasPendingItems &&
//                   " border-y-2ellow-500 border-solid"
//                 }`}
//               >
//                 <ZeitgeistAvatar
//                   size="196px"
//                   address={address}
//                   deps={[mintingAvatar, address]}
//                   style={{
//                     zIndex: 0, // safari fix
//                   }}
//                   fallback={
//                     isOwner ? (
//                       <div className="flex w-full z-ztg-14 h-full items-center justify-center">
//                         <button
//                           disabled={loading || mintingAvatar}
//                           className={`rounded-3xl text-black py-2 px-4 cursor-pointer ${
//                             loading || mintingAvatar
//                               ? "bg-blue-500"
//                               : "bg-blue-700"
//                           }  w-42 text-center`}
//                           onClick={onClickMintAvatar}
//                         >
//                           {mintingAvatar ? (
//                             <Loader size={8} />
//                           ) : (
//                             "Mint Avatar NFT"
//                           )}
//                         </button>
//                       </div>
//                     ) : undefined
//                   }
//                 />
//               </div>

//               {isOwner && true && (
//                 <div
//                   className="absolute rounded-full cursor-pointer bottom-3 z-ztg-6 right-3 bg-gray-900/70 flex justify-center items-center w-8 h-8"
//                   onClick={onClickSettingsButton}
//                 >
//                   <BsGearFill className="w-5 h-5" color="white" />
//                 </div>
//               )}

//               {isOwner && hasPendingItems && (
//                 <div
//                   className="absolute bg-yellow-500 bottom-12 -right-1 z-ztg-6 rounded-full cursor-pointer"
//                   onClick={onClickPendingItemNotification}
//                 >
//                   <div className="absolute top-0 left-0 h-full w-full bg-orange-1 rounded-full animate-ping"></div>
//                   <div className="bg-yellow-500 rounded-full cursor-pointer flex justify-center items-center w-8 h-8 overflow-hidden">
//                     <IoIosNotifications className="w-5 h-5" color="white" />
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div>
//               <h3 className="mb-3.5 mr-1">{name}</h3>
//               <h5 className="flex break-all mb-5 gap-2">
//                 {address}
//                 <CopyIcon copyText={address} />
//               </h5>

//               <div className="flex">
//                 <div className="flex flex-row py-ztg-15">
//                   {identity?.twitter?.length > 0 ? (
//                     <a
//                       className="flex items-center mr-ztg-40"
//                       href={`https://twitter.com/${identity.twitter}`}
//                       target="_blank"
//                       rel="noreferrer"
//                     >
//                       <TwitterIcon />
//                       <span className="ml-ztg-10 ">{identity.twitter}</span>
//                     </a>
//                   ) : (
//                     <></>
//                   )}
//                   {identity?.discord?.length > 0 ? (
//                     <div className="flex items-center">
//                       <DiscordIcon />
//                       <span className="ml-ztg-10">{identity.discord}</span>
//                     </div>
//                   ) : (
//                     <></>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//         <h2 className="mb-10 mr-1">Achievements</h2>
//         <p className="text-gray-600 mb-ztg-12">
//           All badges earned for this account.{" "}
//           <i>
//             Includes all badges this user has earned even if the NFT has been
//             traded or burnt.
//           </i>
//         </p>
//         <Link href={"/badges"}>
//           <div className="text-singular underline text-pink-600 cursor-pointer mb-ztg-38">
//             See all available badges.
//           </div>
//         </Link>

//         <BadgesList address={address} />
//       </div>
//     </>
//   );
// };

// const ClaimModal = (props: {
//   address: string;
//   burnAmount: number;
//   isTarotHolder: boolean;
//   onClaimSuccess: () => void;
//   onClose?: () => void;
// }) => {
//   const notificationStore = useNotifications();
//   const avatarSdk = useAvatarContext();
//   const wallet = useWallet();
//   const [sdk] = useSdkv2();

//   const [isClaiming, setIsClaiming] = useState(false);
//   const [fee, setFee] = useState<number>(null);

//   const [hasCrossed, setHasCrossed] = useState(false);

//   const { data: activeBalance } = useZtgBalance(wallet.activeAccount?.address);

//   const balance = activeBalance;
//   const hasEnoughBalance = balance?.greaterThan((props.burnAmount + fee) / ZTG);

//   const tx = useMemo(() => {
//     if (isRpcSdk(sdk)) {
//       return sdk.api.tx.styx.cross();
//     }
//   }, [props.address, props.burnAmount]);

//   useEffect(() => {
//     if (isRpcSdk(sdk)) {
//       sdk.api.query.styx
//         .crossings(wallet.activeAccount?.address)
//         .then((crossing) => {
//           setHasCrossed(!crossing.isEmpty);
//         });
//     }
//   }, [sdk, props.address, isClaiming]);

//   const doClaim = async () => {
//     notificationStore.pushNotification("Minting Avatar.", {
//       type: "Info",
//       autoRemove: true,
//     });
//     notificationStore.removeNotification;
//     const response = await Avatar.claim(avatarSdk, props.address);
//     if (!response?.avatar) {
//       throw new Error((response as any).message);
//     }
//     notificationStore.pushNotification("Avatar successfully minted!", {
//       type: "Success",
//     });
//     props.onClaimSuccess();
//   };

//   const onClickBurn = async () => {
//     if (!isRpcSdk(sdk)) {
//       return;
//     }

//     setIsClaiming(true);

//     try {
//       if (hasCrossed) {
//         try {
//           await doClaim();
//         } catch (error) {
//           notificationStore.pushNotification(error.message, {
//             type: "Error",
//           });
//         }
//         setIsClaiming(false);
//       } else {
//         const signer = wallet.activeAccount as ExtSigner;
//         await signAndSend(
//           tx,
//           signer,
//           extrinsicCallback({
//             api: sdk.api,
//             notifications: notificationStore,
//             broadcastCallback: () => {
//               notificationStore.pushNotification("Burning ZTG.", {
//                 type: "Info",
//                 autoRemove: true,
//               });
//             },
//             successCallback: async () => {
//               try {
//                 await delay(2000);
//                 await doClaim();
//                 setIsClaiming(false);
//                 props.onClose?.();
//               } catch (error) {
//                 notificationStore.pushNotification(error.message, {
//                   type: "Error",
//                 });
//               }
//             },
//             retractedCallback: async () => {
//               setIsClaiming(false);
//             },
//             failCallback: (error) => {
//               setIsClaiming(false);
//               notificationStore.pushNotification(error, { type: "Error" });
//             },
//           }),
//         );
//       }
//     } catch (error) {
//       setIsClaiming(false);
//     }
//   };

//   useEffect(() => {
//     return () => {
//       props.onClose?.();
//     };
//   }, [props.onClose]);

//   return (
//     <div className="flex">
//       <div className="pr-4">
//         <img
//           className="rounded-md"
//           src="/avatar_preview.jpeg"
//           alt="Account balance"
//         />
//       </div>
//       <div className="flex">
//         <div className="pr-6 mb-8">
//           <p className="mb-4">
//             {props.isTarotHolder
//               ? "Claim your avatar to be able to earn badges on the zeitgeist platform. It will be minted to the address you are logged in with."
//               : `To claim your right to mint an avatar you have to pay the ferryman
//               due respect, burning ${props.burnAmount / ZTG} ZTG.`}
//           </p>
//           {!hasCrossed ? (
//             <div className="flex items-center">
//               <div className="text-red-800 text-xs flex-1">
//                 The amount will be burned(slashed) and not paid to any address.
//                 Make sure you have {props.burnAmount / ZTG} + (fee {fee / ZTG})
//                 ZTG in your wallet.
//               </div>
//             </div>
//           ) : (
//             <div className="flex items-center">
//               <div className="text-green-500 mr-4">
//                 <AiFillFire size="22" />
//               </div>
//               <div className="text-green-500 text-xs flex-1">
//                 {props.isTarotHolder
//                   ? "Holding tarot cards gives free claim."
//                   : "You have already burned so feel free to claim your avatar."}
//               </div>
//             </div>
//           )}
//         </div>
//         <div className="flex w-100 items-center justify-center h-full">
//           <div>
//             <div className="flex justify-center">
//               <button
//                 disabled={isClaiming || !hasEnoughBalance}
//                 className={`rounded-3xl text-black py-3 px-5 mb-2 text-white/90 ${
//                   isClaiming || !hasEnoughBalance
//                     ? "bg-blue-300 text-gray-600 cursor-not-allowed"
//                     : "bg-blue-700 cursor-pointer"
//                 }  w-42 text-center`}
//                 onClick={onClickBurn}
//               >
//                 {isClaiming ? (
//                   <Loader size={8} />
//                 ) : (
//                   <div className="flex items-center">
//                     <span className="text-md">
//                       {hasCrossed
//                         ? "Claim"
//                         : `Burn ${props.burnAmount / ZTG} ZTG`}
//                     </span>
//                     <div className="ml-2">
//                       <AiFillFire />
//                     </div>
//                   </div>
//                 )}
//               </button>
//             </div>
//             {!props.isTarotHolder && (
//               <div className="text-center text-xs">
//                 <div className=" h-ztg-18 px-ztg-8 text-ztg-12-150 font-bold text-ztg-primary-600">
//                   <div className="flex px-ztg-8 justify-between">
//                     <span>Exchange Fee: </span>
//                     <span className="font-mono">{(fee / ZTG).toFixed(4)}</span>
//                   </div>
//                   {!hasEnoughBalance && (
//                     <div className="mt-2">
//                       <span className="text-red-600">Missing balance.</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const InventoryModal = (props: { address: string; onClose?: () => void }) => {
//   const wallet = useWallet();
//   const inventory = useInventoryManagement(
//     ((wallet.activeAccount as ExtSigner) || props.address) as any,
//   );

//   const avatarSdk = useAvatarContext();

//   return (
//     <div>
//       <div className="flex items-center justify-center">
//         <div className="rounded-md overflow-hidden">
//           <ZeitgeistAvatar
//             size={"288px"}
//             address={props.address}
//             layoutPreview={inventory.layout}
//           />
//         </div>
//       </div>

//       <div className="mb-8 overflow-scroll" style={{ maxHeight: "400px" }}>
//         {inventory.loading && (
//           <div className="mt-24 mb-4 flex items-center justify-center">
//             <Loader color="rgba(210,210,210, 0.3)" size={12} />
//           </div>
//         )}

//         {inventory.items.accepted.map((item) => (
//           <div className="flex mt-12">
//             <img
//               className="h-16 w-16 rounded-md mr-4"
//               src={sanitizeIpfsUrl(
//                 item.metadata_properties.badge.value.preview,
//               )}
//             />
//             <div className="w-full">
//               <h4 className="mb-ztg-8  text-ztg-16-150 font-semibold">
//                 {item.metadata_properties.badge.value.name}
//               </h4>
//               <p className="text-ztg-14-110 mb-4">
//                 {item.metadata_properties.badge.value.description}
//               </p>
//             </div>
//             <div>
//               <label className="block mb-2">Equipped</label>
//               <div className="flex items-center justify-center">
//                 <div className="inline-block bg-gray-900/20 rounded-md">
//                   <input
//                     type="checkbox"
//                     disabled={inventory.comitting}
//                     checked={inventory.hasSelected(item)}
//                     onChange={(event) => {
//                       if (event.target.checked) {
//                         inventory.select(item);
//                       } else {
//                         inventory.unselect(item);
//                       }
//                     }}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="flex items-center">
//         <div className="flex-1 text-right mr-6">
//           <i className="mr-2">Fees: </i>
//           <span>
//             {inventory.commitFees && inventory.hasChange
//               ? formatBalance(inventory.commitFees, {
//                   withSi: true,
//                   withUnit: false,
//                   decimals: avatarSdk.chainProperties.tokenDecimals,
//                   forceUnit: "-",
//                 })
//               : "0"}{" "}
//           </span>
//           <b className="text-gray-500 ml-1">
//             {avatarSdk.chainProperties.tokenSymbol}
//           </b>
//         </div>
//         <button
//           disabled={inventory.comitting || !inventory.hasChange}
//           onClick={async () => {
//             await inventory.commit();
//           }}
//           className={`rounded-3xl text-center float-right text-sm w-44 inline-block ${
//             inventory.comitting || !inventory.hasChange
//               ? "bg-yellow-200 text-gray-400 cursor-default"
//               : "bg-yellow-500 cursor-pointer"
//           }  text-black px-2 py-2`}
//         >
//           {inventory.comitting ? <Loader size={8} /> : "Commit changes"}
//         </button>
//       </div>
//     </div>
//   );
// };

// const PendingItemsModal = (props: { address: string }) => {
//   const wallet = useWallet();
//   const inventory = useInventoryManagement(
//     ((wallet.activeAccount as ExtSigner) || props.address) as any,
//   );

//   const isAcceptingAll = inventory.items.pending.every((item) =>
//     inventory.isAccepting(item),
//   );

//   return (
//     <div>
//       <div className="mb-ztg-24 max-h-[520px] overflow-scroll">
//         {inventory.loading ? (
//           <div className="my-20 flex items-center justify-center">
//             <Loader color="rgba(210,210,210, 0.3)" size={12} />
//           </div>
//         ) : (
//           inventory.items.pending.map((item) => (
//             <div className="flex mt-12">
//               <img
//                 className="h-24 w-24 rounded-md mr-4"
//                 src={sanitizeIpfsUrl(
//                   item.metadata_properties.badge.value.preview,
//                 )}
//               />
//               <div className="w-full">
//                 <h4 className="mb-ztg-12  text-ztg-18-150 font-semibold">
//                   {item.metadata_properties.badge.value.name}
//                 </h4>
//                 <p className="text-ztg-14-110 mb-4">
//                   {item.metadata_properties.badge.value.description}
//                 </p>
//                 <div className="float-right">
//                   <span className="mr-4">
//                     <i className="mr-2">Fees: </i>
//                     <AcceptFees inventory={inventory} item={item} />
//                   </span>
//                   <button
//                     disabled={inventory.isAccepting(item)}
//                     onClick={() => inventory.accept(item)}
//                     className={`rounded-3xl cursor-pointer text-center text-sm w-20 inline-block ${
//                       inventory.isAccepting(item)
//                         ? "bg-yellow-200"
//                         : "bg-yellow-500"
//                     }  text-black px-2 py-2`}
//                   >
//                     {inventory.isAccepting(item) ? (
//                       <Loader size={8} />
//                     ) : (
//                       "Accept"
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {inventory.items.pending.length > 1 && (
//         <div>
//           <button
//             disabled={isAcceptingAll}
//             onClick={() => inventory.acceptAllPending()}
//             className={`rounded-3xl float-right cursor-pointer text-center text-sm inline-block ${
//               isAcceptingAll ? "bg-yellow-200" : "bg-yellow-500"
//             }  text-black px-2 py-2`}
//           >
//             {isAcceptingAll ? <Loader size={8} /> : "Accept All Pending Items"}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export const AcceptFees = (props: {
//   inventory: UseInventoryManagement;
//   item: PendingInventoryItem;
// }) => {
//   const [fees, setFees] = useState(null);

//   const avatarSdk = useAvatarContext();

//   useEffect(() => {
//     props.inventory.acceptFees(props.item).then(setFees);
//   }, [props.item]);

//   return (
//     <>
//       {fees && avatarSdk && (
//         <>
//           <span>
//             {formatBalance(fees, {
//               withSi: true,
//               withUnit: false,
//               decimals: avatarSdk.chainProperties.tokenDecimals,
//               forceUnit: "-",
//             })}
//           </span>
//           <b className="text-gray-500 ml-1">
//             {avatarSdk.chainProperties.tokenSymbol}
//           </b>
//         </>
//       )}
//     </>
//   );
// };

const AvatarPage = () => {
  return <></>;
};

export default AvatarPage;
