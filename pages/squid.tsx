import { NextPage } from "next";
import MarketsList from "components/markets/MarketsList";
import dynamic from "next/dynamic";

const SquidForm = dynamic(() => import("components/squid-router/SquidForm"), {
  ssr: false,
});

const SquidTest: NextPage = () => {
  return (
    <div>
      <div className="relative mx-auto min-h-[600px] w-[400px] overflow-hidden rounded-lg border-1 p-3">
        <SquidForm />
      </div>
    </div>
  );
};

export default SquidTest;
