import Image from "next/image";
import { observer } from "mobx-react";
import moment from "moment";
import React, { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaHatWizard, FaWallet } from "react-icons/fa";
import { useStore } from "lib/stores/Store";
import { useAccountModals } from "lib/hooks/account";
import { useNotificationStore } from "lib/stores/NotificationStore";
import AccountButton from "components/account/AccountButton";
import { useAvatarContext, ZeitgeistAvatar } from "@zeitgeistpm/avatara-react";
import { Avatar, Tarot } from "@zeitgeistpm/avatara-nft-sdk";
import ZeitgeistLogo from "./Logo";
import Parallax from "./Parallax";

import { AvatarsSvg } from "./gfx/avatars";
import Ball1 from "./gfx/ball1.png";
import Ball2 from "./gfx/ball2.png";
import Ball3 from "./gfx/ball3.png";
import Ball4 from "./gfx/ball4.png";
import Ball5 from "./gfx/ball5.png";
import Ball6 from "./gfx/ball6.png";
import Star from "./gfx/star.png";
import Saturn from "./gfx/saturn.png";
import DownCarret from "./gfx/down_carret.png";
import RocketBall from "./gfx/rocket_ball.png";
import Rocket from "./gfx/rocket.png";
import GlowBall from "./gfx/glow_ball.png";
import Footer from "./Footer";
import { encodeAddress } from "@polkadot/keyring";
import { cidToUrl, sanitizeIpfsUrl } from "@zeitgeistpm/avatara-util";
import { shortenAddress } from "lib/util";
import Loader from "react-spinners/BeatLoader";
import NotificationCenter from "components/ui/NotificationCenter";

