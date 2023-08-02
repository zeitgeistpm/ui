import {
  PolkadotjsWallet,
  SubWallet,
  TalismanWallet,
} from "@talismn/connect-wallets";
import { ChevronRight, Video } from "react-feather";
import { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";

const walletsConfig = [
  new TalismanWallet(),
  new PolkadotjsWallet(),
  new SubWallet(),
];

const CreateAccountPage: NextPage = () => {
  return (
    <>
      <div className="[&>*:not(:last-child)]:mb-6 p-2">
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
      <div className="grid grid-cols-3 gap-x-8 mt-9">
        {walletsConfig.map((wallet, idx) => {
          return (
            <div className="center bg-white rounded-lg" key={idx}>
              <div className="flex items-center h-36">
                <Image
                  src={wallet.logo.src}
                  alt={wallet.logo.alt}
                  width={30}
                  height={30}
                  quality={100}
                />
                <div className="font-medium ml-4 text-lg">{wallet.title}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex text-blue my-9 p-2">
        {/* TODO: Update href attribute */}
        <Link href="#" className="flex">
          <div className="mr-3">
            Watch this tutorial about how to buy tokens using crypto
          </div>
          <Video />
        </Link>
      </div>
      <h2 className="mb-9 p-2">Next Steps</h2>
      <div className="grid grid-cols-2 gap-x-8 mb-20">
        <div className="px-5 py-2 bg-white rounded-lg flex flex-col justify-between">
          <h3 className="p-2 font-bold">Deposit Tokens</h3>
          <div className="flex p-2">
            <Image
              src="/category/e-sports.png"
              alt="Deposit tokens"
              width={69}
              height={69}
              quality={100}
              className="rounded-md"
            />
            <p className="ml-4">
              Use one of several methods to deposit crypto on Zeitgeist to start
              trading
            </p>
          </div>
          <div className="flex items-center p-2">
            {/* TODO: Update href attribute */}
            <Link
              className="text-blue font-medium flex-grow flex items-center"
              href="#"
            >
              Make a Deposit <ChevronRight size={22} />
            </Link>
            <div className="bg-mystic py-1 px-2 text-sm rounded-md">
              ~5 - 15 minutes
            </div>
          </div>
        </div>
        <div className="px-5 py-2 bg-white rounded-lg flex flex-col justify-between">
          <h3 className="p-2 font-bold">Start Trading</h3>
          <div className="flex p-2">
            <Image
              src="/category/e-sports.png"
              alt="Deposit tokens"
              width={69}
              height={69}
              quality={100}
              className="rounded-md"
            />
            <p className="ml-4">
              You're ready to explore the entirety of our application!
            </p>
          </div>
          <div className="flex items-center p-2">
            <Link
              className="text-blue font-medium flex-grow flex items-center"
              href="/markets"
            >
              Make predictions <ChevronRight size={22} />
            </Link>
            <div className="bg-mystic py-1 px-2 text-sm rounded-md">
              No time limits
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateAccountPage;
