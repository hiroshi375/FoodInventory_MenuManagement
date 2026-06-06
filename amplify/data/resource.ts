import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update",
and "delete" any "Todo" records.
=========================================================================*/
const schema = a
  .schema({
    Group: a.model({
      name: a.string().required(),
      ownerUserId: a.string().required(),
    }),

    GroupMember: a.model({
      groupId: a.id().required(),
      userId: a.string().required(),
      role: a.string().required(), // owner / admin / member
      joinedAt: a.datetime(),
    }),

    User: a.model({
      username: a.string().required(),
      email: a.email().required(),
      displayName: a.string(),
      photoUrl: a.string(),
      defaultGroupId: a.id(),
      dailyCalorieGoal: a.integer(),
      defaultMealType: a.string(), // breakfast / lunch / dinner / snack
      lastLoginAt: a.datetime(),
    }),

    CraveMenuList: a.model({
      groupId: a.id().required(),
      createdByUserId: a.string().required(),

      menuName: a.string().required(),
      description: a.string(),
      category: a.string(),
      priority: a.integer(),
      cravingReason: a.string(),
      recipeId: a.id(),

      menuImageUrl: a.string(),
      status: a.string(), // active / cooked / archived
    }),

    FoodInventory: a.model({
      groupId: a.id().required(),
      createdByUserId: a.string().required(),

      ingredientsName: a.string().required(),
      category: a.string(),
      quantity: a.float(),
      unit: a.string(),
      storageLocation: a.string(), // fridge / freezer / pantry
      description: a.string(),
      expirationDate: a.date(),
      purchasedDate: a.date(),
      ingredientsImageUrl: a.string(),
      status: a.string(), // available / used / expired / discarded
    }),

    GroceryList: a.model({
      groupId: a.id().required(),
      createdByUserId: a.string().required(),

      itemName: a.string().required(),
      category: a.string(),
      quantity: a.float(),
      unit: a.string(),
      description: a.string(),

      isPurchased: a.boolean(),
      purchasedAt: a.datetime(),
      purchasedByUserId: a.string(),

      priority: a.integer(),
      relatedRecipeId: a.id(),
      relatedCraveMenuId: a.id(),
    }),

    MealLog: a.model({
      groupId: a.id().required(),
      createdByUserId: a.string().required(),
      targetUserId: a.string(),

      mealDate: a.datetime().required(),
      mealType: a.string().required(), // breakfast / lunch / dinner / snack
      menuName: a.string().required(),
      menuImageUrl: a.string(),

      comment: a.string(),

      calories: a.integer(),
      protein: a.float(),
      fat: a.float(),
      carbs: a.float(),

      recipeId: a.id(),
      craveMenuId: a.id(),
    }),

    Calendar: a.model({
      groupId: a.id().required(),
      createdByUserId: a.string().required(),

      date: a.date().required(),
      mealType: a.string(),
      title: a.string().required(),
      type: a.string().required(), // plan / log / shopping / expiration

      targetUserId: a.string(),

      recipeId: a.id(),
      mealLogId: a.id(),
      foodInventoryId: a.id(),
      groceryListId: a.id(),

      description: a.string(),
    }),

    Recipe: a.model({
      groupId: a.id().required(),
      createdByUserId: a.string().required(),

      title: a.string().required(),
      description: a.string(),
      category: a.string(),

      cookingTimeMinutes: a.integer(),
      servings: a.integer(),

      ingredients: a.json(),
      steps: a.json(),

      calories: a.integer(),
      protein: a.float(),
      fat: a.float(),
      carbs: a.float(),

      imageUrl: a.string(),
      sourceUrl: a.string(),
      isFavorite: a.boolean(),
    }),
  })
  .authorization((allow) => [allow.authenticated()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
