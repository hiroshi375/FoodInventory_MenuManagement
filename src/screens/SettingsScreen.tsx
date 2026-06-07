import { Alert, ScrollView, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { signOut } from "aws-amplify/auth";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { getAppContext } from "../lib/getAppContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const goToGroupMember = async () => {
    try {
      const context = await getAppContext();

      navigation.navigate("GroupMember", {
        groupId: context.defaultGroupId,
      });
    } catch (e) {
      console.error("Go to GroupMember error:", e);
      Alert.alert("エラー", "メンバー管理画面を開けませんでした。");
    }
  };

  const onSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Sign out error:", e);
      Alert.alert("エラー", "サインアウトに失敗しました。");
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        設定
      </Text>

      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            アカウント
          </Text>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate("Profile")}
            style={{ marginBottom: 8 }}
          >
            プロフィール設定
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate("Group")}
            style={{ marginBottom: 8 }}
          >
            グループ管理
          </Button>

          <Button mode="outlined" onPress={goToGroupMember}>
            メンバー管理
          </Button>
        </Card.Content>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            アプリ
          </Text>

          <Button mode="outlined" onPress={() => navigation.replace("Home")}>
            ホームへ戻る
          </Button>
        </Card.Content>
      </Card>

      <Button mode="contained" onPress={onSignOut}>
        サインアウト
      </Button>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
