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

type MealLog = Schema["MealLog"]["type"];

const getMealTypeLabel = (mealType?: string | null) => {
  switch (mealType) {
    case "breakfast":
      return "朝食";
    case "lunch":
      return "昼食";
    case "dinner":
      return "夕食";
    case "snack":
      return "間食";
    default:
      return "未設定";
  }
};

const getMealTypeCardColor = (mealType?: string | null) => {
  switch (mealType) {
    case "breakfast":
      return "#eff6ff"; // 薄い青
    case "lunch":
      return "#f0fdf4"; // 薄い緑
    case "dinner":
      return "#fef3c7"; // 薄い黄
    case "snack":
      return "#fdf2f8"; // 薄いピンク
    default:
      return "#ffffff";
  }
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

const formatNumber = (value?: number | null) => {
  if (value == null) return "未設定";
  return String(value);
};

export default function MealLogScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMealLogs = useCallback(async () => {
    try {
      setLoading(true);

      const appContext = await getAppContext();

      const result = await client.models.MealLog.list({
        filter: {
          groupId: {
            eq: appContext.defaultGroupId,
          },
        },
      });

      const sortedMealLogs = [...result.data].sort((a, b) => {
        const aTime = a.mealDate ? new Date(a.mealDate).getTime() : 0;
        const bTime = b.mealDate ? new Date(b.mealDate).getTime() : 0;
        return bTime - aTime;
      });

      setMealLogs(sortedMealLogs);
    } catch (e: any) {
      console.error("loadMealLogs error:", e);

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

      Alert.alert("エラー", "食事記録の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMealLogs();
    }, [loadMealLogs]),
  );

  const onDelete = async (id: string) => {
    Alert.alert("確認", "この食事記録を削除しますか？", [
      {
        text: "キャンセル",
        style: "cancel",
      },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await client.models.MealLog.delete({ id });
            await loadMealLogs();
          } catch (e) {
            console.error("delete MealLog error:", e);
            Alert.alert("エラー", "削除に失敗しました。");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: MealLog }) => {
    return (
      <Card
        style={{
          marginBottom: 10,
          backgroundColor: getMealTypeCardColor(item.mealType),
        }}
        onPress={() =>
          navigation.navigate("MealLogEdit", {
            mealLogId: item.id,
          })
        }
      >
        <Card.Content>
          <Text variant="titleMedium">{item.menuName}</Text>

          {item.comment ? (
            <Text style={{ marginTop: 4 }}>{item.comment}</Text>
          ) : null}

          <View style={{ marginTop: 8 }}>
            <Text>食事日時：{formatDateTime(item.mealDate)}</Text>
            <Text>食事種別：{getMealTypeLabel(item.mealType)}</Text>
            <Text>カロリー：{formatNumber(item.calories)} kcal</Text>
            <Text>
              PFC：たんぱく質 {formatNumber(item.protein)} g / 脂質{" "}
              {formatNumber(item.fat)} g / 炭水化物 {formatNumber(item.carbs)} g
            </Text>
          </View>
        </Card.Content>

        <Card.Actions>
          <Button
            onPress={() =>
              navigation.navigate("MealLogEdit", {
                mealLogId: item.id,
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
          食事の記録
        </Text>

        {mealLogs.length === 0 && !loading ? (
          <Text style={{ marginTop: 20 }}>
            食事の記録はまだ登録されていません。
          </Text>
        ) : null}

        <FlatList
          data={mealLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={loadMealLogs}
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
        onPress={() => navigation.navigate("MealLogEdit")}
      />
    </View>
  );
}
