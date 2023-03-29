import { test as base } from "@playwright/test";

const IGNORED_MESSAGES = [
  "Failed to load resource",
  "Loading initial props cancelled",
];

const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const logs = [];

    page.on("pageerror", (error) => {
      for (const ignoredMessage of IGNORED_MESSAGES) {
        if (error.message.includes(ignoredMessage)) {
          return;
        }
      }
      logs.push(error.message);
    });

    page.on("console", (consoleMessage) => {
      if (consoleMessage.type() === "error") {
        const text = consoleMessage.text();
        for (const ignoredMessage of IGNORED_MESSAGES) {
          if (text.includes(ignoredMessage)) {
            return;
          }
        }
        logs.push(text);
      }
    });

    await use(logs);
  },
});

export default test;
