import MarketEditor from "components/create/editor/Editor";
import { NextPage } from "next";

const CreateMarketPage: NextPage = () => {
  return (
    <div className="mt-10">
      <MarketEditor />
    </div>
  );
};

export default CreateMarketPage;
