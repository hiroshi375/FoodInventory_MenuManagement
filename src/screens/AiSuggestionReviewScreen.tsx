import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Card, Divider, Text } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";

type Props = NativeStackScreenProps<RootStackParamList, "AiSuggestionReview">;

export default function AiSuggestionReviewScreen({ route, navigation }: Props) {
  const suggestion = route.params?.suggestion;

  const [saving, setSaving] = useState(false);

  const title = suggestion?.title ?? "おすすめレシピ";
  const description =
    suggestion?.description ?? "AI提案から作成したレシピです。";
  const category = suggestion?.category ?? "";
  const ingredients = suggestion?.ingredients ?? [];
  const steps = suggestion?.steps ?? [];

  const saveAsRecipe = async () => {
    try {
      setSaving(true);

      const context = await getAppContext();

      const result = await client.models.Recipe.create({
        groupId: context.defaultGroupId,
        createdByUserId: context.appUserId,
        title,
        category,
        description,
        ingredients: JSON.stringify({
          items: ingredients,
        }) as any,
        steps: JSON.stringify({
          items: steps,
        }) as any,
        isFavorite: false,
      } as any);

      if (!result.data) {
        console.log("Recipe create errors:", result.errors);
        throw new Error("Recipe create failed");
      }

      Alert.alert("保存しました", "レシピとして保存しました。");

      navigation.navigate("RecipeDetail", {
        recipeId: result.data.id,
      });
    } catch (e) {
      console.error("AI suggestion save error:", e);
      Alert.alert("エラー", "レシピ保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (!suggestion) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Text>提案内容がありません。</Text>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        >
          戻る
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        AI提案レビュー
      </Text>

      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <Text variant="titleLarge">{title}</Text>

          {description ? (
            <Text style={{ marginTop: 8 }}>{description}</Text>
          ) : null}

          {category ? (
            <Text style={{ marginTop: 8 }}>カテゴリー：{category}</Text>
          ) : null}
        </Card.Content>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <Text variant="titleMedium">材料</Text>
          <Divider style={{ marginVertical: 8 }} />

          {ingredients.length > 0 ? (
            ingredients.map((item, index) => (
              <Text key={`${item}-${index}`} style={{ marginBottom: 6 }}>
                {index + 1}. {item}
              </Text>
            ))
          ) : (
            <Text>材料はありません。</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <Text variant="titleMedium">作り方</Text>
          <Divider style={{ marginVertical: 8 }} />

          {steps.length > 0 ? (
            steps.map((item, index) => (
              <Text key={`${item}-${index}`} style={{ marginBottom: 6 }}>
                {index + 1}. {item}
              </Text>
            ))
          ) : (
            <Text>作り方はありません。</Text>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={saveAsRecipe}
        loading={saving}
        disabled={saving}
        style={{ marginBottom: 12 }}
      >
        レシピとして保存
      </Button>

      <Button mode="outlined" onPress={() => navigation.goBack()}>
        戻る
      </Button>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
