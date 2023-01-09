import { test as base } from "@playwright/test";

const IGNORED_MESSAGES = [];

const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const logs = [];

    page.on("pageerror", (error) => {
      if (IGNORED_MESSAGES.includes(error.message)) {
        return;
      }
      logs.push(error.message);
    });

    page.on("console", (consoleMessage) => {
      if (consoleMessage.type() === "error") {
        const text = consoleMessage.text();
        if (IGNORED_MESSAGES.includes(text)) {
          return;
        }
        logs.push(text);
      }
    });

    await use(logs);
  },
});

export default test;
