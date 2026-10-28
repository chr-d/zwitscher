import { defineConfig } from "orval";

export default defineConfig({
  zwitscher: {
    input: {
      target: "./openapi.json",
    },
    output: {
      mode: "single",
      target: "./src/api/generated/zwitscher.ts",
      schemas: "./src/api/generated/models",
      client: "react-query",
      httpClient: "fetch",
      baseUrl: {
        runtime: "import.meta.env.VITE_API_BASE_URL",
      },
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
          forceSuccessResponse: true,
        },
      },
    },
  },
});
