import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Card, Text } from "react-native-paper";
import { Calendar } from "react-native-calendars";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";

type RootStackParamList = {
  CalendarDayDetail: {
    date: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type CalendarItem = {
  date: string;
  title: string;
  type: "meal" | "expiration" | "shopping";
};

type MarkedDates = {
  [date: string]: {
    marked?: boolean;
    selected?: boolean;
    dotColor?: string;
  };
};

export default function CalendarScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  useEffect(() => {
    loadCalendarItems();
  }, []);

  const toDateText = (value?: string | null) => {
    if (!value) return "";
    return value.slice(0, 10);
  };

  const loadCalendarItems = async () => {
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

      const mealItems: CalendarItem[] =
        mealRes.data?.map((m) => ({
          date: toDateText(m.mealDate),
          title: `食事記録：${m.menuName ?? ""}`,
          type: "meal",
        })) ?? [];

      const expirationItems: CalendarItem[] =
        foodRes.data
          ?.filter((f) => f.expirationDate)
          .map((f) => ({
            date: toDateText(f.expirationDate),
            title: `期限：${f.ingredientsName ?? ""}`,
            type: "expiration",
          })) ?? [];

      const shoppingItems: CalendarItem[] =
        groceryRes.data
          ?.filter((g) => g.purchasedAt)
          .map((g) => ({
            date: toDateText(g.purchasedAt),
            title: `購入：${g.itemName ?? ""}`,
            type: "shopping",
          })) ?? [];

      const merged = [...mealItems, ...expirationItems, ...shoppingItems]
        .filter((item) => item.date)
        .sort((a, b) => a.date.localeCompare(b.date));

      const marks: MarkedDates = {};

      merged.forEach((item) => {
        marks[item.date] = {
          marked: true,
          dotColor: "#4f6f8f",
        };
      });

      setItems(merged);
      setMarkedDates(marks);
    } catch (e) {
      console.error("Calendar load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const getTodayItems = () => {
    const today = new Date().toISOString().slice(0, 10);
    return items.filter((item) => item.date === today);
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  const todayItems = getTodayItems();

  return (
    <ScrollView style={{ flex: 1, padding: 12 }}>
      <Text variant="titleLarge" style={{ marginBottom: 12 }}>
        カレンダー
      </Text>

      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => {
          navigation.navigate("CalendarDayDetail", {
            date: day.dateString,
          });
        }}
        monthFormat="yyyy年 M月"
        firstDay={0}
        enableSwipeMonths
      />

      <Card style={{ marginTop: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>
            今日の予定・記録
          </Text>

          {todayItems.length === 0 ? (
            <Text>今日の予定・記録はありません。</Text>
          ) : (
            todayItems.map((item, index) => (
              <View key={`${item.date}-${index}`} style={{ marginBottom: 6 }}>
                <Text>{item.title}</Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
