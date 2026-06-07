import { defineFunction } from "@aws-amplify/backend";

export const generateGrocerySuggestion = defineFunction({
  name: "generateGrocerySuggestion",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
