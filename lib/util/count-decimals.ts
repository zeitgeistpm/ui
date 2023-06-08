export const countDecimals = (val: number) => {
  if (Math.floor(val.valueOf()) === val.valueOf()) return 0;
  return val.toString().split(".")[1].length || 0;
};
