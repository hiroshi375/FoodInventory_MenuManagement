import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { client } from "./client";
import { bootstrapUser } from "./bootstrapUser";

export type AppContext = {
  cognitoUserId: string;
  username: string;
  email: string;

  // Userモデル側のid
  appUserId: string;

  // 現在利用する共有グループID
  defaultGroupId: string;
};

export async function getAppContext(): Promise<AppContext> {
  const currentUser = await getCurrentUser();
  const attributes = await fetchUserAttributes();

  const cognitoUserId = currentUser.userId;
  const username = currentUser.username;
  const email = attributes.email ?? "";

  if (!email) {
    throw new Error("メールアドレスを取得できませんでした。");
  }

  const usersResult = await client.models.User.list({
    filter: {
      username: {
        eq: username,
      },
    },
  });

  let appUser = usersResult.data[0];

  // User / Group / GroupMember がまだ無い場合は作成する
  if (!appUser || !appUser.defaultGroupId) {
    await bootstrapUser();

    const retryUsersResult = await client.models.User.list({
      filter: {
        username: {
          eq: username,
        },
      },
    });

    appUser = retryUsersResult.data[0];
  }

  if (!appUser) {
    throw new Error("User情報を取得できませんでした。");
  }

  if (!appUser.defaultGroupId) {
    throw new Error("defaultGroupIdを取得できませんでした。");
  }

  return {
    cognitoUserId,
    username,
    email,
    appUserId: appUser.id,
    defaultGroupId: appUser.defaultGroupId,
  };
}
