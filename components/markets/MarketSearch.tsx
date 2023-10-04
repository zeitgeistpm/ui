import { useMarketSearch } from "lib/hooks/queries/useMarketSearch";
import { useState } from "react";

const MarketSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: markets } = useMarketSearch(searchTerm);

  console.log(markets);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(event) => {
          setSearchTerm(event.target.value);
        }}
      />
    </div>
  );
};

export default MarketSearch;
