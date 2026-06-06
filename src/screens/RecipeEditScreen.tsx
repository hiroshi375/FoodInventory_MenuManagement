import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Menu, Text, TextInput } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";
import type { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RecipeEditRouteProp = RouteProp<RootStackParamList, "RecipeEdit">;

const favoriteOptions = [
  { label: "お気に入りにしない", value: false },
  { label: "お気に入りにする", value: true },
];

const parseJsonArrayText = (value: string) => {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines;
};

const formatJsonArrayText = (value: unknown) => {
  if (!value) return "";

  let parsedValue = value;

  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;

        if (typeof item === "object" && item !== null && "name" in item) {
          const obj = item as {
            name?: string;
            quantity?: number | string;
            unit?: string;
          };

          const quantityText =
            obj.quantity != null && obj.quantity !== ""
              ? ` ${obj.quantity}`
              : "";

          const unitText = obj.unit ? obj.unit : "";

          return `${obj.name ?? ""}${quantityText}${unitText}`;
        }

        return JSON.stringify(item);
      })
      .join("\n");
  }

  return String(value);
};

const validateNumber = (
  value: string,
  setError: (message: string) => void,
  label: string,
) => {
  if (!value.trim()) return true;

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    setError(`${label}は数値で入力してください。`);
    return false;
  }

  if (numberValue < 0) {
    setError(`${label}は0以上で入力してください。`);
    return false;
  }

  return true;
};

const toIntegerOrUndefined = (value: string) => {
  if (!value.trim()) return undefined;
  return Math.round(Number(value));
};

const toFloatOrUndefined = (value: string) => {
  if (!value.trim()) return undefined;
  return Number(value);
};

