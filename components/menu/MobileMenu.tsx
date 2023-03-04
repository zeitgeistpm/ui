import { motion } from "framer-motion";
import { useNavigationStore } from "lib/stores/NavigationStore";
import { MenuItemMobile } from "./MenuItemMobile";
import { PageName } from "lib/types/navigation";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import Link from "next/link";
import ThemeSwitch from "./ThemeSwitch";

// const MobileLink = observer(
//   ({ title, link, pageName, IconComponent, active }) => {
//     const store = useStore();
//     const navigationStore = useNavigationStore();

//     const handleClick = () => {
//       store.toggleShowMobileMenu();
//       navigationStore.setPage(pageName);
//     };
//     return (
//       <Link href={link}>
//         <div className="flex flex-col items-center" onClick={handleClick}>
//           <div className="">
//             <IconComponent
//               size={24}
//               className={`p-ztg-2 rounded-ztg-5 ${
//                 active ? "bg-ztg-blue text-white" : "dark:text-white"
//               }`}
//             />
//           </div>
//           <div className="mt-ztg-10 dark:text-white">{title}</div>
//         </div>
//       </Link>
//     );
//   },
// );

const MobileMenu = observer(() => {
  const navigationStore = useNavigationStore();

  const navigate = (page: PageName) => {
    navigationStore.setPage(page);
    // We may add this back when there are more items in the left drawer
    // navigationStore.closeAndDeselectGroups();
  };

  return (
    <motion.div
      initial={{ height: -760 }}
      exit={{ y: -760 }}
      animate={{ y: 0 }}
      transition={{ type: "tween", duration: 0.2 }}
      className="fixed top-0 left-0 w-full h-full z-30 bg-whiteflex flex-col items-center pt-[150px] bg-white text-black"
    >
      <div className="flex flex-col items-center gap-14">
        {Object.keys(navigationStore.items)
          .filter((itemKey) => {
            // Skip court page for now...
            if (
              itemKey === "court" &&
              process.env.NEXT_PUBLIC_SHOW_COURT === "false"
            ) {
              return false;
            }

            // Skip activity feed page for now...
            if (itemKey === "activity") return false;

            return true;
          })
          .map((itemKey, idx) => {
            const item = navigationStore.items[itemKey];
            return (
              <MenuItemMobile
                href={item.href}
                IconComponent={item.IconComponent}
                textLabel={item.label}
                active={navigationStore.checkPage(itemKey as any)}
                className=""
                onClick={() => navigate(itemKey as any)}
                key={`meuItem-${idx}`}
              />
            );
          })}
      </div>
      {/* <ThemeSwitch className="mt-auto mb-ztg-24" /> */}
      <div className="text-ztg-14-150 mb-ztg-20 mx-ztg-20 text-center dark:text-white">
        Trading is only available on the desktop version of the application.
      </div>
    </motion.div>
  );
});

export default MobileMenu;
