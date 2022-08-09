import { observer } from "mobx-react";
import React, { FC, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { debounce } from "lodash";

import { useStore } from "lib/stores/Store";
import AccountButton from "components/account/AccountButton";

const DefaultLayout: FC<{ launchDate: Date }> = observer(
  ({ children, launchDate }) => {
    const store = useStore();

    return (
      <div className="relative flex min-h-screen justify-evenly bg-white dark:bg-sky-1000 overflow-hidden">
        <AccountButton />
      </div>
    );
  },
);

export default DefaultLayout;
