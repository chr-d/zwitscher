import { defineConfig } from "orval";

export default defineConfig({
  zwitscher: {
    input: {
      target: process.env.CI
        ? "./openapi.json"
        : ["http://localhost:5080/openapi/v1.json", "./openapi.json"],
    },
    output: {
      mode: "tags-split",
      target: "./src/api/generated/zwitscher.ts",
      schemas: "./src/api/generated/models",
      client: "react-query",
      httpClient: "fetch",
      formatter: "prettier",
      clean: true,
      indexFiles: true,
      tagsSplitDeduplication: true,
      baseUrl: {
        runtime: "import.meta.env.VITE_API_BASE_URL",
      },
      override: {
        query: {
          signal: true,
        },
        fetch: {
          includeHttpResponseReturnType: false,
          forceSuccessResponse: true,
        },
      },
    },
  },
});
