import "react-datetime/css/react-datetime.css";
import "styles/index.css";

import { observer } from "mobx-react";

import DefaultLayout from "layouts/DefaultLayout";

const MyApp = observer(({ Component, pageProps }) => {
  const Layout = Component.Layout ? Component.Layout : DefaultLayout;

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
});

export default MyApp;
