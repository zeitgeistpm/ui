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
        <a className="flex flex-col items-center" onClick={handleClick}>
          <div className="">
            <IconComponent
              size={24}
              className={`p-ztg-2 rounded-ztg-5 ${
                active ? "bg-ztg-blue text-white" : "dark:text-white"
              }`}
            />
          </div>
          <div className="mt-ztg-10 dark:text-white">{title}</div>
        </a>
      </Link>
    );
  },
);

const MobileMenu = observer(() => {
  const navigationStore = useNavigationStore();

  const mobileItems = navigationStore.getMobileItems();

  return (
    <motion.div
      initial={{ y: -600 }}
      exit={{ y: -600 }}
      animate={{ y: 0 }}
      transition={{ type: "tween", duration: 0.2 }}
      className="fixed w-full h-full z-ztg-1 bg-white dark:bg-sky-1000 flex flex-col items-center pt-[150px]"
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
      <ThemeSwitch className="mt-auto mb-ztg-24" />
      <div className="text-ztg-14-150 mb-ztg-20 mx-ztg-20 text-center dark:text-white">
        Trading is only available on the desktop version of the application.
      </div>
    </motion.div>
  );
});

export default MobileMenu;
