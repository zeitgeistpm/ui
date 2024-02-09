import { useEffect } from "react";
import { NextPage } from "next";
import { useWallet } from "lib/state/wallet";
import { useRouter } from "next/router";
import MarketEditor from "components/create/editor/Editor";

const CreateMarketPage: NextPage = () => {
  const { activeAccount } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (activeAccount?.address !== process.env.NEXT_PUBLIC_MW_WSX) {
      router.push("/markets");
    }
  }, [router]);

  return (
    <div className="mt-10">
      <MarketEditor />
    </div>
  );
};

export default CreateMarketPage;
