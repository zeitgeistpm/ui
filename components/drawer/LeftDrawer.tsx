import { observer } from "mobx-react";
import { useStore } from "lib/stores/Store";
import { useNavigationStore } from "lib/stores/NavigationStore";
import Menu from "../menu";
import Drawer from "./Drawer";
import { useRouter } from "next/router";
import Logo from "../icons/ZeitgeistIcon";

const LeftDrawer = observer(() => {
  const router = useRouter();
  const { leftDrawerClosed, blockNumber } = useStore();
  const navigationStore = useNavigationStore();

  const handleHomeClick = () => {
    router.push("/");
    navigationStore.setPage("index");
  };

  return (
    <Drawer side="left" className="h-auto">
      <div className="flex flex-col h-full bg-fog-of-war dark:bg-black text-sky-600">
        <div
          className="flex mx-ztg-30 mt-ztg-20 h-ztg-35 mb-ztg-36"
          onClick={handleHomeClick}
          role="button"
        >
          <Logo />
          <div
            className={`flex flex-col text-white  ml-ztg-14  ${
              leftDrawerClosed ? "hidden" : ""
            }`}
          >
            {leftDrawerClosed === false ? (
              <>
                <div className="flex items-center">
                  <h1 className="text-ztg-19-120 font-bold font-kanit text-white">
                    Zeitgeist
                  </h1>
                  {process.env.NEXT_PUBLIC_ENVIRONMENT_NAME?.length > 0 && (
                    <span className="bg-ztg-blue rounded-ztg-5 px-ztg-10 py-ztg-3  font-bold text-ztg-14-120 ml-ztg-10">
                      {process.env.NEXT_PUBLIC_ENVIRONMENT_NAME}
                    </span>
                  )}
                </div>

                <p className="text-ztg-12-150 font-mono text-sky-600">
                  {blockNumber ? blockNumber.toHuman() : 0}
                </p>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>

        <Menu />
      </div>
    </Drawer>
  );
});

export default LeftDrawer;
