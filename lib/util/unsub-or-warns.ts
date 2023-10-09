export const unsubOrWarns = (unsub: () => void) => {
  if (unsub) {
    unsub();
  } else {
    console.warn(
      "Failing to unsubscribe from subscriptions could lead to memory bloat",
    );
  }
};
