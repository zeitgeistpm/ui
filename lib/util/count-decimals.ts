export const countDecimals = (val: number) => {
  if (Math.floor(val.valueOf()) === val.valueOf()) return 0;
  // handle very small numbers
  try {
    return val.toString().split(".")[1].length || 0;
  } catch {
    return 0;
  }
};
