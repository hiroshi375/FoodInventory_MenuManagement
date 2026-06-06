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

type GroceryList = Schema["GroceryList"]["type"];

const getPriorityLabel = (priority?: number | null) => {
  if (!priority) return "未設定";
  return String(priority);
};

const getPurchasedLabel = (isPurchased?: boolean | null) => {
  return isPurchased ? "購入済み" : "未購入";
};

const getPurchasedCardColor = (isPurchased?: boolean | null) => {
  return isPurchased ? "#f3f4f6" : "#ffffff";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "未設定";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "未設定";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};

export default function GroceryListScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [items, setItems] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);

      const appContext = await getAppContext();

      const result = await client.models.GroceryList.list({
        filter: {
          groupId: {
            eq: appContext.defaultGroupId,
          },
        },
      });

      const sortedItems = [...result.data].sort((a, b) => {
        const aPurchased = a.isPurchased ? 1 : 0;
        const bPurchased = b.isPurchased ? 1 : 0;

        // 未購入を上、購入済みを下
        if (aPurchased !== bPurchased) {
          return aPurchased - bPurchased;
        }

        // 優先度が高いものを上
        const aPriority = a.priority ?? 0;
        const bPriority = b.priority ?? 0;

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        // 新しいものを上
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        return bTime - aTime;
      });

      setItems(sortedItems);
    } catch (e: any) {
      console.error("loadGroceryList error:", e);

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

      Alert.alert("エラー", "買うものリストの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  const onDelete = async (id: string) => {
    Alert.alert("確認", "この買うものリストを削除しますか？", [
      {
        text: "キャンセル",
        style: "cancel",
      },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await client.models.GroceryList.delete({ id });
            await loadItems();
          } catch (e) {
            console.error("delete GroceryList error:", e);
            Alert.alert("エラー", "削除に失敗しました。");
          }
        },
      },
    ]);
  };

  const onTogglePurchased = async (item: GroceryList) => {
    try {
      setLoading(true);

      const appContext = await getAppContext();

      const nextPurchased = !item.isPurchased;

      await client.models.GroceryList.update({
        id: item.id,
        isPurchased: nextPurchased,
        purchasedAt: nextPurchased ? new Date().toISOString() : null,
        purchasedByUserId: nextPurchased ? appContext.cognitoUserId : null,
      });

      await loadItems();
    } catch (e) {
      console.error("toggle purchased error:", e);
      Alert.alert("エラー", "購入状態の更新に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: GroceryList }) => {
    return (
      <Card
        style={{
          marginBottom: 10,
          backgroundColor: getPurchasedCardColor(item.isPurchased),
          opacity: item.isPurchased ? 0.75 : 1,
        }}
        onPress={() =>
          navigation.navigate("GroceryListEdit", {
            groceryListId: item.id,
          })
        }
      >
        <Card.Content>
          <Text variant="titleMedium">{item.itemName}</Text>

          {item.description ? (
            <Text style={{ marginTop: 4 }}>{item.description}</Text>
          ) : null}

          <View style={{ marginTop: 8 }}>
            <Text>カテゴリー：{item.category || "未設定"}</Text>
            <Text>
              数量：{item.quantity ?? "未設定"} {item.unit || ""}
            </Text>
            <Text>優先度：{getPriorityLabel(item.priority)}</Text>
            <Text>状態：{getPurchasedLabel(item.isPurchased)}</Text>
            <Text>購入日時：{formatDateTime(item.purchasedAt)}</Text>
          </View>
        </Card.Content>

        <Card.Actions>
          <Button
            mode={item.isPurchased ? "outlined" : "contained"}
            buttonColor={item.isPurchased ? undefined : "#60a5fa"}
            textColor={item.isPurchased ? "#2563eb" : "#ffffff"}
            onPress={() => onTogglePurchased(item)}
          >
            {item.isPurchased ? "未購入に戻す" : "購入済みにする"}
          </Button>

          <Button
            mode="contained"
            buttonColor="#f0f0f0"
            textColor="#000000"
            onPress={() =>
              navigation.navigate("GroceryListEdit", {
                groceryListId: item.id,
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
          買うものリスト
        </Text>

        {items.length === 0 && !loading ? (
          <Text style={{ marginTop: 20 }}>
            買うものリストはまだ登録されていません。
          </Text>
        ) : null}

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={loadItems}
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
        onPress={() => navigation.navigate("GroceryListEdit")}
      />
    </View>
  );
}
