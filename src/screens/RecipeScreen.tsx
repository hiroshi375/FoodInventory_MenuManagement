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

type Recipe = Schema["Recipe"]["type"];

const formatNumber = (value?: number | null) => {
  if (value == null) return "未設定";
  return String(value);
};

const getFavoriteCardColor = (isFavorite?: boolean | null) => {
  return isFavorite ? "#fef3c7" : "#ffffff";
};

export default function RecipeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecipes = useCallback(async () => {
    try {
      setLoading(true);

      const appContext = await getAppContext();

      const result = await client.models.Recipe.list({
        filter: {
          groupId: {
            eq: appContext.defaultGroupId,
          },
        },
      });
      console.log("RecipeScreen defaultGroupId:", appContext.defaultGroupId);
      console.log("Recipe list result:", result);
      console.log("Recipe list count:", result.data.length);

      const sortedRecipes = [...result.data].sort((a, b) => {
        const aFavorite = a.isFavorite ? 1 : 0;
        const bFavorite = b.isFavorite ? 1 : 0;

        // お気に入りを上に表示
        if (aFavorite !== bFavorite) {
          return bFavorite - aFavorite;
        }

        // 新しいものを上に表示
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        return bTime - aTime;
      });

      setRecipes(sortedRecipes);
    } catch (e: any) {
      console.error("loadRecipes error:", e);

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

      Alert.alert("エラー", "レシピの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [loadRecipes]),
  );

  const onDelete = async (id: string) => {
    Alert.alert("確認", "このレシピを削除しますか？", [
      {
        text: "キャンセル",
        style: "cancel",
      },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await client.models.Recipe.delete({ id });
            await loadRecipes();
          } catch (e) {
            console.error("delete Recipe error:", e);
            Alert.alert("エラー", "削除に失敗しました。");
          }
        },
      },
    ]);
  };

  const onToggleFavorite = async (item: Recipe) => {
    try {
      setLoading(true);

      await client.models.Recipe.update({
        id: item.id,
        isFavorite: !item.isFavorite,
      });

      await loadRecipes();
    } catch (e) {
      console.error("toggle favorite error:", e);
      Alert.alert("エラー", "お気に入り状態の更新に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Recipe }) => {
    return (
      <Card
        style={{
          marginBottom: 10,
          backgroundColor: getFavoriteCardColor(item.isFavorite),
        }}
        onPress={() =>
          navigation.navigate("RecipeDetail", {
            recipeId: item.id,
          })
        }
      >
        <Card.Content>
          <Text variant="titleMedium">
            {item.isFavorite ? "★ " : ""}
            {item.title}
          </Text>

          {item.description ? (
            <Text style={{ marginTop: 4 }}>{item.description}</Text>
          ) : null}

          <View style={{ marginTop: 8 }}>
            <Text>カテゴリー：{item.category || "未設定"}</Text>
            <Text>調理時間：{formatNumber(item.cookingTimeMinutes)} 分</Text>
            <Text>何人分：{formatNumber(item.servings)} 人前</Text>
            <Text>カロリー：{formatNumber(item.calories)} kcal</Text>
            <Text>
              PFC：たんぱく質 {formatNumber(item.protein)} g / 脂質{" "}
              {formatNumber(item.fat)} g / 炭水化物 {formatNumber(item.carbs)} g
            </Text>
          </View>
        </Card.Content>

        <Card.Actions>
          <Button onPress={() => onToggleFavorite(item)}>
            {item.isFavorite ? "お気に入り解除" : "お気に入り"}
          </Button>

          <Button
            onPress={() =>
              navigation.navigate("RecipeDetail", {
                recipeId: item.id,
              })
            }
          >
            詳細
          </Button>

          <Button
            onPress={() =>
              navigation.navigate("RecipeEdit", {
                recipeId: item.id,
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
          レシピ
        </Text>

        {recipes.length === 0 && !loading ? (
          <Text style={{ marginTop: 20 }}>
            レシピはまだ登録されていません。
          </Text>
        ) : null}

        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={loadRecipes}
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
        onPress={() => navigation.navigate("RecipeEdit")}
      />
    </View>
  );
}
