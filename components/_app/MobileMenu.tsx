import MobileMenu from "components/menu/MobileMenu";
import { AnimatePresence } from "framer-motion";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";

export const MobileMenuComponent = observer(() => {
  const store = useStore();
  return (
    <AnimatePresence>{store.showMobileMenu && <MobileMenu />}</AnimatePresence>
  );
});

export default MobileMenuComponent;
