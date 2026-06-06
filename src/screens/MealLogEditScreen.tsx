import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Menu, Text, TextInput } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";
import type { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MealLogEditRouteProp = RouteProp<RootStackParamList, "MealLogEdit">;

const mealTypeOptions = [
  { label: "朝食", value: "breakfast" },
  { label: "昼食", value: "lunch" },
  { label: "夕食", value: "dinner" },
  { label: "間食", value: "snack" },
];

const formatDateTime = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};

const formatTime = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${hh}:${mi}`;
};

export default function MealLogEditScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MealLogEditRouteProp>();

  const mealLogId = route.params?.mealLogId;
  const isEditMode = !!mealLogId;

  const [menuName, setMenuName] = useState("");
  const [mealDate, setMealDate] = useState(new Date().toISOString());
  const [mealType, setMealType] = useState("breakfast");
  const [comment, setComment] = useState("");

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");

  const [mealTypeMenuVisible, setMealTypeMenuVisible] = useState(false);
  const [mealDatePickerOpen, setMealDatePickerOpen] = useState(false);

  const [menuNameError, setMenuNameError] = useState("");
  const [caloriesError, setCaloriesError] = useState("");
  const [proteinError, setProteinError] = useState("");
  const [fatError, setFatError] = useState("");
  const [carbsError, setCarbsError] = useState("");
  const [timeError, setTimeError] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMealLog = async () => {
      if (!mealLogId) return;

      try {
        setLoading(true);

        const result = await client.models.MealLog.get({
          id: mealLogId,
        });

        const item = result.data;

        if (!item) {
          Alert.alert("エラー", "対象の食事記録が見つかりません。");
          navigation.goBack();
          return;
        }

        setMenuName(item.menuName ?? "");
        setMealDate(item.mealDate ?? new Date().toISOString());
        setMealType(item.mealType ?? "breakfast");
        setComment(item.comment ?? "");

        setCalories(item.calories != null ? String(item.calories) : "");
        setProtein(item.protein != null ? String(item.protein) : "");
        setFat(item.fat != null ? String(item.fat) : "");
        setCarbs(item.carbs != null ? String(item.carbs) : "");
      } catch (e) {
        console.error("loadMealLog error:", e);
        Alert.alert("エラー", "食事記録の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    loadMealLog();
  }, [mealLogId, navigation]);

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

  const validateForm = () => {
    let valid = true;

    setMenuNameError("");
    setCaloriesError("");
    setProteinError("");
    setFatError("");
    setCarbsError("");
    setTimeError("");

    if (!menuName.trim()) {
      setMenuNameError("メニュー名を入力してください。");
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

  const toIntegerOrUndefined = (value: string) => {
    if (!value.trim()) return undefined;
    return Math.round(Number(value));
  };

  const toFloatOrUndefined = (value: string) => {
    if (!value.trim()) return undefined;
    return Number(value);
  };

  const onSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const appContext = await getAppContext();

      const input = {
        mealDate,
        mealType,
        menuName: menuName.trim(),
        comment: comment.trim(),

        calories: toIntegerOrUndefined(calories),
        protein: toFloatOrUndefined(protein),
        fat: toFloatOrUndefined(fat),
        carbs: toFloatOrUndefined(carbs),
      };

      if (isEditMode && mealLogId) {
        await client.models.MealLog.update({
          id: mealLogId,
          ...input,
        });

        Alert.alert("完了", "食事記録を更新しました。");
      } else {
        await client.models.MealLog.create({
          groupId: appContext.defaultGroupId,
          createdByUserId: appContext.cognitoUserId,
          ...input,
        });

        Alert.alert("完了", "食事記録を登録しました。");
      }

      navigation.goBack();
    } catch (e) {
      console.error("save MealLog error:", e);
      Alert.alert("エラー", "保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const selectedMealTypeLabel =
    mealTypeOptions.find((item) => item.value === mealType)?.label ?? "朝食";

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        {isEditMode ? "食事記録編集" : "食事記録登録"}
      </Text>

      <TextInput
        label="メニュー名"
        value={menuName}
        onChangeText={(text) => {
          setMenuName(text);
          if (text.trim()) setMenuNameError("");
        }}
        mode="outlined"
        error={!!menuNameError}
        style={{ marginTop: 10 }}
      />
      {menuNameError ? (
        <Text style={{ color: "red", marginTop: 4 }}>{menuNameError}</Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Button
          mode="outlined"
          onPress={() => setMealDatePickerOpen(true)}
          style={{
            flex: 1.4,
            marginRight: 8,
          }}
          contentStyle={{ height: 44 }}
        >
          食事日時：{formatDateTime(mealDate)}
        </Button>

        <TextInput
          label="時刻 HH:mm"
          value={formatTime(mealDate)}
          onChangeText={(text) => {
            const m = text.match(/^(\d{1,2}):(\d{2})$/);

            if (!m) {
              setTimeError("時刻は HH:mm 形式で入力してください。");
              return;
            }

            const hour = Number(m[1]);
            const minute = Number(m[2]);

            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
              setTimeError("時刻を正しく入力してください。");
              return;
            }

            const d = new Date(mealDate);
            d.setHours(hour, minute, 0, 0);

            setMealDate(d.toISOString());
            setTimeError("");
          }}
          mode="outlined"
          error={!!timeError}
          style={{
            flex: 1,
          }}
        />
      </View>

      {timeError ? (
        <Text style={{ color: "red", marginTop: 4 }}>{timeError}</Text>
      ) : null}

      <DatePickerModal
        locale="ja"
        mode="single"
        visible={mealDatePickerOpen}
        onDismiss={() => setMealDatePickerOpen(false)}
        date={new Date(mealDate)}
        onConfirm={({ date }) => {
          setMealDatePickerOpen(false);

          if (!date) return;

          const current = new Date(mealDate);
          const selected = new Date(date);

          selected.setHours(current.getHours(), current.getMinutes(), 0, 0);

          setMealDate(selected.toISOString());
        }}
      />

      <View style={{ marginTop: 10 }}>
        <Menu
          visible={mealTypeMenuVisible}
          onDismiss={() => setMealTypeMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMealTypeMenuVisible(true)}
            >
              食事種別：{selectedMealTypeLabel}
            </Button>
          }
        >
          {mealTypeOptions.map((item) => (
            <Menu.Item
              key={item.value}
              title={item.label}
              onPress={() => {
                setMealType(item.value);
                setMealTypeMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      <TextInput
        label="コメント"
        value={comment}
        onChangeText={setComment}
        mode="outlined"
        multiline
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

      <Button
        mode="contained"
        onPress={onSave}
        loading={loading}
        disabled={loading || !menuName.trim()}
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
