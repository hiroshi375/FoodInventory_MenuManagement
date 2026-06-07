import { defineFunction } from "@aws-amplify/backend";

export const analyzeMealPhoto = defineFunction({
  name: "analyzeMealPhoto",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
