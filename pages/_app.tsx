import "react-datetime/css/react-datetime.css";
import "styles/index.css";

import { observer } from "mobx-react";
import SDKv2Layout from "layouts/SDKv2Layout";

const MyApp = observer(({ Component, pageProps }) => {
  const Layout = Component.Layout ? Component.Layout : SDKv2Layout;

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
});

export default MyApp;
