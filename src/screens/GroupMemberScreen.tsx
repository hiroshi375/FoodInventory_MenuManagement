import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Card, Text } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { client } from "../lib/client";

type Props = NativeStackScreenProps<RootStackParamList, "GroupMember">;

type GroupMemberItem = {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt?: string | null;
};

type UserItem = {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
};

type MemberDisplayItem = {
  id: string;
  userId: string;
  role: string;
  joinedAt?: string | null;
  displayName: string;
  email: string;
};

export default function GroupMemberScreen({ route, navigation }: Props) {
  const { groupId } = route.params;

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberDisplayItem[]>([]);

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    try {
      setLoading(true);

      const memberResult = await client.models.GroupMember.list({
        filter: {
          groupId: {
            eq: groupId,
          },
        },
      });

      const userResult = await client.models.User.list();

      const users = (userResult.data ?? []) as UserItem[];

      const memberItems = (memberResult.data ?? []) as GroupMemberItem[];
      console.log("=== GroupMember debug ===");
      console.log("groupId:", groupId);
      console.log("memberItems:", memberItems);
      console.log(
        "users:",
        users.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          displayName: u.displayName,
        })),
      );
      const displayMembers: MemberDisplayItem[] = memberItems.map((member) => {
        const user =
          users.find((u) => u.id === member.userId) ??
          users.find((u) => u.username === member.userId);

        console.log("member.userId:", member.userId);
        console.log("matched user:", user);

        return {
          id: member.id,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
          displayName: user?.displayName || "表示名未設定",
          email: user?.email || "",
        };
      });

      const sortedMembers = displayMembers.sort((a, b) => {
        const aDate = a.joinedAt ?? "";
        const bDate = b.joinedAt ?? "";
        return aDate.localeCompare(bDate);
      });

      setMembers(sortedMembers);
    } catch (e) {
      console.error("Group member load error:", e);
      Alert.alert("エラー", "メンバー情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === "owner") return "所有者";
    if (role === "admin") return "管理者";
    if (role === "member") return "メンバー";
    return role;
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "未設定";
    return value.slice(0, 10);
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        メンバー管理
      </Text>

      <Text style={{ marginBottom: 12, color: "#777", fontSize: 12 }}>
        Group ID: {groupId}
      </Text>

      {members.length === 0 ? (
        <Card style={{ marginBottom: 12 }}>
          <Card.Content>
            <Text>メンバーが登録されていません。</Text>
          </Card.Content>
        </Card>
      ) : (
        members.map((member) => (
          <Card key={member.id} style={{ marginBottom: 12 }}>
            <Card.Content>
              <Text variant="titleMedium">{getRoleLabel(member.role)}</Text>

              <Text style={{ marginTop: 8 }}>
                ユーザー: {member.displayName}
              </Text>
              {member.email ? (
                <Text style={{ marginTop: 4 }}>{member.email}</Text>
              ) : null}

              <Text style={{ marginTop: 4 }}>
                参加日: {formatDate(member.joinedAt)}
              </Text>
            </Card.Content>
          </Card>
        ))
      )}

      <Button
        mode="outlined"
        onPress={loadMembers}
        style={{ marginTop: 8, marginBottom: 12 }}
      >
        再読み込み
      </Button>

      <Button mode="outlined" onPress={() => navigation.goBack()}>
        戻る
      </Button>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
