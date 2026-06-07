import { useCallback, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Text,
} from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FoodItem = {
  id: string;
  ingredientsName: string;
  category?: string | null;
  quantity?: number | null;
  unit?: string | null;
  storageLocation?: string | null;
  expirationDate?: string | null;
  status?: string | null;
};

export default function ExpirationListScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FoodItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, []),
  );

  const toDateText = (value?: string | null) => {
    if (!value) return "";
    return value.slice(0, 10);
  };

  const getDaysLeft = (value?: string | null) => {
    if (!value) return null;

    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const target = new Date(`${toDateText(value)}T00:00:00`);
    const diffMs = target.getTime() - todayDate.getTime();

    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const getStatusLabel = (daysLeft: number | null) => {
    if (daysLeft == null) return "期限未設定";
    if (daysLeft < 0) return "期限切れ";
    if (daysLeft === 0) return "今日まで";
    if (daysLeft <= 3) return `あと${daysLeft}日`;
    if (daysLeft <= 7) return `あと${daysLeft}日`;
    return `あと${daysLeft}日`;
  };

  const getStatusColor = (daysLeft: number | null) => {
    if (daysLeft == null) return "#9ca3af";
    if (daysLeft < 0) return "#ef4444";
    if (daysLeft <= 3) return "#f97316";
    if (daysLeft <= 7) return "#eab308";
    return "#22c55e";
  };

  const loadItems = async () => {
    try {
      setLoading(true);

      const context = await getAppContext();

      const result = await client.models.FoodInventory.list({
        filter: {
          groupId: {
            eq: context.defaultGroupId,
          },
        },
      });

      const sorted = (result.data ?? [])
        .filter((item) => item.status !== "used" && item.status !== "discarded")
        .sort((a, b) => {
          const aDays = getDaysLeft(a.expirationDate);
          const bDays = getDaysLeft(b.expirationDate);

          if (aDays == null && bDays == null) return 0;
          if (aDays == null) return 1;
          if (bDays == null) return -1;

          return aDays - bDays;
        });

      setItems(sorted as FoodItem[]);
    } catch (e) {
      console.error("Expiration list load error:", e);
      Alert.alert("エラー", "期限一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        期限一覧
      </Text>

      {items.length === 0 ? (
        <Card>
          <Card.Content>
            <Text>表示する食材がありません。</Text>
          </Card.Content>
        </Card>
      ) : (
        items.map((item) => {
          const daysLeft = getDaysLeft(item.expirationDate);
          const statusColor = getStatusColor(daysLeft);

          return (
            <Card
              key={item.id}
              style={{ marginBottom: 12 }}
              onPress={() =>
                navigation.navigate("FoodInventoryEdit", {
                  foodInventoryId: item.id,
                })
              }
            >
              <Card.Content>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <Text variant="titleMedium" style={{ flex: 1 }}>
                    {item.ingredientsName}
                  </Text>

                  <Chip
                    textStyle={{ color: "white" }}
                    style={{ backgroundColor: statusColor }}
                  >
                    {getStatusLabel(daysLeft)}
                  </Chip>
                </View>

                <Text style={{ marginTop: 8 }}>
                  期限日：{toDateText(item.expirationDate) || "未設定"}
                </Text>

                <Text style={{ marginTop: 4 }}>
                  数量：
                  {item.quantity != null
                    ? `${item.quantity}${item.unit ?? ""}`
                    : "未設定"}
                </Text>

                {item.storageLocation ? (
                  <Text style={{ marginTop: 4 }}>
                    保管場所：{item.storageLocation}
                  </Text>
                ) : null}

                {item.category ? (
                  <Text style={{ marginTop: 4 }}>
                    カテゴリー：{item.category}
                  </Text>
                ) : null}
              </Card.Content>
            </Card>
          );
        })
      )}

      <Button mode="outlined" onPress={loadItems} style={{ marginTop: 8 }}>
        再読み込み
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 12 }}
      >
        戻る
      </Button>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
