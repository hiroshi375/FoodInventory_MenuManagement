import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Text, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [appUserId, setAppUserId] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const context = await getAppContext();

      setAppUserId(context.appUserId);
      setEmail(context.email);

      const userResult = await client.models.User.get({
        id: context.appUserId,
      });

      if (userResult.data) {
        setDisplayName(userResult.data.displayName ?? "");
      }
    } catch (e) {
      console.error("Profile load error:", e);
      Alert.alert("エラー", "プロフィールの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    try {
      if (!displayName.trim()) {
        Alert.alert("入力エラー", "表示名を入力してください。");
        return;
      }

      setSaving(true);

      await client.models.User.update({
        id: appUserId,
        displayName: displayName.trim(),
      });

      Alert.alert("保存しました", "プロフィールを保存しました。");

      navigation.replace("Home");
    } catch (e) {
      console.error("Profile save error:", e);
      Alert.alert("エラー", "プロフィールの保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        プロフィール設定
      </Text>

      <Text style={{ marginBottom: 8 }}>ログインユーザー</Text>

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
        style={{ marginBottom: 20 }}
        placeholder="例：佐藤"
      />

      <Button
        mode="contained"
        onPress={onSave}
        loading={saving}
        disabled={saving}
      >
        保存
      </Button>

      {displayName.trim() ? (
        <Button
          mode="outlined"
          onPress={() => navigation.replace("Home")}
          style={{ marginTop: 12 }}
        >
          戻る
        </Button>
      ) : null}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
