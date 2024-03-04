import Swap from "components/dex/Swap";
import { useHydraSell } from "lib/hooks/queries/hydra/useHydraSwap";
import { NextPage } from "next";

const SearchPage: NextPage = () => {
  const a = useHydraSell("1", "1000");
  return (
    <div className="relative mt-2">
      <Swap />
    </div>
  );
};

export default SearchPage;
