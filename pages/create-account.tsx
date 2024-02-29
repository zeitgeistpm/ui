import {
  PolkadotjsWallet,
  SubWallet,
  TalismanWallet,
} from "@talismn/connect-wallets";
import { Video } from "react-feather";
import { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { DepositActionableCard } from "components/ui/actionable/cards/Deposit";
import { StartTradingActionableCard } from "components/ui/actionable/cards/StartTrading";

const walletsConfig = [
  new TalismanWallet(),
  new PolkadotjsWallet(),
  new SubWallet(),
];

const CreateAccountPage: NextPage = () => {
  return (
    <>
      <div className="p-2 [&>*:not(:last-child)]:mb-6">
        <h2>Create an account</h2>
        <p className="mt-3">
          Congrats! You're a few steps away from making predictions on the App.
          Make a few simple steps to create an account and install your first
          zeitgeist friendly wallet.
        </p>
        <p>
          The first thing any Web3 user needs is a crypto wallet to interact
          with various applications. In our case, we make use of Polkadot's
          blockchain technology, and thus you need a Polkadot-based wallet in
          order to interact with our app.
        </p>
        <p>
          There are a number of technologists who have built outstanding wallet
          technology, including{" "}
          <Link
            href="https://www.talisman.xyz/?ref=blog.zeitgeist.pm"
            className="underline"
          >
            Talisman
          </Link>
          , the{" "}
          <Link
            href="https://polkadot.js.org/extension/?ref=blog.zeitgeist.pm"
            className="underline"
          >
            Polkadot.js
          </Link>{" "}
          wallet, and{" "}
          <Link
            href="https://www.subwallet.app/?ref=blog.zeitgeist.pm"
            className="underline"
          >
            SubWallet
          </Link>
          . In this specific tutorial, we show you how to get a Polkadot-based
          wallet using SubWallet's application:
        </p>
      </div>
      <div className="mt-9 grid grid-cols-3 gap-x-8">
        {walletsConfig.map((wallet, idx) => {
          return (
            <motion.div
              whileHover={{
                scale: 1.03,
                boxShadow: "0px 10px 20px 5px rgba(0,0,0,0.25)",
              }}
              whileTap={{ scale: 1 }}
              className={`w-full rounded-lg`}
            >
              <Link
                className="center rounded-lg bg-white"
                href={wallet.installUrl}
                target="_blank"
                key={idx}
              >
                <div className="flex h-36 items-center">
                  <Image
                    src={wallet.logo.src}
                    alt={wallet.logo.alt}
                    width={30}
                    height={30}
                    quality={100}
                  />
                  <div className="ml-4 text-lg font-medium">{wallet.title}</div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
      <div className="my-9 flex p-2 text-blue">
        <a
          href="https://www.youtube.com/playlist?list=PLdOlgpqyU8RP-ZK2A2qbcfxOlzoeuR6sx"
          target="_blank"
          rel="noreferrer"
          className=" flex gap-3"
        >
          <div>Watch this tutorial about how to buy tokens using crypto</div>
          <Video />
        </a>
      </div>
      <h2 className="mb-9 p-2">Next Steps</h2>
      <div className="flex flex-col gap-4 md:flex-row">
        <DepositActionableCard />
        <StartTradingActionableCard />
      </div>
    </>
  );
};

export default CreateAccountPage;
