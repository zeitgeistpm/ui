export const generateGUID = () => {
  return (
    S4() +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  );
};

const S4 = () =>
  (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
