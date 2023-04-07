import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import BatshitDevtools from "@yornaath/batshit-devtools-react";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const DevTools = () => {
  return (
    <>
      {process.env.NEXT_PUBLIC_REACT_QUERY_DEVTOOLS === "true" &&
      typeof window === "object" ? (
        <Suspense fallback={<></>}>
          <ReactQueryDevtools />
          <BatshitDevtools />
        </Suspense>
      ) : (
        <></>
      )}
    </>
  );
};

export default dynamic(() => Promise.resolve(DevTools), {
  ssr: false,
});
