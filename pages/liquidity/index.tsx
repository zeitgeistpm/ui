import SDKv2Layout from "layouts/SDKv2Layout";
import { observer } from "mobx-react";
import { NextPage } from "next";

const LiquidityPools: NextPage = observer(() => {
  return <div>pools</div>;
});

Object.assign(LiquidityPools, {
  Layout: SDKv2Layout,
});

export default LiquidityPools;
