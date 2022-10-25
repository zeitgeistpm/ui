import { useSdkv2 } from "lib/hooks/useSdkv2";
import { observer } from "mobx-react";
import { NextPage } from "next";

const LiquidityPools: NextPage = observer(() => {
  const sdk = useSdkv2();

  console.log(sdk);

  return <div>pools</div>;
});

export default LiquidityPools;
