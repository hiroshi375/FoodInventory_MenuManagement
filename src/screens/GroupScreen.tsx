import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  TextInput,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type GroupItem = {
  id: string;
  name: string;
  ownerUserId: string;
};

export default function GroupScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [group, setGroup] = useState<GroupItem | null>(null);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    loadGroup();
  }, []);

  const loadGroup = async () => {
    try {
      setLoading(true);

      const context = await getAppContext();

      const result = await client.models.Group.get({
        id: context.defaultGroupId,
      });

      if (result.data) {
        setGroup(result.data);
        setGroupName(result.data.name ?? "");
      }
    } catch (e) {
      console.error("Group load error:", e);
      Alert.alert("エラー", "グループ情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    try {
      if (!group) return;

      if (!groupName.trim()) {
        Alert.alert("入力エラー", "グループ名を入力してください。");
        return;
      }

      setSaving(true);

      const result = await client.models.Group.update({
        id: group.id,
        name: groupName.trim(),
      });

      if (result.data) {
        setGroup(result.data);
      }

      Alert.alert("保存しました", "グループ名を保存しました。");
    } catch (e) {
      console.error("Group save error:", e);
      Alert.alert("エラー", "グループ情報の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  if (!group) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>グループ情報が見つかりませんでした。</Text>

        <Button
          mode="outlined"
          style={{ marginTop: 16 }}
          onPress={() => navigation.replace("Home")}
        >
          ホームへ戻る
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        グループ管理
      </Text>

      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            現在のグループ
          </Text>

          <TextInput
            label="グループ名"
            value={groupName}
            onChangeText={setGroupName}
            mode="outlined"
            style={{ marginBottom: 12 }}
          />

          <Text style={{ color: "#777", fontSize: 12 }}>
            Group ID: {group.id}
          </Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={onSave}
        loading={saving}
        disabled={saving}
        style={{ marginBottom: 12 }}
      >
        保存
      </Button>

      <Button
        mode="outlined"
        onPress={() =>
          navigation.navigate("GroupMember", {
            groupId: group.id,
          })
        }
        style={{ marginBottom: 12 }}
      >
        メンバー管理
      </Button>

      <Button mode="outlined" onPress={() => navigation.replace("Home")}>
        ホームへ戻る
      </Button>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
