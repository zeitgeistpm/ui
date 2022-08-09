import { observer } from "mobx-react";
import React, { FC, useEffect, useRef, useState } from "react";
import { FaWallet } from "react-icons/fa";
import { useStore } from "lib/stores/Store";
import AccountButton from "components/account/AccountButton";
import { useAvatarContext } from "@zeitgeistpm/avatara-react";
import { Avatar } from "@zeitgeistpm/avatara-nft-sdk";
import { ZeitgeistAvatar } from "@zeitgeistpm/avatara-react";
import { Skeleton } from "@material-ui/lab";

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
      <div className="relative flex min-h-screen justify-evenly bg-white overflow-hidden">
        <div>
          <div className="rounded-md overflow-hidden">
            <ZeitgeistAvatar
              address={activeAccount?.address || undefined}
              size={"20rem"}
              fallback={
                <Skeleton
                  style={{ transform: "none" }}
                  height={"100%"}
                  width={"100%"}
                />
              }
            />
          </div>
        </div>

        <div className="absolute bottom-10 ">
          <AccountButton
            connectButtonClassname="animate-pulse text-white flex w-ztg-184 h-12 bg-ztg-blue  text-black rounded-full text-ztg-18-150 font-medium items-center justify-center cursor-pointer disabled:cursor-default disabled:opacity-20"
            connectButtonText={
              <div className="flex items-center">
                <FaWallet />
                <span className="ml-2">Connect Wallet</span>
              </div>
            }
          />
        </div>
      </div>
    );
  },
);

export default DefaultLayout;
