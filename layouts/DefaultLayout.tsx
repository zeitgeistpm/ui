import { FC, PropsWithChildren, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

import TopBar from "components/top-bar";
import Footer from "components/ui/Footer";
import NotificationCenter from "components/ui/NotificationCenter";
import GrillChat from "components/grillchat";
import { TradeItem, TradeItemContext } from "lib/hooks/trade";
import { useSubscribeBlockEvents } from "lib/hooks/useSubscribeBlockEvents";
import { useRouter } from "next/router";

import { Account } from "components/account/Account";
import { ConfirmationProvider } from "components/confirmation/ConfirmationProvider";
import { DisclaimerModal } from "components/onboarding/DisclaimerModal";

const NOTIFICATION_MESSAGE = process.env.NEXT_PUBLIC_NOTIFICATION_MESSAGE;

const Onboarding = dynamic(
  () => import("../components/onboarding/Onboarding"),
  {
    ssr: false,
  },
);

const greyBackgroundPageRoutes = [
  "/",
  "/markets",
  "/markets/favorites",
  "/create-account",
  "/deposit",
  "/topics",
];

const DefaultLayout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  useSubscribeBlockEvents();
  const [tradeItem, setTradeItem] = useState<TradeItem | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-ztg-primary-500">
      <TradeItemContext.Provider value={{ data: tradeItem, set: setTradeItem }}>
        <div ref={contentRef} className="flex flex-1 flex-col">
          <TopBar />
          {/* Add space for fixed TopBar - accounts for filter bar on markets pages */}
          <main className="main-content w-full flex-1">
            {/* Content wrapper with consistent padding - matches TopBar container-fluid alignment */}
            <div className="container-fluid w-full py-4">
              {process.env.NEXT_PUBLIC_MIGRATION_IN_PROGRESS === "true" ? (
                <div className="flex h-[800px] w-full flex-col items-center justify-center ">
                  <div className="text-[24px] font-bold">
                    Migrating to Polkadot
                  </div>
                  <Image
                    src="/polkadot_icon.png"
                    alt="Polkadot Logo"
                    width={300}
                    height={300}
                    style={{
                      animation: "rotation 2s infinite linear",
                    }}
                  />
                </div>
              ) : (
                children
              )}
            </div>
          </main>

          <Footer />
        </div>
        <NotificationCenter />
        <ConfirmationProvider />
        <DisclaimerModal />
      </TradeItemContext.Provider>
      <Account />
      <Onboarding />
      {/* {process.env.NEXT_PUBLIC_GRILLCHAT_DISABLE !== "true" && <GrillChat />} */}
    </div>
  );
};

export default DefaultLayout;
