import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  TextInput,
} from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";

type Props = NativeStackScreenProps<RootStackParamList, "GrocerySuggestion">;

type GroceryAiResult = {
  title: string;
  description?: string;
  items: string[];
};

export default function GrocerySuggestionScreen({ navigation }: Props) {
  const [menuName, setMenuName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [category, setCategory] = useState("");

  const [aiTitle, setAiTitle] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [suggestedItems, setSuggestedItems] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const parseAiResponse = (rawText: string): GroceryAiResult => {
    const cleanedText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    return {
      title: parsed.title ?? "買うもの提案",
      description: parsed.description ?? "",
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  };

  const createSuggestion = async () => {
    try {
      if (!menuName.trim() && !ingredients.trim()) {
        Alert.alert("入力エラー", "メニュー名または食材を入力してください。");
        return;
      }

      setLoading(true);

      const ingredientItems = ingredients
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      console.log("client.queries keys:", Object.keys(client.queries ?? {}));

      const result = await client.queries.generateGrocerySuggestion({
        menuName: menuName.trim(),
        ingredients: ingredientItems,
        category: category.trim(),
      });

      console.log(
        "generateGrocerySuggestion result:",
        JSON.stringify(result, null, 2),
      );

      if (!result.data) {
        console.log("generateGrocerySuggestion errors:", result.errors);
        Alert.alert("エラー", "買うもの提案の生成に失敗しました。");
        return;
      }

      const data =
        typeof result.data === "string" ? JSON.parse(result.data) : result.data;

      const body =
        typeof data?.body === "string" ? JSON.parse(data.body) : data?.body;

      const rawText = data?.rawText ?? body?.rawText;

      console.log("parsed grocery data:", JSON.stringify(data, null, 2));
      console.log("parsed grocery body:", JSON.stringify(body, null, 2));
      console.log("parsed grocery rawText:", rawText);

      if (!rawText) {
        Alert.alert("エラー", "AI提案結果が空でした。");
        return;
      }

      const aiResult = parseAiResponse(rawText);

      setAiTitle(aiResult.title);
      setAiDescription(aiResult.description ?? "");
      setSuggestedItems(aiResult.items);
    } catch (e) {
      console.error("Grocery AI suggestion error:", e);
      Alert.alert("エラー", "買うもの提案の生成に失敗しました。");
    } finally {
      setLoading(false);
    }
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
            category: category.trim(),
            description: menuName
              ? `${menuName}のために追加`
              : "買うものAI提案から追加",
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
        label="現在ある食材・候補"
        value={ingredients}
        onChangeText={setIngredients}
        mode="outlined"
        multiline
        style={{ marginBottom: 12 }}
        placeholder={"例：\n玉ねぎ\nにんじん\n鶏肉"}
      />

      <TextInput
        label="ジャンル"
        value={category}
        onChangeText={setCategory}
        mode="outlined"
        style={{ marginBottom: 16 }}
        placeholder="例：和食 / 洋食 / 中華"
      />

      {loading ? <ActivityIndicator style={{ marginBottom: 12 }} /> : null}

      <Button mode="contained" onPress={createSuggestion} disabled={loading}>
        AIで買うものを提案
      </Button>

      {suggestedItems.length > 0 ? (
        <Card style={{ marginTop: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              {aiTitle || "提案された買うもの"}
            </Text>

            {aiDescription ? (
              <Text style={{ marginBottom: 8 }}>{aiDescription}</Text>
            ) : null}

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
        disabled={loading}
        style={{ marginTop: 12 }}
      >
        戻る
      </Button>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
