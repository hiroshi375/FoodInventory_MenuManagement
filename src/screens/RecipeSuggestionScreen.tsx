import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Text, TextInput } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { client } from "../lib/client";

type Props = NativeStackScreenProps<RootStackParamList, "RecipeSuggestion">;

type AiRecipeSuggestion = {
  title: string;
  description?: string;
  category?: string;
  ingredients: string[];
  steps: string[];
};

export default function RecipeSuggestionScreen({ route, navigation }: Props) {
  const initialMenuName = route.params?.menuName ?? "";

  const [menuName, setMenuName] = useState(initialMenuName);
  const [ingredients, setIngredients] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const parseAiResponse = (rawText: string): AiRecipeSuggestion => {
    if (!rawText) {
      throw new Error("rawText is empty");
    }
    const cleanedText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    return {
      title: parsed.title ?? "おすすめレシピ",
      description: parsed.description ?? "AI提案から作成したレシピです。",
      category: parsed.category ?? category,
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    };
  };

  const createSuggestion = async () => {
    try {
      if (!ingredients.trim() && !menuName.trim()) {
        Alert.alert(
          "入力エラー",
          "食材または食べたいメニューを入力してください。",
        );
        return;
      }

      setLoading(true);

      const ingredientItems = ingredients
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      console.log("client.queries keys:", Object.keys(client.queries ?? {}));

      const result = await client.queries.generateRecipeSuggestion({
        menuName: menuName.trim(),
        ingredients: ingredientItems,
        category: category.trim(),
      });

      console.log(
        "generateRecipeSuggestion result:",
        JSON.stringify(result, null, 2),
      );

      if (!result.data) {
        console.log("generateRecipeSuggestion errors:", result.errors);
        Alert.alert("エラー", "レシピ提案の生成に失敗しました。");
        return;
      }

      const data =
        typeof result.data === "string" ? JSON.parse(result.data) : result.data;

      const body =
        typeof data.body === "string" ? JSON.parse(data.body) : data.body;

      const rawText = data?.rawText ?? body?.rawText;

      console.log("parsed result data:", JSON.stringify(data, null, 2));
      console.log("parsed result body:", JSON.stringify(body, null, 2));
      console.log("parsed rawText:", rawText);

      if (!body.rawText) {
        Alert.alert("エラー", "AI提案結果が空でした。");
        return;
      }
      const suggestion = parseAiResponse(rawText);

      navigation.navigate("AiSuggestionReview", {
        suggestion,
      });
    } catch (e) {
      console.error("Recipe AI suggestion error:", e);
      Alert.alert("エラー", "レシピ提案の生成に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        レシピAI提案
      </Text>

      <TextInput
        label="食べたいメニュー"
        value={menuName}
        onChangeText={setMenuName}
        mode="outlined"
        style={{ marginBottom: 12 }}
        placeholder="例：カレー、パスタ、炒め物"
      />

      <TextInput
        label="使いたい食材"
        value={ingredients}
        onChangeText={setIngredients}
        mode="outlined"
        multiline
        style={{ marginBottom: 12 }}
        placeholder={"例：\n鶏肉\n玉ねぎ\nにんじん"}
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
        AIで提案を作成
      </Button>

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
