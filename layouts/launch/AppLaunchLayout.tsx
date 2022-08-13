import { observer } from "mobx-react";
import React, { FC, useEffect, useRef, useState } from "react";
import { FaWallet } from "react-icons/fa";
import { useStore } from "lib/stores/Store";
import AccountButton from "components/account/AccountButton";
import { useAvatarContext } from "@zeitgeistpm/avatara-react";
import { Avatar } from "@zeitgeistpm/avatara-nft-sdk";
import ZeitgeistLogo from "./Logo";
import moment from "moment";

import { AvatarsSvg } from "./gfx/avatars";
import Ball1 from "./gfx/ball1.png";
import Ball2 from "./gfx/ball2.png";
import Ball3 from "./gfx/ball3.png";
import Ball4 from "./gfx/ball4.png";
import Star from "./gfx/star.png";
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

    const [duration, setDuration] = useState(getDuration(launchDate));

    useEffect(() => {
      const timer = setInterval(() => {
        setDuration(getDuration(launchDate));
      }, 1000);
      return () => clearInterval(timer);
    });

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
          className="absolute top-10% right-10% w-1/12"
          style={{ zIndex: 30 }}
        />

        <img
          src={Star.src}
          className="absolute top-16% right-10%"
          width={"22"}
          style={{ zIndex: 30 }}
        />

        <img
          src={Star.src}
          className="absolute top-24 right-64"
          width={"12"}
          style={{ zIndex: 30 }}
        />

        <img
          src={Star.src}
          className="absolute top-24 left-64"
          width={"26"}
          style={{ zIndex: 30 }}
        />

        <div
          className="absolute top-52 left-44 hidden xl:block w-2/5 xl:w-1/5"
          style={{ zIndex: 10 }}
        >
          <img src={RocketBall.src} className="w-full" />
          <img src={GlowBall.src} className="absolute top-10 left-10 " />
          <img src={Rocket.src} className="absolute top-36 left-24 w-2/4" />
        </div>

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
                    "-webkit-gradient(linear, left top, left bottom, from(rgba(0,0,0,1)), to(rgba(0,0,0,0.8)))",
                }}
              />
              <h1 className="absolute top-40 md:top-20 font-light text-5xl xl:text-6xl text-white font-space">
                Zeitgeist App Launch!
              </h1>
              <div className="relative flex justify-center items-center h-full font-bold font-space">
                <CountdownNumber number={duration.days()} />
                <div className="flex justify-center items-center h-44 w-14 px-2">
                  <CountdownSeparator />
                </div>
                <CountdownNumber number={duration.hours()} />
                <div className="flex justify-center items-center h-44 w-14 px-2">
                  <CountdownSeparator />
                </div>
                <CountdownNumber number={duration.minutes()} />
                <div className="flex justify-center items-center h-44 w-14 px-2">
                  <CountdownSeparator />
                </div>
                <CountdownNumber number={duration.seconds()} />
              </div>
            </div>
          </div>

          <div
            className="relative -mt-96 md:-mt-64 xl:-mt-52"
            style={{ zIndex: 20 }}
          >
            <div className="flex justify-center">
              <AvatarsSvg className="w-full md:w-3/4 xl:w-3/5" />
              {/* <img src={AvatarsGfx.src} className="w-full md:w-3/4 xl:w-3/5" /> */}
            </div>
            <div className="flex justify-center">
              <img src={DownCarret.src} className="w-12 md:w-22 xl:w-24" />
            </div>
          </div>

          <div
            className="relative mt-24 text-center flex text-xl flex-col items-center font-lato font-light leading-loose"
            style={{ zIndex: 30 }}
          >
            <section className="flex relative justify-center w-full mb-16 md:w-5/6">
              <img
                src={Ball3.src}
                className="absolute top-0 -left-12 w-8/12 md:w-6/12 xl:w-5/12"
                style={{ zIndex: 0 }}
              />
              <img
                src={Ball4.src}
                className="absolute top-20% right-12 w-10/12 md:w-8/12 xl:w-6/12"
                style={{ zIndex: 0 }}
              />
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

            <div className="flex justify-center mb-16">
              <img src={DownCarret.src} className="w-12 md:w-22 xl:w-24" />
            </div>

            <section
              className="flex justify-center w-full text-center mb-16"
              style={{ zIndex: 50 }}
            >
              <div className="flex justify-center md:w-5/6">
                <div className="bg-white p-12 bg-opacity-5 md:w-5/6">
                  <button className="mb-12 bg-ztg-blue text-white py-2 px-24 font-space font-bold">
                    Mint ZTG NFT
                  </button>
                  <p className="mb-8">
                    By clicking this button, you will be minting a Zeitgeist NFT
                    unique for your Zeitgeist profile image. You will be able to
                    view and adjust this profile image from your profile section
                    of the Zeitgeist application.
                  </p>
                </div>
              </div>
            </section>

            <section className="flex relative justify-center w-full mb-12 md:w-5/6">
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
      {props.number}
    </div>
  );
};

export default DefaultLayout;
