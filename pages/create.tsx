import { NextPage } from "next";
import dynamic from "next/dynamic";

const MarketEditor = dynamic(() => import("components/create/editor/Editor"), {
  ssr: false,
});

const CreateMarketPage: NextPage = () => {
  return <MarketEditor />;
};

export default CreateMarketPage;
