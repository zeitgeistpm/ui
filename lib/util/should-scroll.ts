export const shouldScrollTop = (
  currentPathname?: string,
  previousPathname?: string,
) => {
  if (currentPathname == null || previousPathname == null) {
    return false;
  }

  const prevPaths = previousPathname.split("/");
  const currentPaths = currentPathname.split("/");

  if (currentPaths?.[2] === "[marketid]") {
    return true;
  }

  // navigating from market to index and markets pages
  if (
    (currentPathname === "/" || currentPathname === "/markets") &&
    prevPaths[1] === "markets" &&
    prevPaths[2] === "[marketid]"
  ) {
    return false;
  }

  if (prevPaths[1] === currentPaths[1]) {
    //previous path was a child of the current path
    return false;
  }

  return true;
};
