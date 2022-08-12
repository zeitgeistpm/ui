import { observer } from "mobx-react";
import React, { FC, useEffect, useRef, useState } from "react";
import { FaWallet } from "react-icons/fa";
import { useStore } from "lib/stores/Store";
import AccountButton from "components/account/AccountButton";
import { useAvatarContext } from "@zeitgeistpm/avatara-react";
import { Avatar } from "@zeitgeistpm/avatara-nft-sdk";
import ZeitgeistLogo from "./Logo";

import AvatarsGfx from "./gfx/avatars.png";
import Ball1 from "./gfx/ball1.png";
import Ball2 from "./gfx/ball2.png";
import Saturn from "./gfx/saturn.png";
import DownCarret from "./gfx/down_carret.png";
import RocketBall from "./gfx/rocket_ball.png";
import Rocket from "./gfx/rocket.png";
import GlowBall from "./gfx/glow_ball.png";

import Footer from "./Footer";

const DefaultLayout: FC<{ launchDate: Date }> = observer(
  ({ children, launchDate }) => {
    const store = useStore();
    const avataraContext = useAvatarContext();

    const [isClaiming, setIsClaiming] = useState(false);
    const [claimError, setClaimError] = useState<null | string>(null);

    const [avatars, setAvatars] = useState<Avatar.IndexedAvatar[]>([]);

    useEffect(() => {
      if (avataraContext) {
        Avatar.fetchIndexedAvatars(avataraContext).then(setAvatars);
      }
    }, [avataraContext]);

    const {
      wallets: { activeAccount },
    } = store;

    const onClickClaim = async () => {
      if (!activeAccount) {
        return console.warn("no account");
      }

      setIsClaiming(true);
      setClaimError(null);

      try {
        const response = await Avatar.claim(
          avataraContext,
          activeAccount.address,
        );

        if (!response?.avatar) {
          setClaimError((response as any).message);
        }
      } catch (error) {
        setClaimError(error.message);
      }

      setIsClaiming(false);
    };

    return (
      <div className="w-full min-h-screen overflow-hidden overflow-x-hidden max-w-[100vw] text-white bg-black">
        <img
          src={Ball2.src}
          className="absolute -top-16% -right-10% w-full md:w-3/5 xl:w-5/12"
        />

        <img
          src={Saturn.src}
          className="absolute top-16% right-6% w-2/12"
          style={{ zIndex: 30 }}
        />

        <div className="relative mx-6 sm:mx-24 xl:mx-[408px]">
          <header className="relative py-4" style={{ zIndex: 20 }}>
            <div className="flex items-center mr-2 mb-6 text-white">
              <div className="mr-2">
                <ZeitgeistLogo height={38} width={37} />
              </div>
              <div className="ml-3 font-kanit  font-bold text-2xl">
                Zeitgeist
              </div>
            </div>
          </header>

          <div className="relative z-0" style={{ zIndex: 10 }}>
            <div
              className="w-full flex justify-center items-center -translate-y-20"
              style={{ height: "620px" }}
            >
              <img
                src={Ball1.src}
                alt="ball"
                className="absolute w-full scale-125 xl:w-3/4 z-0"
                style={{
                  WebkitMaskImage:
                    "-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,0)))",
                }}
              />
              <h1 className="absolute top-40 md:top-20 font-light text-4xl md:text-5xl xl:text-7xl text-white font-space">
                Zeitgeist App Launch!
              </h1>
              <div className="relative flex justify-center items-center h-full font-bold font-space">
                <CountdownNumber number={0o7} />
                <div className="flex justify-center items-center h-44 w-14 px-2">
                  <CountdownSeparator />
                </div>
                <CountdownNumber number={30} />
                <div className="flex justify-center items-center h-44 w-14 px-2">
                  <CountdownSeparator />
                </div>
                <CountdownNumber number={40} />
                <div className="flex justify-center items-center h-44 w-14 px-2">
                  <CountdownSeparator />
                </div>
                <CountdownNumber number={15} />
              </div>
            </div>
          </div>

          <div
            className="relative -mt-96 md:-mt-64 xl:-mt-52"
            style={{ zIndex: 20 }}
          >
            <div className="flex justify-center">
              <img src={AvatarsGfx.src} className="w-full md:w-3/4 xl:w-3/5" />
            </div>
            <div className="flex justify-center">
              <img src={DownCarret.src} className="w-24 md:w-28 xl:w-40" />
            </div>
          </div>

          <div
            className="relative mt-24 text-center flex text-xl flex-col items-center font-lato font-light"
            style={{ zIndex: 30 }}
          >
            <section className="w-full md:w-4/6">
              <h2 className="mb-12 text-3xl font-bold font-space">
                Zeitgeist App Pre-Launch NFT Foundry
              </h2>
              <p className="mb-8">
                Welcome to the Zeitgeist pre-launch NFT foundry. Here you can
                see how long until we go live with our Prediction Markets
                application, and prepare yourself as an early adopter by minting
                a specialized pre-launch NFT profile image and badge set!
              </p>
              <p className="mb-8">
                We are rewarding Zeitgeist early supporters who hold a Zeitgeist
                Tarot Themed NFT, as well as inviting non-Tarot NFT holders to
                purchase pre-launch NFTs with $ZTG. We also have a special
                surprise for the select few legends who hold a number of the
                different types of Zeitgeist Tarot cards.
              </p>
              <p className="mb-8">
                To find out more about these specialized app launch NFTs, read
                this blog post here.
              </p>
            </section>
          </div>

          <div
            className="fixed top-4 right-4 md:top-4 md:right-12"
            style={{ zIndex: 99 }}
          >
            <AccountButton
              connectButtonClassname="animate-pulse text-white flex w-ztg-184 h-12 bg-[#45059E] text-black rounded-full text-ztg-18-150 font-medium items-center justify-center cursor-pointer disabled:cursor-default disabled:opacity-20"
              connectButtonText={
                <div className="flex items-center">
                  <FaWallet />
                  <span className="ml-2">Connect Wallet</span>
                </div>
              }
            />
          </div>

          <Footer />
        </div>
      </div>
    );
  },
);

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
      {props.number}
    </div>
  );
};

export default DefaultLayout;
