import { useState } from "react";
import { ScrollView, View, Alert } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";

type Props = NativeStackScreenProps<RootStackParamList, "CalendarEdit">;

export default function CalendarEditScreen({ route, navigation }: Props) {
  const initialDate =
    route.params?.date ?? new Date().toISOString().slice(0, 10);

  const [mealDate, setMealDate] = useState(initialDate);
  const [mealType, setMealType] = useState("");
  const [menuName, setMenuName] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    try {
      if (!menuName.trim()) {
        Alert.alert("入力エラー", "メニュー名を入力してください。");
        return;
      }

      setSaving(true);

      const context = await getAppContext();

      await client.models.MealLog.create({
        groupId: context.defaultGroupId,
        createdByUserId: context.appUserId,
        mealDate,
        mealType,
        menuName,
        comment,
      });

      navigation.navigate("CalendarDayDetail", {
        date: mealDate.slice(0, 10),
      });
    } catch (e) {
      console.error("Calendar meal create error:", e);
      Alert.alert("エラー", "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>
        カレンダー登録
      </Text>

      <TextInput
        label="日付"
        value={mealDate}
        onChangeText={setMealDate}
        mode="outlined"
        style={{ marginBottom: 12 }}
        placeholder="2026-06-06"
      />

      <TextInput
        label="食事区分"
        value={mealType}
        onChangeText={setMealType}
        mode="outlined"
        style={{ marginBottom: 12 }}
        placeholder="朝食 / 昼食 / 夕食"
      />

      <TextInput
        label="メニュー名"
        value={menuName}
        onChangeText={setMenuName}
        mode="outlined"
        style={{ marginBottom: 12 }}
      />

      <TextInput
        label="メモ"
        value={comment}
        onChangeText={setComment}
        mode="outlined"
        multiline
        style={{ marginBottom: 20 }}
      />

      <Button
        mode="contained"
        onPress={onSave}
        loading={saving}
        disabled={saving}
      >
        保存
      </Button>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
