import { NextPage } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const MarketCreationForm = dynamic(
  () => import("components/create/form/MarketCreationForm"),
  {
    ssr: false,
  },
);

const CreateMarketPage: NextPage = () => {
  return (
    <div>
      <h2 className="font-3xl mb-6 text-center">Create Market</h2>
      <MarketCreationForm />
    </div>
  );
};

export default CreateMarketPage;
