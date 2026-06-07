import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";

type Props = NativeStackScreenProps<RootStackParamList, "GrocerySuggestion">;

export default function GrocerySuggestionScreen({ navigation }: Props) {
  const [menuName, setMenuName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [suggestedItems, setSuggestedItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const createSuggestion = () => {
    if (!menuName.trim() && !ingredients.trim()) {
      Alert.alert("入力エラー", "メニュー名または食材を入力してください。");
      return;
    }

    const items = ingredients
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const suggestions = items.length > 0 ? items : [`${menuName}の材料`];

    setSuggestedItems(suggestions);
  };

  const saveToGroceryList = async () => {
    try {
      if (suggestedItems.length === 0) {
        Alert.alert("入力エラー", "先に買うものを提案してください。");
        return;
      }

      setSaving(true);

      const context = await getAppContext();

      await Promise.all(
        suggestedItems.map((item) =>
          client.models.GroceryList.create({
            groupId: context.defaultGroupId,
            createdByUserId: context.appUserId,
            itemName: item,
            description: menuName
              ? `${menuName}のために追加`
              : "買うもの提案から追加",
            isPurchased: false,
            priority: 2,
          }),
        ),
      );

      Alert.alert("保存しました", "買うものリストに追加しました。");

      navigation.navigate("GroceryList");
    } catch (e) {
      console.error("Grocery suggestion save error:", e);
      Alert.alert("エラー", "買うものリストへの保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        買うもの自動提案
      </Text>

      <TextInput
        label="作りたいメニュー"
        value={menuName}
        onChangeText={setMenuName}
        mode="outlined"
        style={{ marginBottom: 12 }}
        placeholder="例：カレー、鍋、パスタ"
      />

      <TextInput
        label="必要そうな食材"
        value={ingredients}
        onChangeText={setIngredients}
        mode="outlined"
        multiline
        style={{ marginBottom: 16 }}
        placeholder={"例：\n玉ねぎ\nにんじん\n鶏肉"}
      />

      <Button mode="contained" onPress={createSuggestion}>
        買うものを提案
      </Button>

      {suggestedItems.length > 0 ? (
        <Card style={{ marginTop: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              提案された買うもの
            </Text>

            {suggestedItems.map((item, index) => (
              <Text key={`${item}-${index}`} style={{ marginBottom: 6 }}>
                {index + 1}. {item}
              </Text>
            ))}

            <Button
              mode="contained"
              onPress={saveToGroceryList}
              loading={saving}
              disabled={saving}
              style={{ marginTop: 16 }}
            >
              買うものリストに保存
            </Button>
          </Card.Content>
        </Card>
      ) : null}

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