export default function RecipeEditScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RecipeEditRouteProp>();

  const recipeId = route.params?.recipeId;
  const isEditMode = !!recipeId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const [cookingTimeMinutes, setCookingTimeMinutes] = useState("");
  const [servings, setServings] = useState("");

  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");

  const [sourceUrl, setSourceUrl] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const [favoriteMenuVisible, setFavoriteMenuVisible] = useState(false);

  const [titleError, setTitleError] = useState("");
  const [cookingTimeMinutesError, setCookingTimeMinutesError] = useState("");
  const [servingsError, setServingsError] = useState("");
  const [caloriesError, setCaloriesError] = useState("");
  const [proteinError, setProteinError] = useState("");
  const [fatError, setFatError] = useState("");
  const [carbsError, setCarbsError] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRecipe = async () => {
      if (!recipeId) return;

      try {
        setLoading(true);

        const result = await client.models.Recipe.get({
          id: recipeId,
        });

        const item = result.data;

        if (!item) {
          Alert.alert("エラー", "対象のレシピが見つかりません。");
          navigation.goBack();
          return;
        }

        setTitle(item.title ?? "");
        setDescription(item.description ?? "");
        setCategory(item.category ?? "");

        setCookingTimeMinutes(
          item.cookingTimeMinutes != null
            ? String(item.cookingTimeMinutes)
            : "",
        );
        setServings(item.servings != null ? String(item.servings) : "");

        setIngredientsText(formatJsonArrayText(item.ingredients));
        setStepsText(formatJsonArrayText(item.steps));

        setCalories(item.calories != null ? String(item.calories) : "");
        setProtein(item.protein != null ? String(item.protein) : "");
        setFat(item.fat != null ? String(item.fat) : "");
        setCarbs(item.carbs != null ? String(item.carbs) : "");

        setSourceUrl(item.sourceUrl ?? "");
        setIsFavorite(item.isFavorite ?? false);
      } catch (e) {
        console.error("loadRecipe error:", e);
        Alert.alert("エラー", "レシピの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [recipeId, navigation]);

  const validateForm = () => {
    let valid = true;

    setTitleError("");
    setCookingTimeMinutesError("");
    setServingsError("");
    setCaloriesError("");
    setProteinError("");
    setFatError("");
    setCarbsError("");

    if (!title.trim()) {
      setTitleError("タイトルを入力してください。");
      valid = false;
    }

    if (
      !validateNumber(
        cookingTimeMinutes,
        setCookingTimeMinutesError,
        "調理時間",
      )
    ) {
      valid = false;
    }

    if (!validateNumber(servings, setServingsError, "何人分")) {
      valid = false;
    }

    if (!validateNumber(calories, setCaloriesError, "カロリー")) {
      valid = false;
    }

    if (!validateNumber(protein, setProteinError, "たんぱく質")) {
      valid = false;
    }

    if (!validateNumber(fat, setFatError, "脂質")) {
      valid = false;
    }

    if (!validateNumber(carbs, setCarbsError, "炭水化物")) {
      valid = false;
    }

    return valid;
  };

  const onSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const appContext = await getAppContext();

      const input = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),

        cookingTimeMinutes: toIntegerOrUndefined(cookingTimeMinutes),
        servings: toIntegerOrUndefined(servings),

        ingredients: JSON.stringify(parseJsonArrayText(ingredientsText)),
        steps: JSON.stringify(parseJsonArrayText(stepsText)),

        calories: toIntegerOrUndefined(calories),
        protein: toFloatOrUndefined(protein),
        fat: toFloatOrUndefined(fat),
        carbs: toFloatOrUndefined(carbs),

        sourceUrl: sourceUrl.trim(),
        isFavorite,
      };

      if (isEditMode && recipeId) {
        await client.models.Recipe.update({
          id: recipeId,
          ...input,
        });

        Alert.alert("完了", "レシピを更新しました。");
      } else {
        const result = await client.models.Recipe.create({
          groupId: appContext.defaultGroupId,
          createdByUserId: appContext.cognitoUserId,
          ...input,
        });

        console.log("Recipe create result:", result);
        console.log("Recipe create groupId:", appContext.defaultGroupId);

        if (!result.data) {
          console.error("Recipe create errors:", result.errors);
          Alert.alert("エラー", "レシピの登録に失敗しました。");
          return;
        }

        Alert.alert("完了", "レシピを登録しました。");
      }

      navigation.goBack();
    } catch (e) {
      console.error("save Recipe error:", e);
      Alert.alert("エラー", "保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const selectedFavoriteLabel =
    favoriteOptions.find((item) => item.value === isFavorite)?.label ??
    "お気に入りにしない";

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        {isEditMode ? "レシピ編集" : "レシピ登録"}
      </Text>

      <TextInput
        label="タイトル"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (text.trim()) setTitleError("");
        }}
        mode="outlined"
        error={!!titleError}
        style={{ marginTop: 10 }}
      />
      {titleError ? (
        <Text style={{ color: "red", marginTop: 4 }}>{titleError}</Text>
      ) : null}

      <TextInput
        label="メモ"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        style={{ marginTop: 10 }}
      />

      <TextInput
        label="カテゴリー"
        value={category}
        onChangeText={setCategory}
        mode="outlined"
        style={{ marginTop: 10 }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <TextInput
          label="調理時間 分"
          value={cookingTimeMinutes}
          onChangeText={(text) => {
            setCookingTimeMinutes(text);
            setCookingTimeMinutesError("");
          }}
          keyboardType="numeric"
          mode="outlined"
          error={!!cookingTimeMinutesError}
          style={{ flex: 1, marginRight: 8 }}
        />

        <TextInput
          label="何人分"
          value={servings}
          onChangeText={(text) => {
            setServings(text);
            setServingsError("");
          }}
          keyboardType="numeric"
          mode="outlined"
          error={!!servingsError}
          style={{ flex: 1 }}
        />
      </View>

      {cookingTimeMinutesError ? (
        <Text style={{ color: "red", marginTop: 4 }}>
          {cookingTimeMinutesError}
        </Text>
      ) : null}

      {servingsError ? (
        <Text style={{ color: "red", marginTop: 4 }}>{servingsError}</Text>
      ) : null}

      <TextInput
        label="材料・食材一覧"
        value={ingredientsText}
        onChangeText={setIngredientsText}
        mode="outlined"
        multiline
        numberOfLines={6}
        placeholder={"例：\n玉ねぎ 1個\n鶏肉 200g\nカレールー 1箱"}
        style={{ marginTop: 10 }}
      />

      <TextInput
        label="調理手順"
        value={stepsText}
        onChangeText={setStepsText}
        mode="outlined"
        multiline
        numberOfLines={8}
        placeholder={"例：\n玉ねぎを切る\n鶏肉を炒める\n水を入れて煮込む"}
        style={{ marginTop: 10 }}
      />

      <TextInput
        label="カロリー kcal"
        value={calories}
        onChangeText={(text) => {
          setCalories(text);
          setCaloriesError("");
        }}
        keyboardType="numeric"
        mode="outlined"
        error={!!caloriesError}
        style={{ marginTop: 10 }}
      />
      {caloriesError ? (
        <Text style={{ color: "red", marginTop: 4 }}>{caloriesError}</Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <TextInput
          label="たんぱく質 g"
          value={protein}
          onChangeText={(text) => {
            setProtein(text);
            setProteinError("");
          }}
          keyboardType="numeric"
          mode="outlined"
          error={!!proteinError}
          style={{ flex: 1, marginRight: 8 }}
        />

        <TextInput
          label="脂質 g"
          value={fat}
          onChangeText={(text) => {
            setFat(text);
            setFatError("");
          }}
          keyboardType="numeric"
          mode="outlined"
          error={!!fatError}
          style={{ flex: 1 }}
        />
      </View>

      {proteinError ? (
        <Text style={{ color: "red", marginTop: 4 }}>{proteinError}</Text>
      ) : null}

      {fatError ? (
        <Text style={{ color: "red", marginTop: 4 }}>{fatError}</Text>
      ) : null}

      <TextInput
        label="炭水化物 g"
        value={carbs}
        onChangeText={(text) => {
          setCarbs(text);
          setCarbsError("");
        }}
        keyboardType="numeric"
        mode="outlined"
        error={!!carbsError}
        style={{ marginTop: 10 }}
      />
      {carbsError ? (
        <Text style={{ color: "red", marginTop: 4 }}>{carbsError}</Text>
      ) : null}

      <TextInput
        label="参考URL"
        value={sourceUrl}
        onChangeText={setSourceUrl}
        mode="outlined"
        autoCapitalize="none"
        style={{ marginTop: 10 }}
      />

      <View style={{ marginTop: 10 }}>
        <Menu
          visible={favoriteMenuVisible}
          onDismiss={() => setFavoriteMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setFavoriteMenuVisible(true)}
            >
              お気に入り：{selectedFavoriteLabel}
            </Button>
          }
        >
          {favoriteOptions.map((item) => (
            <Menu.Item
              key={item.label}
              title={item.label}
              onPress={() => {
                setIsFavorite(item.value);
                setFavoriteMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      <Button
        mode="contained"
        onPress={onSave}
        loading={loading}
        disabled={loading || !title.trim()}
        style={{ marginTop: 24 }}
      >
        保存
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        disabled={loading}
        style={{ marginTop: 10 }}
      >
        キャンセル
      </Button>
    </ScrollView>
  );
}