const DefaultLayout: FC<{ launchDate: Date }> = observer(
  ({ children, launchDate }) => {
    const store = useStore();
    const avataraContext = useAvatarContext();
    const notificationStore = useNotificationStore();
    const accountModals = useAccountModals();

    const address = store.wallets.activeAccount?.address;

    const ksmAddress: string | null =
      avataraContext && address
        ? encodeAddress(address, avataraContext.chainProperties.ss58Format)
        : null;

    const [indexedAvatar, setIndexedAvatar] = useState<Avatar.IndexedAvatar>();

    const [isClaiming, setIsClaiming] = useState(false);
    const [avatars, setAvatars] = useState<Avatar.IndexedAvatar[]>([]);
    const [tarotNftImage, setTarotNftImage] = useState(null);

    const [tarotHolders, setTarotHolders] =
      useState<Tarot.TarotHolderSnapshot>(null);

    const [occultists, setOccultists] = useState<Tarot.OccultistStats>(null);

    const tarotHolder = tarotHolders?.data.holders.find(
      (holder) => holder.owner === ksmAddress,
    );

    const { connected: walletConnected } = store.wallets;

    const isWhitelisted = Boolean(tarotHolder);

    const [duration, setDuration] = useState(getDuration(launchDate));

    useEffect(() => {
      const timer = setInterval(() => {
        setDuration(getDuration(launchDate));
      }, 1000);
      return () => clearInterval(timer);
    });

    useEffect(() => {
      if (avataraContext) {
        console.group("@zeitgeistpm/avatara");
        console.log("api", avataraContext.opts.api);
        console.log("rpc", avataraContext.opts.rpc);
        console.log("indexer", avataraContext.opts.indexer);
        console.log(
          "avatarCollectionId",
          avataraContext.opts.avatarCollectionId,
        );
        console.groupEnd();
      }
    }, [avataraContext]);

    useEffect(() => {
      if (avataraContext && ksmAddress && !isClaiming) {
        Avatar.fetchIndexedAvatarForAccount(avataraContext, ksmAddress).then(
          setIndexedAvatar,
        );
      }
    }, [avataraContext, ksmAddress, isClaiming]);

    useEffect(() => {
      if (avataraContext) {
        Avatar.fetchIndexedAvatars(avataraContext).then(setAvatars);
        Tarot.fetchLatestSnapshot(avataraContext).then(setTarotHolders);
        Tarot.fetchLatestOccultists(avataraContext).then(setOccultists);
      }
    }, [avataraContext]);

    useEffect(() => {
      if (tarotHolder) {
        fetch("https://gql-rmrk1.rmrk.link/v1/graphql", {
          method: "POST",
          body: JSON.stringify({
            operationName: "fetchSingleNFT",
            query:
              'query fetchSingleNFT($id: String!) {\n  nfts(\n    where: {id: {_eq: $id}, _or: [{burned: {_eq: ""}, collection: {_not: {singular_blacklisted_collections: {}}}}]}\n  ) {\n    ...NFT\n    __typename\n  }\n}\n\nfragment NFT on nfts {\n  id\n  block\n  burned\n  forsale\n  collectionId\n  instance\n  metadata\n  metadata_name\n  metadata_content_type\n  metadata_image\n  metadata_animation_url\n  metadata_description\n  name\n  owner\n  sn\n  transferable\n  collection {\n    max\n    name\n    issuer\n    singular_nsfw_collections {\n      created_at\n      reason\n      __typename\n    }\n    singular_verified_collections {\n      collection_id\n      __typename\n    }\n    __typename\n  }\n  singular_curated {\n    created_at\n    __typename\n  }\n  singular_nsfw {\n    created_at\n    reason\n    __typename\n  }\n  __typename\n}\n',
            variables: { id: tarotHolder.id },
          }),
        })
          .then((res) => res.json())
          .then((json) => {
            const nft = json.data.nfts?.[0];
            if (nft) {
              setTarotNftImage(
                sanitizeIpfsUrl(
                  nft.metadata_image,
                  "https://ipfs.rmrk.link/" as any,
                ),
              );
            }
          });
      }
    }, [tarotHolder]);

    useEffect(() => {
      store.userStore.theme = "dark";
    });

    const isConnecting = !store.initialized || !avataraContext;

    const disabled =
      isConnecting ||
      isClaiming ||
      !avataraContext ||
      !isWhitelisted ||
      !walletConnected;

    const mintingContainer = useRef<HTMLDivElement>();
    const [mintingContainerHeight, setMintingContainerHeight] =
      useState<number>(null);

    useLayoutEffect(() => {
      const onResize = () => {
        if (
          mintingContainer.current?.clientHeight >=
          window.document.body.clientHeight
        ) {
          setMintingContainerHeight(null);
        } else {
          setMintingContainerHeight(mintingContainer.current?.clientHeight);
        }
      };
      onResize();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [mintingContainer, isConnecting, disabled]);

    const doClaim = async () => {
      if (!isClaiming && address && avataraContext) {
        setIsClaiming(true);
        try {
          const response = await Avatar.claim(avataraContext, address);
          if (!response?.avatar) {
            throw new Error((response as any).message);
          }
          Avatar.fetchIndexedAvatarForAccount(avataraContext, ksmAddress).then(
            setIndexedAvatar,
          );
        } catch (error) {
          notificationStore.pushNotification(error.message, {
            type: "Error",
          });
        }
        setIsClaiming(false);
      }
    };

    return (
      <div className="w-full min-h-screen overflow-hidden overflow-x-hidden max-w-[100vw] text-white bg-black">
        <Parallax
          className="absolute top-10% right-10% w-1/12"
          style={{ zIndex: 30 }}
        >
          <Image src={Saturn} />
        </Parallax>

        <Parallax className="absolute top-16% right-10%" style={{ zIndex: 30 }}>
          <Image src={Star} width={"22"} height={"22"} />
        </Parallax>

        <Parallax className="absolute top-24 right-64" style={{ zIndex: 30 }}>
          <Image src={Star} width={"12"} height={"12"} />
        </Parallax>

        <Parallax className="absolute top-24 left-64" style={{ zIndex: 30 }}>
          <Image src={Star} width={"26"} height={"26"} />
        </Parallax>

        <div className="absolute hidden md:block -top-16% right-0 w-full md:w-3/5 xl:w-5/12 overflow-hidden">
          <Parallax>
            <Image src={Ball2} />
          </Parallax>
          <Parallax>
            <Image
              src={Ball6}
              className="absolute bottom-20 right-72"
              width={82}
            />
          </Parallax>
        </div>

        <div
          className="absolute top-52 left-44 hidden xl:block w-2/5 xl:w-1/5"
          style={{ zIndex: 10 }}
        >
          <Parallax className="w-full">
            <Image src={RocketBall} />
          </Parallax>
          <Parallax className="absolute top-0 left-12 ">
            <Image src={GlowBall} />
          </Parallax>
          <Parallax className="absolute top-24 left-24 w-2/4">
            <Image src={Rocket} />
          </Parallax>
        </div>

        <header
          className="relative flex items-center pt-4 xl:py-6 px-6 xl:px-12"
          style={{ zIndex: 20 }}
        >
          <div className="flex items-center text-white h-20">
            <div className="mr-2">
              <ZeitgeistLogo height={38} width={37} />
            </div>
            <div className="ml-4 font-kanit font-bold text-2xl">Zeitgeist</div>
          </div>
          <div className="flex-1 justify-end hidden sm:flex">
            <div className="inline-flex">
              {isConnecting ? (
                <div className="flex justify-center items-center">
                  <span style={{ fontFamily: "Consolas,monaco,monospace" }}>
                    connecting to chain
                  </span>
                  <div className="bg-ztg-blue h-4 w-4 rounded-full ml-2 animate-pulse"></div>
                </div>
              ) : (
                <AccountButton
                  autoClose
                  connectButtonClassname="animate-pulse text-white flex w-64 xl:w-ztg-184 h-12 bg-[#45059E] text-black rounded-full text-ztg-18-150 font-medium justify-center items-center cursor-pointer disabled:cursor-default disabled:opacity-20"
                  connectButtonText={
                    <div className="flex items-center">
                      <FaWallet />
                      <span className="ml-2">Connect Wallet</span>
                    </div>
                  }
                />
              )}
            </div>
          </div>
        </header>

        <div className="relative mx-6 sm:mx-24 xl:mx-[12%] 2xl:mx-[16%]">
          <div className="relative z-0 h-72 md:h-96" style={{ zIndex: 10 }}>
            <div
              className="w-full flex justify-center items-center"
              style={{ height: "620px" }}
            >
              <Parallax
                className="absolute w-full xl:w-3/4 z-0"
                style={{
                  zIndex: 0,
                  WebkitMaskImage:
                    "-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,0.8)))",
                }}
              >
                <Image src={Ball1} alt="ball" />
              </Parallax>
              <h1 className="absolute top-28 md:top-20 font-light text-5xl xl:text-6xl text-white font-space">
                Zeitgeist App Launch!
              </h1>
              <div className="relative flex justify-center items-center font-bold font-space">
                <CountdownNumber number={duration.days()} />
                <div className="flex justify-center items-center h-44 w-10 md:w-14 px-2">
                  <CountdownSeparator />
                </div>
                <CountdownNumber number={duration.hours()} />
                <div className="flex justify-center items-center h-44 w-10 md:w-14 px-2">
                  <CountdownSeparator />
                </div>
                <CountdownNumber number={duration.minutes()} />
                <div className="flex justify-center items-center h-44 w-10 md:w-14 px-2">
                  <CountdownSeparator />
                </div>
                <CountdownNumber number={duration.seconds()} />
              </div>
            </div>
          </div>

          <div className="relative h-80 md:h-96" style={{ zIndex: 20 }}>
            <Parallax className="flex justify-center ">
              <AvatarsSvg className="w-full  md:w-3/4 xl:w-3/5" />
            </Parallax>
          </div>

          <Parallax
            className="relative flex justify-center"
            style={{ zIndex: 50 }}
          >
            <Image src={DownCarret} className="w-12 md:w-22 xl:w-24" />
          </Parallax>

          <div
            className="relative mt-24 text-center flex text-xl flex-col items-center font-lato font-light leading-loose"
            style={{ zIndex: 30 }}
          >
            <section className="flex relative justify-center w-full mb-16 md:w-5/6">
              <Parallax className="absolute top-0 -left-12 w-8/12 md:w-6/12 xl:w-5/12">
                <div style={{ zIndex: 0 }}>
                  <Image src={Ball3} />
                </div>
              </Parallax>
              <Parallax className="absolute top-20% right-12 w-10/12 md:w-8/12 xl:w-6/12">
                <div style={{ zIndex: 0 }}>
                  <Image src={Ball4} />
                </div>
              </Parallax>
              <Parallax className="absolute top-24 left-0 xl:-left-64">
                <div style={{ zIndex: 30 }}>
                  <Image src={Star} width={"26"} height={"26"} />
                </div>
              </Parallax>
              <Parallax className="absolute bottom-0 right-0 xl:-right-64">
                <div style={{ zIndex: 30 }}>
                  <Image src={Star} width={"16"} height={"16"} />
                </div>
              </Parallax>
              <div className="md:w-5/6" style={{ zIndex: 10 }}>
                <h2 className="mb-12 text-3xl font-bold font-space">
                  Zeitgeist App Pre-Launch NFT Foundry
                </h2>
                <p className="mb-8">
                  Welcome to the Zeitgeist pre-launch NFT foundry. Here you can
                  see how long until we go live with our Prediction Markets
                  application, and prepare yourself as an early adopter by
                  minting a specialized pre-launch NFT profile image and badge
                  set!
                </p>
                <p className="mb-8">
                  We are rewarding Zeitgeist early supporters who hold a
                  Zeitgeist Tarot Themed NFT, as well as inviting non-Tarot NFT
                  holders to purchase pre-launch NFTs with $ZTG. We also have a
                  special surprise for the select few legends who hold a number
                  of the different types of Zeitgeist Tarot cards.
                </p>
                <p className="mb-8">
                  To find out more about these specialized app launch NFTs, read
                  this blog post here.
                </p>
              </div>
            </section>

            <Parallax className="flex justify-center mb-16">
              <Image src={DownCarret} className="w-12 md:w-22 xl:w-24" />
            </Parallax>

            <section
              className="flex justify-center w-full text-center mb-16"
              style={{ zIndex: 50 }}
            >
              <div
                ref={mintingContainer}
                className="relative flex items-center justify-center mb-20 md:mb-18 xl:mb-0 md:w-5/6"
                style={{ zIndex: 10, height: mintingContainerHeight || "auto" }}
              >
                {indexedAvatar ? (
                  <div
                    className="relative block bg-white p-12 bg-opacity-5 md:w-5/6"
                    style={{ animation: "bounceIn 1.3s normal forwards" }}
                  >
                    <div className="block xl:flex">
                      <div className="flex items-center justify-center mb-8 xl:mb-0">
                        <ZeitgeistAvatar
                          size={220}
                          className="w-full rounded-md overflow-hidden  xl:mb-0"
                          address={ksmAddress}
                        />
                      </div>
                      <div className="xl:pl-8 max-w-xl text-center xl:text-left">
                        <h3 className="font-bold text-3xl font-space mb-2">
                          Minted!
                        </h3>
                        <p className="mb-6">
                          Your avatar was successfully minted. You are now ready
                          to earn equipable badges once the Zeitgeist app is
                          live.
                        </p>
                        <p>
                          <a
                            target="_blank"
                            href={`${process.env.NEXT_PUBLIC_SINGULAR_URL}/collectibles/${indexedAvatar.id}`}
                            className="inline-flex relative text-singular h-12 items-center border-2 border-[#EB3089] rounded-md py-2 px-4"
                          >
                            <span className="mr-2 hidden md:inline">
                              View it on
                            </span>
                            <img src="/singular.png" className="h-85% mt-1" />
                          </a>
                        </p>
                        {(occultists.fullDeckOwners.includes(ksmAddress) ||
                          occultists.threeOfNamedOwners.includes(
                            ksmAddress,
                          )) && (
                          <div className="mt-8 text-center xl:text-left">
                            <div className="flex items-center justify-center md:justify-start mb-2">
                              <FaHatWizard className="mr-3" />
                              <p>
                                <span className="font-bold">
                                  Bonus item received!
                                </span>
                              </p>
                            </div>
                            <p className="text-sm">
                              As a sign of appreciation for your loyalty, we’re
                              minting a bonus item for you! Be sure to check the
                              “pending items” in your avatar inventory on
                              Singular in a few minutes time.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-12 bg-opacity-5 md:w-5/6">
                    <div className="flex justify-center items-center mb-8">
                      <button
                        onClick={doClaim}
                        disabled={disabled}
                        className={`relative h-18 md:h-16 text-md flex justify-center items-center bg-ztg-blue text-white py-2 px-24 font-space font-bold ${
                          disabled
                            ? "bg-blue-500 text-gray-700 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {isClaiming ? (
                          <Loader color="white" />
                        ) : (
                          <span>
                            Mint <span className="hidden md:inline">ZTG</span>{" "}
                            NFT
                          </span>
                        )}
                      </button>
                    </div>

                    {isConnecting ? (
                      <div className="flex justify-center items-center mb-12">
                        <span
                          style={{ fontFamily: "Consolas,monaco,monospace" }}
                        >
                          connecting to chain
                        </span>
                        <div className="bg-ztg-blue h-4 w-4 rounded-full ml-4 animate-pulse"></div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-8">
                          <div
                            className="flex justify-center items-center cursor-pointer"
                            onClick={() =>
                              walletConnected
                                ? accountModals.openAccontSelect()
                                : accountModals.openWalletSelect()
                            }
                          >
                            <p
                              className={`flex relative justify-center items-center bg-black py-2 px-4 text-md ${
                                !isWhitelisted && address ? "line-through" : ""
                              }`}
                              style={{
                                fontFamily: "Consolas,monaco,monospace",
                              }}
                            >
                              {!address || !walletConnected ? (
                                <span className="flex justify-center items-center">
                                  Select account <FaWallet className="ml-4" />
                                </span>
                              ) : (
                                <span title={address}>
                                  {shortenAddress(address, 8, 8)}
                                </span>
                              )}
                              {address && walletConnected && (
                                <div
                                  className={`w-3 h-3 ml-3 rounded-full animate-pulse ${
                                    isWhitelisted
                                      ? "bg-purple-600"
                                      : "bg-red-600"
                                  }`}
                                ></div>
                              )}

                              {isWhitelisted &&
                                tarotNftImage &&
                                walletConnected && (
                                  <div className="group h-full absolute -right-14 border-black border-2 hover:scale-[4] transition-all hover:border-purple-600 hover:rounded-sm">
                                    <img
                                      src={tarotNftImage}
                                      className="h-full hover:rounded-sm overflow-hidden"
                                    />
                                    <div className="absolute hidden group-hover:block w-full text-center pb-[2px] text-[3px] bottom-0">
                                      Tarot holder!
                                    </div>
                                  </div>
                                )}
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    <p className="mb-14">
                      By clicking this button, you will be minting a Zeitgeist
                      NFT unique for your Zeitgeist profile image. You will be
                      able to view and adjust this profile image from your
                      profile section of the Zeitgeist application.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="flex relative justify-center w-full mb-12 md:w-5/6">
              <Parallax className="absolute -bottom-72 -left-72 w-10/12 md:w-9/12 xl:w-12/12">
                <div style={{ zIndex: 0 }}>
                  <Image src={Ball5} />
                </div>
              </Parallax>
              <Parallax className="absolute top-[50%] right-0 xl:-right-64">
                <div style={{ zIndex: 30 }}>
                  <Image src={Star} width={"28"} height={"28"} />
                </div>
              </Parallax>
              <div className="md:w-5/6" style={{ zIndex: 10 }}>
                <h2 className="mb-12 text-3xl font-bold font-space">
                  Who Are These NFTs For?
                </h2>
                <p className="mb-8">
                  Zeitgeist NFTs are rewards for early adopters and supporters
                  of the Zeitgeist journey. During our Beta campaign, we sold
                  “Tarot themed” NFTs that provided access to our Beta
                  application, and holders of these Tarot NFTs will now be
                  further rewarded for their early support by earning
                  specialized profile image NFTs and NFT badges to differentiate
                  themselves from among the crowd.
                </p>
                <p className="mb-8">
                  If you are excited to be part of this campaign but don’t own a
                  Tarot NFT, you can purchase a specialized NFT badge for
                  200ztg.
                </p>
              </div>
            </section>
          </div>

          <Footer />
        </div>

        <div className="dark relative" style={{ zIndex: 999 }}>
          <NotificationCenter />
        </div>
      </div>
    );
  },
);

const getDuration = (from: Date) => {
  return moment.duration(from.getTime() - new Date().getTime(), "milliseconds");
};

const CountdownSeparator = () => {
  return (
    <div>
      <div className="h-3 w-3 mb-3 xl:h-4 xl:w-4 xl:mb-4 flex rounded-full bg-[#6B01FE]" />
      <div className="h-3 w-3 xl:h-4 xl:w-4 flex rounded-full bg-[#6B01FE]" />
    </div>
  );
};

const CountdownNumber = (props: { number: number }) => {
  return (
    <div className="flex items-center justify-center text-4xl xl:text-7xl h-20 w-20 md:h-22 md:w-22 xl:h-44 xl:w-44 bg-black bg-opacity-30">
      {props.number < 10 ? "0" : ""}
      {props.number}
    </div>
  );
};

export default DefaultLayout;
