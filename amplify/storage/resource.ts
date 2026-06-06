import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "foodInventoryMenuStorage",
  access: (allow) => ({
    "profilePhoto/*": [allow.authenticated.to(["read", "write", "delete"])],
    "menuImage/*": [allow.authenticated.to(["read", "write", "delete"])],
    "ingredientsImage/*": [allow.authenticated.to(["read", "write", "delete"])],
  }),
});
