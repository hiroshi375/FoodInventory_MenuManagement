// amplify/functions/generateRecipeSuggestion/resource.ts
import { defineFunction } from "@aws-amplify/backend";

export const generateRecipeSuggestion = defineFunction({
  name: "generateRecipeSuggestion",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
