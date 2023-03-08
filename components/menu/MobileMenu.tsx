import { useNavigationStore } from "lib/stores/NavigationStore";
import { MenuItemMobile } from "./MenuItemMobile";
import { PageName } from "lib/types/navigation";
import { observer } from "mobx-react";

const MobileMenu = observer(() => {
  const navigationStore = useNavigationStore();

  const navigate = (page: PageName) => {
    navigationStore.setPage(page);
    // We may add this back when there are more items in the left drawer
    // navigationStore.closeAndDeselectGroups();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full z-30 flex flex-col justify-between items-center pt-[125px] bg-white text-black">
      <div className="flex flex-col justify-between items-center gap-7">
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
                textLabel={item.label}
                active={navigationStore.checkPage(itemKey as any)}
                className=""
                onClick={() => navigate(itemKey as any)}
                key={`meuItem-${idx}`}
              />
            );
          })}
      </div>
      <div className="p-7 text-center text-xs">
        Trading is only available on the desktop version of the application.
      </div>
    </div>
  );
});

export default MobileMenu;
