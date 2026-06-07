import { useCallback, useState } from "react";
import { Alert, FlatList, View, Image } from "react-native";
import { Card, FAB, Text } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { Schema } from "../../amplify/data/resource";
import { getUrl } from "aws-amplify/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type MealLog = Schema["MealLog"]["type"];

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

const formatMealType = (value?: string | null) => {
  switch (value) {
    case "breakfast":
      return "朝食";
    case "lunch":
      return "昼食";
    case "dinner":
      return "夕食";
    case "snack":
      return "間食";
    default:
      return value ?? "";
  }
};

const hasNutrition = (item: {
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
}) => {
  return (
    (item.calories !== null && item.calories !== undefined) ||
    (item.protein !== null && item.protein !== undefined) ||
    (item.fat !== null && item.fat !== undefined) ||
    (item.carbs !== null && item.carbs !== undefined)
  );
};

export default function MealLogScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({}); // mealLogId -> imageUrl(表示用画像URL)
  const [imageLoadErrors, setImageLoadErrors] = useState<
    Record<string, boolean>
  >({});

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
      await loadImageUrls(sortedMealLogs);
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
          borderRadius: 12,
        }}
        onPress={() =>
          navigation.navigate("MealLogEdit", {
            mealLogId: item.id,
          })
        }
      >
        <Card.Content>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            {imageUrls[item.id] && !imageLoadErrors[item.id] ? (
              <Image
                source={{ uri: imageUrls[item.id] }}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 10,
                  marginRight: 12,
                  backgroundColor: "#e5e7eb",
                }}
                resizeMode="cover"
                onError={() => {
                  setImageLoadErrors((prev) => ({
                    ...prev,
                    [item.id]: true,
                  }));
                }}
              />
            ) : (
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 10,
                  marginRight: 12,
                  backgroundColor: "#e5e7eb",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#777", fontSize: 12 }}>画像なし</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: "bold" }}
                numberOfLines={1}
              >
                {item.menuName}
              </Text>

              <Text style={{ marginTop: 4, color: "#666", fontSize: 12 }}>
                {formatMealType(item.mealType)} /{" "}
                {formatDateTime(item.mealDate)}
              </Text>

              {item.comment ? (
                <Text style={{ marginTop: 6, fontSize: 13 }} numberOfLines={2}>
                  {item.comment}
                </Text>
              ) : null}

              {hasNutrition(item) ? (
                <View
                  style={{
                    marginTop: 8,
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: "#f3f4f6",
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 13 }}>
                    {item.calories ?? "-"} kcal
                  </Text>

                  <Text style={{ marginTop: 3, fontSize: 12 }}>
                    P: {item.protein ?? "-"}g　F: {item.fat ?? "-"}g　C:{" "}
                    {item.carbs ?? "-"}g
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const loadImageUrls = async (
    items: Array<{ id: string; menuImageUrl?: string | null }>,
  ) => {
    const urls: Record<string, string> = {};

    await Promise.all(
      items.map(async (item) => {
        if (!item.menuImageUrl) return;

        try {
          const result = await getUrl({
            path: item.menuImageUrl,
          });

          urls[item.id] = result.url.toString();
        } catch (e) {
          console.error("MealLog image getUrl error:", e);
        }
      }),
    );
    setImageLoadErrors({});
    setImageUrls(urls);
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
