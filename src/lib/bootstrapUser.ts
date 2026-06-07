import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { client } from "./client";

export type BootstrapResult = {
  userId: string;
  username: string;
  email: string;
  defaultGroupId?: string | null;
  displayName?: string | null;
};

export async function bootstrapUser(): Promise<BootstrapResult> {
  const currentUser = await getCurrentUser();
  const attributes = await fetchUserAttributes();

  const userId = currentUser.userId;
  const username = currentUser.username;
  const email = attributes.email ?? "";

  if (!email) {
    throw new Error("メールアドレスを取得できませんでした。");
  }

  const existingUsers = await client.models.User.list({
    filter: {
      username: {
        eq: username,
      },
    },
  });

  let appUser = existingUsers.data[0];

  if (!appUser) {
    const createdUser = await client.models.User.create({
      username,
      email,
      displayName: "",
      lastLoginAt: new Date().toISOString(),
      // defaultGroupId はここでは設定しない
      // ProfileScreen でグループ選択または新規作成後に設定する
    });

    if (!createdUser.data) {
      throw new Error("Userの作成に失敗しました。");
    }

    appUser = createdUser.data;
  } else {
    const updatedLoginUser = await client.models.User.update({
      id: appUser.id,
      lastLoginAt: new Date().toISOString(),
    });

    if (updatedLoginUser.data) {
      appUser = updatedLoginUser.data;
    }
  }

  return {
    userId,
    username,
    email,
    defaultGroupId: appUser.defaultGroupId,
    displayName: appUser.displayName,
  };
}
