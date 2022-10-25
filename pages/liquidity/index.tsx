import { Sdkv2Context } from "components/context/Sdkv2Context";
import { observer } from "mobx-react";
import { NextPage } from "next";
import { useContext, useEffect } from "react";

const LiquidityPools: NextPage = observer(() => {
  const sdk$ = useContext(Sdkv2Context);

  useEffect(() => {
    sdk$.subscribe((sdk) => {
      console.log(sdk);
    });
  }, [sdk$]);

  return <div>pools</div>;
});

export default LiquidityPools;
