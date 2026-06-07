import { useState } from "react";
import { Alert, Image, ScrollView, View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";

type Props = NativeStackScreenProps<RootStackParamList, "MealPhotoAnalysis">;

export default function MealPhotoAnalysisScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [menuName, setMenuName] = useState("");
  const [mealType, setMealType] = useState("dinner");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    setImageUri(uri);

    // 仮のAI解析結果
    setMenuName("写真から解析した食事");
    setComment("AI解析結果をここに反映予定です。");
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
        menuImageUrl: imageUri ?? undefined,
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

      <Button mode="contained" onPress={pickImage}>
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
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={saveMealLog}
        loading={saving}
        disabled={saving}
        style={{ marginTop: 16 }}
      >
        食事記録として保存
      </Button>

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
