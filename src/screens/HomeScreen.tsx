import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { bootstrapUser, type BootstrapResult } from "../lib/bootstrapUser";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
      <Text variant="headlineSmall" style={{ marginBottom: 8 }}>
        FoodInventory Menu Management
      </Text>

      <Text style={{ marginBottom: 16 }}>
        Default Group ID: {bootstrapData?.defaultGroupId}
      </Text>

      <View style={{ gap: 10 }}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate("CraveMenu")}
        >
          食べたいメニュー
        </Button>

        <Button
          mode="contained"
          onPress={() => navigation.navigate("FoodInventory")}
        >
          今ある食材
        </Button>

        <Button
          mode="contained"
          onPress={() => navigation.navigate("GroceryList")}
        >
          買うものリスト
        </Button>

        <Button mode="contained" onPress={() => navigation.navigate("MealLog")}>
          食事の記録
        </Button>

        <Button
          mode="contained"
          onPress={() => navigation.navigate("Calendar")}
        >
          カレンダー
        </Button>

        <Button mode="contained" onPress={() => navigation.navigate("Recipe")}>
          レシピ
        </Button>

        <Button mode="outlined" onPress={() => navigation.navigate("Profile")}>
          プロフィール
        </Button>

        <Button mode="outlined" onPress={() => navigation.navigate("Group")}>
          グループ管理
        </Button>
      </View>
    </ScrollView>
  );
}
