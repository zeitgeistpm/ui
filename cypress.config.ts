import { defineConfig } from "cypress";
import path from "path";

const webpackOptions = {
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      components: path.resolve(__dirname, "components"),
      lib: path.resolve(__dirname, "lib"),
      layouts: path.resolve(__dirname, "layouts"),
      pages: path.resolve(__dirname, "pages"),
      styles: path.resolve(__dirname, "styles_dist"),
    },
  },
};

export default defineConfig({
  viewportWidth: 1440,
  viewportHeight: 900,
  component: {
    defaultCommandTimeout: 10_000,
    devServer: {
      framework: "next",
      bundler: "webpack",
      webpackConfig: { ...webpackOptions },
    },
    specPattern: "**/*.cy.tsx",
  },
});
