import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { generateRecipeSuggestion } from "./functions/generateRecipeSuggestion/resource";
import { generateGrocerySuggestion } from "./functions/generateGrocerySuggestion/resource";
import * as iam from "aws-cdk-lib/aws-iam";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  generateRecipeSuggestion,
  generateGrocerySuggestion,
});

backend.generateRecipeSuggestion.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: ["*"],
  }),
);

backend.generateGrocerySuggestion.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: ["*"],
  }),
);
