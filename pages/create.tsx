import { NextPage } from "next";
import dynamic from "next/dynamic";

const MarketCreationForm = dynamic(() => import("components/create/form"), {
  ssr: false,
});

const CreateMarketPage: NextPage = () => {
  return <MarketCreationForm />;
};

export default CreateMarketPage;
