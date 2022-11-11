export const shouldScrollTop = (
  currentPathname: string,
  previousPathname: string,
) => {
  const prevPaths = previousPathname.split("/");
  const currentPaths = currentPathname.split("/");

  //previous path was a child of the current path
  if (prevPaths[1] === currentPaths[1]) {
    return false;
  }

  //navigating from market to index
  if (currentPathname === "/" && prevPaths[1] === "markets") {
    return false;
  }

  return true;
};
