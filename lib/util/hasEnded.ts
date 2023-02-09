//endTime must be in milliseconds from getTime() format
export const hasEnded = (endTime: number) => {
  const currentTime = new Date();
  const diff = endTime - currentTime.getTime();
  return diff < 0;
};
