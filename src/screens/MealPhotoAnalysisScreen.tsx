import { useState } from "react";
import { Alert, Image, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  TextInput,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { uploadData } from "aws-amplify/storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";

type Props = NativeStackScreenProps<RootStackParamList, "MealPhotoAnalysis">;

type MealPhotoAiResult = {
  menuName: string;
  comment?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
};

export default function MealPhotoAnalysisScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);

  const [menuName, setMenuName] = useState("");
  const [mealType, setMealType] = useState("dinner");
  const [comment, setComment] = useState("");

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const parseAiResponse = (rawText: string): MealPhotoAiResult => {
    const cleanedText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    return {
      menuName: parsed.menuName ?? "写真から解析した食事",
      comment: parsed.comment ?? "",
      calories:
        typeof parsed.calories === "number" ? parsed.calories : undefined,
      protein: typeof parsed.protein === "number" ? parsed.protein : undefined,
      fat: typeof parsed.fat === "number" ? parsed.fat : undefined,
      carbs: typeof parsed.carbs === "number" ? parsed.carbs : undefined,
    };
  };

  const uploadMealImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const key = `meal-photos/${Date.now()}.jpg`;

    await uploadData({
      path: key,
      data: blob,
      options: {
        contentType: "image/jpeg",
      },
    }).result;

    return key;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;

    if (!uri) {
      Alert.alert("エラー", "画像を取得できませんでした。");
      return;
    }

    setImageUri(uri);
    setImageKey(null);

    setMenuName("");
    setComment("");
    setCalories("");
    setProtein("");
    setFat("");
    setCarbs("");
  };

  const analyzePhoto = async () => {
    try {
      if (!imageUri) {
        Alert.alert("入力エラー", "先に写真を選択してください。");
        return;
      }

      setAnalyzing(true);

      const uploadedImageKey = await uploadMealImage(imageUri);
      setImageKey(uploadedImageKey);

      console.log("uploaded meal image key:", uploadedImageKey);
      console.log("client.queries keys:", Object.keys(client.queries ?? {}));

      const result = await client.queries.analyzeMealPhoto({
        imageKey: uploadedImageKey,
      });

      console.log("analyzeMealPhoto result:", JSON.stringify(result, null, 2));

      if (!result.data) {
        console.log("analyzeMealPhoto errors:", result.errors);
        Alert.alert("エラー", "食事写真の解析に失敗しました。");
        return;
      }

      const data =
        typeof result.data === "string" ? JSON.parse(result.data) : result.data;

      const body =
        typeof data?.body === "string" ? JSON.parse(data.body) : data?.body;

      const rawText = data?.rawText ?? body?.rawText;

      console.log("parsed meal photo data:", JSON.stringify(data, null, 2));
      console.log("parsed meal photo body:", JSON.stringify(body, null, 2));
      console.log("parsed meal photo rawText:", rawText);

      if (!rawText) {
        Alert.alert("エラー", "AI解析結果が空でした。");
        return;
      }

      const aiResult = parseAiResponse(rawText);

      setMenuName(aiResult.menuName);
      setComment(aiResult.comment ?? "");
      setCalories(
        aiResult.calories !== undefined ? String(aiResult.calories) : "",
      );
      setProtein(
        aiResult.protein !== undefined ? String(aiResult.protein) : "",
      );
      setFat(aiResult.fat !== undefined ? String(aiResult.fat) : "");
      setCarbs(aiResult.carbs !== undefined ? String(aiResult.carbs) : "");
    } catch (e) {
      console.error("Meal photo analysis error:", e);
      Alert.alert("エラー", "食事写真の解析に失敗しました。");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMealLog = async () => {
    try {
      if (!menuName.trim()) {
        Alert.alert("入力エラー", "メニュー名を入力してください。");
        return;
      }

      setSaving(true);

      const context = await getAppContext();

      const result = await client.models.MealLog.create({
        groupId: context.defaultGroupId,
        createdByUserId: context.appUserId,
        mealDate: new Date().toISOString(),
        mealType,
        menuName: menuName.trim(),
        comment: comment.trim(),
        menuImageUrl: imageKey ?? undefined,
        calories: calories.trim() ? Number(calories) : undefined,
        protein: protein.trim() ? Number(protein) : undefined,
        fat: fat.trim() ? Number(fat) : undefined,
        carbs: carbs.trim() ? Number(carbs) : undefined,
      });

      if (!result.data) {
        console.log("MealLog create errors:", result.errors);
        throw new Error("MealLog create failed");
      }

      Alert.alert("保存しました", "食事記録として保存しました。");

      navigation.navigate("MealLog");
    } catch (e) {
      console.error("Meal photo analysis save error:", e);
      Alert.alert("エラー", "食事記録の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        食事写真AI解析
      </Text>

      <Button
        mode="contained"
        onPress={pickImage}
        disabled={analyzing || saving}
      >
        写真を選択
      </Button>

      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: "100%",
            height: 220,
            marginTop: 16,
            borderRadius: 8,
          }}
          resizeMode="cover"
        />
      ) : null}

      <Button
        mode="contained"
        onPress={analyzePhoto}
        loading={analyzing}
        disabled={!imageUri || analyzing || saving}
        style={{ marginTop: 16 }}
      >
        AIで写真を解析
      </Button>

      {analyzing ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}

      <Card style={{ marginTop: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            解析結果
          </Text>

          <TextInput
            label="メニュー名"
            value={menuName}
            onChangeText={setMenuName}
            mode="outlined"
            style={{ marginBottom: 12 }}
          />

          <TextInput
            label="食事区分"
            value={mealType}
            onChangeText={setMealType}
            mode="outlined"
            style={{ marginBottom: 12 }}
            placeholder="breakfast / lunch / dinner / snack"
          />

          <TextInput
            label="メモ"
            value={comment}
            onChangeText={setComment}
            mode="outlined"
            multiline
            style={{ marginBottom: 12 }}
          />

          <TextInput
            label="カロリー"
            value={calories}
            onChangeText={setCalories}
            mode="outlined"
            keyboardType="numeric"
            style={{ marginBottom: 12 }}
          />

          <TextInput
            label="たんぱく質(g)"
            value={protein}
            onChangeText={setProtein}
            mode="outlined"
            keyboardType="numeric"
            style={{ marginBottom: 12 }}
          />

          <TextInput
            label="脂質(g)"
            value={fat}
            onChangeText={setFat}
            mode="outlined"
            keyboardType="numeric"
            style={{ marginBottom: 12 }}
          />

          <TextInput
            label="炭水化物(g)"
            value={carbs}
            onChangeText={setCarbs}
            mode="outlined"
            keyboardType="numeric"
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={saveMealLog}
        loading={saving}
        disabled={saving || analyzing}
        style={{ marginTop: 16 }}
      >
        食事記録として保存
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        disabled={saving || analyzing}
        style={{ marginTop: 12 }}
      >
        戻る
      </Button>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
