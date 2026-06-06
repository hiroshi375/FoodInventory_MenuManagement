import { useCallback, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { Button, Card, FAB, Text } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { Schema } from "../../amplify/data/resource";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FoodInventory = Schema["FoodInventory"]["type"];

const getStatusLabel = (status?: string | null) => {
  switch (status) {
    case "available":
      return "利用可能";
    case "used":
      return "使用済み";
    case "expired":
      return "期限切れ";
    case "discarded":
      return "廃棄済み";
    default:
      return "未設定";
  }
};

const getStorageLocationLabel = (storageLocation?: string | null) => {
  switch (storageLocation) {
    case "fridge":
      return "冷蔵庫";
    case "freezer":
      return "冷凍庫";
    case "pantry":
      return "常温";
    default:
      return "未設定";
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "未設定";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "未設定";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

const getExpirationCardColor = (expirationDate?: string | null) => {
  if (!expirationDate) return "#ffffff";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exp = new Date(expirationDate);
  exp.setHours(0, 0, 0, 0);

  if (Number.isNaN(exp.getTime())) return "#ffffff";

  const diffDays = Math.ceil(
    (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return "#fee2e2"; // 期限切れ：薄い赤
  if (diffDays <= 3) return "#fef3c7"; // 期限近い：薄い黄色
  return "#ffffff";
};

export default function FoodInventoryScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [foods, setFoods] = useState<FoodInventory[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFoods = useCallback(async () => {
    try {
      setLoading(true);

      const appContext = await getAppContext();

      const result = await client.models.FoodInventory.list({
        filter: {
          groupId: {
            eq: appContext.defaultGroupId,
          },
        },
      });

      const sortedFoods = [...result.data].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      setFoods(sortedFoods);
    } catch (e: any) {
      console.error("loadFoods error:", e);

      if (
        e?.name === "NotAuthorizedException" ||
        String(e?.message).includes("Access Token has expired")
      ) {
        Alert.alert(
          "認証期限切れ",
          "ログイン情報の有効期限が切れています。一度サインアウトして再ログインしてください。",
        );
        return;
      }

      Alert.alert("エラー", "今ある食材の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFoods();
    }, [loadFoods]),
  );

  const onDelete = async (id: string) => {
    Alert.alert("確認", "この食材を削除しますか？", [
      {
        text: "キャンセル",
        style: "cancel",
      },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await client.models.FoodInventory.delete({ id });
            await loadFoods();
          } catch (e) {
            console.error("delete FoodInventory error:", e);
            Alert.alert("エラー", "削除に失敗しました。");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: FoodInventory }) => {
    return (
      <Card
        style={{
          marginBottom: 10,
          backgroundColor: getExpirationCardColor(item.expirationDate),
        }}
        onPress={() =>
          navigation.navigate("FoodInventoryEdit", {
            foodInventoryId: item.id,
          })
        }
      >
        <Card.Content>
          <Text variant="titleMedium">{item.ingredientsName}</Text>

          {item.description ? (
            <Text style={{ marginTop: 4 }}>{item.description}</Text>
          ) : null}

          <View style={{ marginTop: 8 }}>
            <Text>カテゴリー：{item.category || "未設定"}</Text>
            <Text>
              数量：{item.quantity ?? "未設定"} {item.unit || ""}
            </Text>
            <Text>
              保管場所：{getStorageLocationLabel(item.storageLocation)}
            </Text>
            <Text>消費期限：{formatDate(item.expirationDate)}</Text>
            <Text>購入日：{formatDate(item.purchasedDate)}</Text>
            <Text>ステータス：{getStatusLabel(item.status)}</Text>
          </View>
        </Card.Content>

        <Card.Actions>
          <Button
            onPress={() =>
              navigation.navigate("FoodInventoryEdit", {
                foodInventoryId: item.id,
              })
            }
          >
            編集
          </Button>

          <Button
            mode="contained"
            buttonColor="#5f6368"
            textColor="#ffffff"
            onPress={() => onDelete(item.id)}
          >
            削除
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text variant="headlineSmall" style={{ marginBottom: 12 }}>
          今ある食材
        </Text>

        {foods.length === 0 && !loading ? (
          <Text style={{ marginTop: 20 }}>
            今ある食材はまだ登録されていません。
          </Text>
        ) : null}

        <FlatList
          data={foods}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={loadFoods}
          contentContainerStyle={{
            paddingBottom: 80,
          }}
        />
      </View>

      <FAB
        icon="plus"
        label="追加"
        style={{
          position: "absolute",
          right: 20,
          bottom: 30,
        }}
        onPress={() => navigation.navigate("FoodInventoryEdit")}
      />
    </View>
  );
}
