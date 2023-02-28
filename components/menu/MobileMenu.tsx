import { motion } from "framer-motion";
import { useNavigationStore } from "lib/stores/NavigationStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import Link from "next/link";
import ThemeSwitch from "./ThemeSwitch";

const MobileLink = observer(
  ({ title, link, pageName, IconComponent, active }) => {
    const store = useStore();
    const navigationStore = useNavigationStore();

    const handleClick = () => {
      store.toggleShowMobileMenu();
      navigationStore.setPage(pageName);
    };
    return (
      <Link href={link}>
        <div className="flex flex-col items-center" onClick={handleClick}>
          <div className="">
            <IconComponent
              size={24}
              className={`p-ztg-2 rounded-ztg-5 ${
                active ? "bg-ztg-blue text-white" : "dark:text-white"
              }`}
            />
          </div>
          <div className="mt-ztg-10 dark:text-white">{title}</div>
        </div>
      </Link>
    );
  },
);

const MobileMenu = observer(() => {
  const navigationStore = useNavigationStore();

  const mobileItems = navigationStore.getMobileItems();

  return (
    <motion.div
      initial={{ height: -760 }}
      exit={{ y: -760 }}
      animate={{ y: 0 }}
      transition={{ type: "tween", duration: 0.2 }}
      className="fixed top-0 left-0 w-full h-full z-30 bg-whiteflex flex-col items-center pt-[150px] bg-black text-white"
    >
      <div className="flex flex-col items-center gap-14">
        {mobileItems?.map((item) => (
          <MobileLink
            key={item.label}
            title={item.label}
            link={item.href}
            pageName={item.pageName}
            active={navigationStore.checkPage(item.pageName)}
            IconComponent={item.IconComponent}
          />
        ))}
      </div>
      {/* <ThemeSwitch className="mt-auto mb-ztg-24" /> */}
      <div className="text-ztg-14-150 mb-ztg-20 mx-ztg-20 text-center dark:text-white">
        Trading is only available on the desktop version of the application.
      </div>
    </motion.div>
  );
});

export default MobileMenu;
