import { useCallback, useState } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";
import { Button, Card, Divider, Text } from "react-native-paper";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { client } from "../lib/client";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { Schema } from "../../amplify/data/resource";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RecipeDetailRouteProp = RouteProp<RootStackParamList, "RecipeDetail">;

type Recipe = Schema["Recipe"]["type"];

const formatNumber = (value?: number | null) => {
  if (value == null) return "未設定";
  return String(value);
};

const formatJsonList = (value: unknown): string[] => {
  if (!value) return [];

  let parsedValue = value;

  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      return [value];
    }
  }

  if (
    typeof parsedValue === "object" &&
    parsedValue !== null &&
    "items" in parsedValue
  ) {
    const items = (parsedValue as { items?: unknown }).items;

    if (Array.isArray(items)) {
      return items.map((item) => String(item));
    }
  }

  if (Array.isArray(parsedValue)) {
    return parsedValue.map((item) => {
      if (typeof item === "string") return item;

      if (typeof item === "object" && item !== null) {
        const obj = item as {
          name?: string;
          quantity?: number | string;
          unit?: string;
          text?: string;
        };

        if (obj.text) return obj.text;

        if (obj.name) {
          const quantityText =
            obj.quantity != null && obj.quantity !== ""
              ? ` ${obj.quantity}`
              : "";
          const unitText = obj.unit ?? "";

          return `${obj.name}${quantityText}${unitText}`;
        }

        return JSON.stringify(item);
      }

      return String(item);
    });
  }

  return [String(parsedValue)];
};

export default function RecipeDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RecipeDetailRouteProp>();

  const { recipeId } = route.params;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);

  const loadRecipe = useCallback(async () => {
    try {
      setLoading(true);

      const result = await client.models.Recipe.get({
        id: recipeId,
      });

      if (!result.data) {
        Alert.alert("エラー", "対象のレシピが見つかりません。");
        navigation.goBack();
        return;
      }

      setRecipe(result.data);
    } catch (e) {
      console.error("load RecipeDetail error:", e);
      Alert.alert("エラー", "レシピ詳細の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [recipeId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadRecipe();
    }, [loadRecipe]),
  );

  const onToggleFavorite = async () => {
    if (!recipe) return;

    try {
      setLoading(true);

      const result = await client.models.Recipe.update({
        id: recipe.id,
        isFavorite: !recipe.isFavorite,
      });

      if (result.data) {
        setRecipe(result.data);
      }
    } catch (e) {
      console.error("toggle favorite error:", e);
      Alert.alert("エラー", "お気に入り状態の更新に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const onOpenSourceUrl = async () => {
    if (!recipe?.sourceUrl) return;

    const canOpen = await Linking.canOpenURL(recipe.sourceUrl);

    if (!canOpen) {
      Alert.alert("エラー", "URLを開けませんでした。");
      return;
    }

    await Linking.openURL(recipe.sourceUrl);
  };

  if (!recipe) {
    return (
      <View
        style={{
          flex: 1,
          padding: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>{loading ? "読み込み中..." : "レシピが見つかりません。"}</Text>
      </View>
    );
  }

  const ingredients = formatJsonList(recipe.ingredients);
  const steps = formatJsonList(recipe.steps);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Card.Content>
          <Text variant="headlineSmall">
            {recipe.isFavorite ? "★ " : ""}
            {recipe.title}
          </Text>

          {recipe.description ? (
            <Text style={{ marginTop: 8 }}>{recipe.description}</Text>
          ) : null}

          <View style={{ marginTop: 16 }}>
            <Text>カテゴリー：{recipe.category || "未設定"}</Text>
            <Text>調理時間：{formatNumber(recipe.cookingTimeMinutes)} 分</Text>
            <Text>何人分：{formatNumber(recipe.servings)} 人前</Text>
          </View>
        </Card.Content>

        <Card.Actions>
          <Button onPress={onToggleFavorite} disabled={loading}>
            {recipe.isFavorite ? "お気に入り解除" : "お気に入り"}
          </Button>

          <Button
            onPress={() =>
              navigation.navigate("RecipeEdit", {
                recipeId: recipe.id,
              })
            }
          >
            編集
          </Button>
        </Card.Actions>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Card.Content>
          <Text variant="titleMedium">栄養情報</Text>

          <View style={{ marginTop: 8 }}>
            <Text>カロリー：{formatNumber(recipe.calories)} kcal</Text>
            <Text>たんぱく質：{formatNumber(recipe.protein)} g</Text>
            <Text>脂質：{formatNumber(recipe.fat)} g</Text>
            <Text>炭水化物：{formatNumber(recipe.carbs)} g</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Card.Content>
          <Text variant="titleMedium">材料・食材</Text>

          <Divider style={{ marginVertical: 8 }} />

          {ingredients.length > 0 ? (
            ingredients.map((item, index) => (
              <Text key={`${item}-${index}`} style={{ marginBottom: 6 }}>
                {index + 1}. {item}
              </Text>
            ))
          ) : (
            <Text>材料は未登録です。</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Card.Content>
          <Text variant="titleMedium">調理手順</Text>

          <Divider style={{ marginVertical: 8 }} />

          {steps.length > 0 ? (
            steps.map((item, index) => (
              <Text key={`${item}-${index}`} style={{ marginBottom: 8 }}>
                {index + 1}. {item}
              </Text>
            ))
          ) : (
            <Text>調理手順は未登録です。</Text>
          )}
        </Card.Content>
      </Card>

      {recipe.sourceUrl ? (
        <Button
          mode="outlined"
          onPress={onOpenSourceUrl}
          style={{ marginTop: 16 }}
        >
          参考URLを開く
        </Button>
      ) : null}

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 12 }}
      >
        戻る
      </Button>
    </ScrollView>
  );
}
