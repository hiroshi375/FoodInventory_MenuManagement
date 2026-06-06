import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { client } from "./client";

export type BootstrapResult = {
  userId: string;
  username: string;
  email: string;
  defaultGroupId: string;
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

  if (appUser.defaultGroupId) {
    return {
      userId,
      username,
      email,
      defaultGroupId: appUser.defaultGroupId,
      displayName: appUser.displayName,
    };
  }

  const createdGroup = await client.models.Group.create({
    name: `${email} のグループ`,
    ownerUserId: userId,
  });

  if (!createdGroup.data) {
    throw new Error("Groupの作成に失敗しました。");
  }

  const groupId = createdGroup.data.id;

  await client.models.GroupMember.create({
    groupId,
    userId: appUser.id,
    role: "owner",
    joinedAt: new Date().toISOString(),
  });

  const updatedUser = await client.models.User.update({
    id: appUser.id,
    defaultGroupId: groupId,
  });

  if (!updatedUser.data) {
    throw new Error("UserのdefaultGroupId更新に失敗しました。");
  }

  return {
    userId,
    username,
    email,
    defaultGroupId: groupId,
    displayName: appUser.displayName,
  };
}
