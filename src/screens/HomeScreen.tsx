import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Card, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { bootstrapUser, type BootstrapResult } from "../lib/bootstrapUser";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type MenuItem = {
  title: string;
  description: string;
  screenName: keyof RootStackParamList;
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(true);
  const [bootstrapData, setBootstrapData] = useState<BootstrapResult | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const setup = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const result = await bootstrapUser();
        setBootstrapData(result);
      } catch (e) {
        console.error("bootstrapUser error:", e);
        setErrorMessage("初期設定に失敗しました。ログを確認してください。");
      } finally {
        setLoading(false);
      }
    };

    setup();
  }, []);

  const mainMenus: MenuItem[] = [
    {
      title: "食べたいメニュー",
      description: "食べたい料理を登録・確認します。",
      screenName: "CraveMenu",
    },
    {
      title: "今ある食材",
      description: "冷蔵庫や保存食材を管理します。",
      screenName: "FoodInventory",
    },
    {
      title: "買うものリスト",
      description: "買い物予定の食材を管理します。",
      screenName: "GroceryList",
    },
    {
      title: "食事の記録",
      description: "実際に食べたメニューを記録します。",
      screenName: "MealLog",
    },
    {
      title: "レシピ",
      description: "登録済みレシピを確認・編集します。",
      screenName: "Recipe",
    },
    {
      title: "カレンダー",
      description: "食事・期限・買い物予定を日付で確認します。",
      screenName: "Calendar",
    },
  ];

  const supportMenus: MenuItem[] = [
    {
      title: "期限一覧",
      description: "期限が近い食材を確認します。",
      screenName: "ExpirationList",
    },
    {
      title: "買うもの自動提案",
      description: "在庫や食事予定から買うものを提案します。",
      screenName: "GrocerySuggestion",
    },
    {
      title: "レシピAI提案",
      description: "食材や希望メニューからレシピを提案します。",
      screenName: "RecipeSuggestion",
    },
    {
      title: "食事写真AI解析",
      description: "食事写真から内容を解析します。",
      screenName: "MealPhotoAnalysis",
    },
  ];

  const settingMenus: MenuItem[] = [
    {
      title: "プロフィール",
      description: "ユーザー情報を確認します。",
      screenName: "Profile",
    },
    {
      title: "グループ管理",
      description: "共有グループを管理します。",
      screenName: "Group",
    },
  ];

  const renderMenuCard = (item: MenuItem) => (
    <Card
      key={item.screenName}
      style={{ marginBottom: 10 }}
      onPress={() => navigation.navigate(item.screenName as never)}
    >
      <Card.Content>
        <Text variant="titleMedium">{item.title}</Text>
        <Text style={{ marginTop: 4 }}>{item.description}</Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          padding: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>初期設定中...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View
        style={{
          flex: 1,
          padding: 16,
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "red", marginBottom: 16 }}>{errorMessage}</Text>

        <Button mode="contained" onPress={() => navigation.replace("Home")}>
          再読み込み
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 4 }}>
        FoodInventory Menu Management
      </Text>

      <Text style={{ marginBottom: 16 }}>
        食材・買い物・食事・レシピをまとめて管理します。
      </Text>

      <Text variant="titleMedium" style={{ marginBottom: 8 }}>
        主要メニュー
      </Text>
      {mainMenus.map(renderMenuCard)}

      <Text variant="titleMedium" style={{ marginTop: 12, marginBottom: 8 }}>
        便利機能
      </Text>
      {supportMenus.map(renderMenuCard)}

      <Text variant="titleMedium" style={{ marginTop: 12, marginBottom: 8 }}>
        設定
      </Text>
      {settingMenus.map(renderMenuCard)}

      <Text
        style={{
          marginTop: 16,
          color: "#777",
          fontSize: 12,
        }}
      >
        Default Group ID: {bootstrapData?.defaultGroupId}
      </Text>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
