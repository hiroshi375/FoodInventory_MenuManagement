import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Card, Divider, Text } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";

type RootStackParamList = {
  CalendarDayDetail: {
    date: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, "CalendarDayDetail">;

type MealItem = {
  id: string;
  menuName?: string | null;
  mealType?: string | null;
  mealDate?: string | null;
};

type FoodItem = {
  id: string;
  ingredientsName?: string | null;
  expirationDate?: string | null;
};

type GroceryItem = {
  id: string;
  itemName?: string | null;
  purchasedAt?: string | null;
};

export default function CalendarDayDetailScreen({ route }: Props) {
  const { date } = route.params;

  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);

  useEffect(() => {
    loadDetail();
  }, [date]);

  const toDateText = (value?: string | null) => {
    if (!value) return "";
    return value.slice(0, 10);
  };

  const loadDetail = async () => {
    try {
      setLoading(true);

      const context = await getAppContext();
      const groupId = context.defaultGroupId;

      const [mealRes, foodRes, groceryRes] = await Promise.all([
        client.models.MealLog.list({
          filter: {
            groupId: {
              eq: groupId,
            },
          },
        }),
        client.models.FoodInventory.list({
          filter: {
            groupId: {
              eq: groupId,
            },
          },
        }),
        client.models.GroceryList.list({
          filter: {
            groupId: {
              eq: groupId,
            },
          },
        }),
      ]);

      setMeals(
        (mealRes.data ?? []).filter(
          (item) => toDateText(item.mealDate) === date,
        ),
      );

      setFoods(
        (foodRes.data ?? []).filter(
          (item) => toDateText(item.expirationDate) === date,
        ),
      );

      setGroceries(
        (groceryRes.data ?? []).filter(
          (item) => toDateText(item.purchasedAt) === date,
        ),
      );
    } catch (e) {
      console.error("Calendar detail load error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <ScrollView style={{ flex: 1, padding: 12 }}>
      <Text variant="titleLarge" style={{ marginBottom: 12 }}>
        {date}
      </Text>

      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <Text variant="titleMedium">食事記録</Text>
          <Divider style={{ marginVertical: 8 }} />

          {meals.length === 0 ? (
            <Text>食事記録はありません。</Text>
          ) : (
            meals.map((item) => (
              <View key={item.id} style={{ marginBottom: 8 }}>
                <Text>
                  {item.mealType ? `${item.mealType}：` : ""}
                  {item.menuName ?? "名称未設定"}
                </Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <Text variant="titleMedium">賞味期限</Text>
          <Divider style={{ marginVertical: 8 }} />

          {foods.length === 0 ? (
            <Text>賞味期限の食材はありません。</Text>
          ) : (
            foods.map((item) => (
              <View key={item.id} style={{ marginBottom: 8 }}>
                <Text>{item.ingredientsName ?? "名称未設定"}</Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <Text variant="titleMedium">買い物記録</Text>
          <Divider style={{ marginVertical: 8 }} />

          {groceries.length === 0 ? (
            <Text>買い物記録はありません。</Text>
          ) : (
            groceries.map((item) => (
              <View key={item.id} style={{ marginBottom: 8 }}>
                <Text>{item.itemName ?? "名称未設定"}</Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
