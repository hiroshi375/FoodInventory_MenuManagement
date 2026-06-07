import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  RadioButton,
  Text,
  TextInput,
} from "react-native-paper";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { client } from "../lib/client";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { Schema } from "../../amplify/data/resource";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

type Group = Schema["Group"]["type"];
type AppUser = Schema["User"]["type"];

export default function ProfileScreen({ navigation }: Props) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [displayName, setDisplayName] = useState("");

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [useNewGroup, setUseNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      const currentUsername = currentUser.username;
      const currentEmail = attributes.email ?? "";

      setUsername(currentUsername);
      setEmail(currentEmail);

      const userResult = await client.models.User.list({
        filter: {
          username: {
            eq: currentUsername,
          },
        },
      });

      let currentAppUser = userResult.data[0];

      if (!currentAppUser) {
        const createdUser = await client.models.User.create({
          username: currentUsername,
          email: currentEmail,
          displayName: "",
          lastLoginAt: new Date().toISOString(),
        });

        if (!createdUser.data) {
          console.log("User create errors:", createdUser.errors);
          throw new Error("User create failed");
        }

        currentAppUser = createdUser.data;
      }

      setAppUser(currentAppUser);
      setDisplayName(currentAppUser.displayName ?? "");
      setSelectedGroupId(currentAppUser.defaultGroupId ?? "");

      const groupResult = await client.models.Group.list();

      const sortedGroups = [...groupResult.data].sort((a, b) =>
        a.name.localeCompare(b.name, "ja"),
      );

      setGroups(sortedGroups);
    } catch (e) {
      console.error("loadProfile error:", e);
      Alert.alert("エラー", "プロフィール情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = async () => {
    try {
      if (!appUser) {
        Alert.alert("エラー", "ユーザー情報を取得できていません。");
        return;
      }

      if (!displayName.trim()) {
        Alert.alert("入力エラー", "表示名を入力してください。");
        return;
      }

      if (useNewGroup && !newGroupName.trim()) {
        Alert.alert("入力エラー", "新しいグループ名を入力してください。");
        return;
      }

      if (!useNewGroup && !selectedGroupId) {
        Alert.alert("入力エラー", "参加するグループを選択してください。");
        return;
      }

      setSaving(true);

      let groupId = selectedGroupId;
      let memberRole = "member";

      if (useNewGroup) {
        const createdGroup = await client.models.Group.create({
          name: newGroupName.trim(),
          ownerUserId: appUser.id,
        });

        if (!createdGroup.data) {
          console.log("Group create errors:", createdGroup.errors);
          throw new Error("Group create failed");
        }

        groupId = createdGroup.data.id;
        memberRole = "owner";
      }

      if (!groupId) {
        Alert.alert("入力エラー", "グループを選択してください。");
        return;
      }

      const memberResult = await client.models.GroupMember.list({
        filter: {
          groupId: {
            eq: groupId,
          },
        },
      });

      const alreadyMember = memberResult.data.some((member) => {
        return member.userId === appUser.id || member.userId === username;
      });

      if (!alreadyMember) {
        await client.models.GroupMember.create({
          groupId,
          userId: appUser.id,
          role: memberRole,
          joinedAt: new Date().toISOString(),
        });
      }
      console.log("Profile save groupId:", groupId);
      console.log("Profile save appUser.id:", appUser.id);
      console.log("Profile save username:", username);
      console.log("Profile save memberRole:", memberRole);

      const updatedUser = await client.models.User.update({
        id: appUser.id,
        displayName: displayName.trim(),
        defaultGroupId: groupId,
        lastLoginAt: new Date().toISOString(),
      });

      if (!updatedUser.data) {
        console.log("User update errors:", updatedUser.errors);
        throw new Error("User update failed");
      }

      Alert.alert("保存しました", "プロフィールを保存しました。");

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (e) {
      console.error("saveProfile error:", e);
      Alert.alert("エラー", "プロフィールの保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        プロフィール設定
      </Text>

      <TextInput
        label="メールアドレス"
        value={email}
        mode="outlined"
        editable={false}
        textColor="#666"
        style={{ marginBottom: 12, backgroundColor: "#f2f2f2" }}
      />

      <TextInput
        label="表示名"
        value={displayName}
        onChangeText={setDisplayName}
        mode="outlined"
        style={{ marginBottom: 16 }}
        placeholder="例：ひろし"
      />

      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            グループ設定
          </Text>

          <RadioButton.Group
            onValueChange={(value) => {
              setUseNewGroup(value === "new");
            }}
            value={useNewGroup ? "new" : "existing"}
          >
            <RadioButton.Item label="既存グループに参加する" value="existing" />
            <RadioButton.Item label="新しいグループを作成する" value="new" />
          </RadioButton.Group>

          {!useNewGroup ? (
            <View style={{ marginTop: 8 }}>
              {groups.length === 0 ? (
                <Text style={{ color: "#666" }}>
                  選択できるグループがありません。新しいグループを作成してください。
                </Text>
              ) : (
                groups.map((group) => (
                  <Card
                    key={group.id}
                    style={{
                      marginBottom: 8,
                      backgroundColor:
                        selectedGroupId === group.id ? "#e0f2fe" : "#ffffff",
                    }}
                    onPress={() => setSelectedGroupId(group.id)}
                  >
                    <Card.Content
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <RadioButton
                        value={group.id}
                        status={
                          selectedGroupId === group.id ? "checked" : "unchecked"
                        }
                        onPress={() => setSelectedGroupId(group.id)}
                      />
                      <Text style={{ flex: 1 }}>{group.name}</Text>
                    </Card.Content>
                  </Card>
                ))
              )}
            </View>
          ) : (
            <TextInput
              label="新しいグループ名"
              value={newGroupName}
              onChangeText={setNewGroupName}
              mode="outlined"
              style={{ marginTop: 12 }}
              placeholder="例：佐藤家"
            />
          )}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={saveProfile}
        loading={saving}
        disabled={saving}
      >
        保存
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        disabled={saving}
        style={{ marginTop: 12 }}
      >
        戻る
      </Button>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
