import { Sdkv2Context } from "components/context/Sdkv2Context";
import { observer } from "mobx-react";
import { NextPage } from "next";
import { useContext } from "react";

const LiquidityPools: NextPage = observer(() => {
  const sdk$ = useContext(Sdkv2Context);

  console.log(sdk$);

  return <div>pools</div>;
});

export default LiquidityPools;
