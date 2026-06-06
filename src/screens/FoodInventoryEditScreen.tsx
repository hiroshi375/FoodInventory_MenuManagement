import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Menu, Text, TextInput } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { client } from "../lib/client";
import { getAppContext } from "../lib/getAppContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { DatePickerModal } from "react-native-paper-dates";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FoodInventoryEditRouteProp = RouteProp<
  RootStackParamList,
  "FoodInventoryEdit"
>;

const storageLocationOptions = [
  { label: "冷蔵庫", value: "fridge" },
  { label: "冷凍庫", value: "freezer" },
  { label: "常温", value: "pantry" },
];

const statusOptions = [
  { label: "利用可能", value: "available" },
  { label: "使用済み", value: "used" },
  { label: "期限切れ", value: "expired" },
  { label: "廃棄済み", value: "discarded" },
];

const unitOptions = [
  { label: "個", value: "個" },
  { label: "本", value: "本" },
  { label: "袋", value: "袋" },
  { label: "パック", value: "パック" },
  { label: "箱", value: "箱" },
  { label: "g", value: "g" },
  { label: "kg", value: "kg" },
  { label: "ml", value: "ml" },
  { label: "L", value: "L" },
  { label: "枚", value: "枚" },
  { label: "束", value: "束" },
  { label: "玉", value: "玉" },
  { label: "尾", value: "尾" },
];

const toDateObject = (value: string) => {
  if (!value) return undefined;

  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return undefined;

  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);

  return new Date(yyyy, mm - 1, dd);
};

const toDateString = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

const formatDateInput = (value?: string | null) => {
  if (!value) return "";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

const isValidDateText = (value: string) => {
  if (!value.trim()) return true;

  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;

  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);

  const d = new Date(yyyy, mm - 1, dd);

  return (
    d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd
  );
};

const toDateValue = (value: string) => {
  if (!value.trim()) return undefined;
  return value.trim();
};

export default function FoodInventoryEditScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FoodInventoryEditRouteProp>();

  const foodInventoryId = route.params?.foodInventoryId;
  const isEditMode = !!foodInventoryId;

  const [ingredientsName, setIngredientsName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [unitMenuVisible, setUnitMenuVisible] = useState(false);
  const [storageLocation, setStorageLocation] = useState("fridge");
  const [description, setDescription] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [purchasedDate, setPurchasedDate] = useState("");
  const [status, setStatus] = useState("available");

  const [storageMenuVisible, setStorageMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  const [ingredientsNameError, setIngredientsNameError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [expirationDateError, setExpirationDateError] = useState("");
  const [purchasedDateError, setPurchasedDateError] = useState("");

  const [loading, setLoading] = useState(false);

  const [expirationDatePickerOpen, setExpirationDatePickerOpen] =
    useState(false);
  const [purchasedDatePickerOpen, setPurchasedDatePickerOpen] = useState(false);

  useEffect(() => {
    const loadFoodInventory = async () => {
      if (!foodInventoryId) return;

      try {
        setLoading(true);

        const result = await client.models.FoodInventory.get({
          id: foodInventoryId,
        });

        const item = result.data;

        if (!item) {
          Alert.alert("エラー", "対象の食材が見つかりません。");
          navigation.goBack();
          return;
        }

        setIngredientsName(item.ingredientsName ?? "");
        setCategory(item.category ?? "");
        setQuantity(item.quantity != null ? String(item.quantity) : "");
        setUnit(item.unit ?? "");
        setStorageLocation(item.storageLocation ?? "fridge");
        setDescription(item.description ?? "");
        setExpirationDate(formatDateInput(item.expirationDate));
        setPurchasedDate(formatDateInput(item.purchasedDate));
        setStatus(item.status ?? "available");
      } catch (e) {
        console.error("loadFoodInventory error:", e);
        Alert.alert("エラー", "食材情報の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    loadFoodInventory();
  }, [foodInventoryId, navigation]);

  const validateForm = () => {
    let valid = true;

    setIngredientsNameError("");
    setQuantityError("");
    setExpirationDateError("");
    setPurchasedDateError("");

    if (!ingredientsName.trim()) {
      setIngredientsNameError("食材名を入力してください。");
      valid = false;
    }

    if (quantity.trim()) {
      const quantityValue = Number(quantity);
      if (Number.isNaN(quantityValue)) {
        setQuantityError("数量は数値で入力してください。");
        valid = false;
      }
    }

    if (!isValidDateText(expirationDate)) {
      setExpirationDateError("消費期限日を正しく選択してください。");
      valid = false;
    }

    if (!isValidDateText(purchasedDate)) {
      setPurchasedDateError("購入日を正しく選択してください。");
      valid = false;
    }

    return valid;
  };

  const onSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const appContext = await getAppContext();

      const quantityValue = quantity.trim() ? Number(quantity) : undefined;

      const input = {
        ingredientsName: ingredientsName.trim(),
        category: category.trim(),
        quantity: quantityValue,
        unit: unit.trim(),
        storageLocation,
        description: description.trim(),
        expirationDate: toDateValue(expirationDate),
        purchasedDate: toDateValue(purchasedDate),
        status,
      };

      if (isEditMode && foodInventoryId) {
        await client.models.FoodInventory.update({
          id: foodInventoryId,
          ...input,
        });

        Alert.alert("完了", "食材情報を更新しました。");
      } else {
        await client.models.FoodInventory.create({
          groupId: appContext.defaultGroupId,
          createdByUserId: appContext.cognitoUserId,
          ...input,
        });

        Alert.alert("完了", "食材を登録しました。");
      }

      navigation.goBack();
    } catch (e) {
      console.error("save FoodInventory error:", e);
      Alert.alert("エラー", "保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const selectedStorageLocationLabel =
    storageLocationOptions.find((item) => item.value === storageLocation)
      ?.label ?? "冷蔵庫";

  const selectedStatusLabel =
    statusOptions.find((item) => item.value === status)?.label ?? "利用可能";

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        {isEditMode ? "食材編集" : "食材登録"}
      </Text>

      <TextInput
        label="食材名"
        value={ingredientsName}
        onChangeText={(text) => {
          setIngredientsName(text);
          if (text.trim()) setIngredientsNameError("");
        }}
        mode="outlined"
        error={!!ingredientsNameError}
        style={{ marginTop: 10 }}
      />
      {ingredientsNameError ? (
        <Text style={{ color: "red", marginTop: 4 }}>
          {ingredientsNameError}
        </Text>
      ) : null}

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
          label="数量"
          value={quantity}
          onChangeText={(text) => {
            setQuantity(text);
            if (!Number.isNaN(Number(text)) || !text.trim()) {
              setQuantityError("");
            }
          }}
          keyboardType="numeric"
          mode="outlined"
          error={!!quantityError}
          style={{ flex: 1, marginRight: 10 }}
        />

        <View style={{ flex: 1 }}>
          <Menu
            visible={unitMenuVisible}
            onDismiss={() => setUnitMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setUnitMenuVisible(true)}
                style={{
                  height: 44,
                  justifyContent: "center",
                }}
              >
                単位：{unit || "未選択"}
              </Button>
            }
          >
            {unitOptions.map((item) => (
              <Menu.Item
                key={item.value}
                title={item.label}
                onPress={() => {
                  setUnit(item.value);
                  setUnitMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        </View>
      </View>
      {quantityError ? (
        <Text style={{ color: "red", marginTop: 4 }}>{quantityError}</Text>
      ) : null}

      <View style={{ marginTop: 10 }}>
        <Menu
          visible={storageMenuVisible}
          onDismiss={() => setStorageMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setStorageMenuVisible(true)}>
              保管場所：{selectedStorageLocationLabel}
            </Button>
          }
        >
          {storageLocationOptions.map((item) => (
            <Menu.Item
              key={item.value}
              title={item.label}
              onPress={() => {
                setStorageLocation(item.value);
                setStorageMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      <TextInput
        label="メモ"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        style={{ marginTop: 10 }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Button
          mode="outlined"
          onPress={() => setExpirationDatePickerOpen(true)}
          style={{
            flex: 1,
            marginRight: 8,
          }}
          contentStyle={{ height: 44 }}
        >
          消費期限日：{expirationDate || "未選択"}
        </Button>

        <Button
          mode="contained"
          buttonColor="#6b7280"
          textColor="#ffffff"
          onPress={() => {
            setExpirationDate("");
            setExpirationDateError("");
          }}
          style={{
            width: 96,
          }}
          contentStyle={{ height: 44 }}
        >
          クリア
        </Button>
      </View>

      {expirationDateError ? (
        <Text style={{ color: "red", marginTop: 4 }}>
          {expirationDateError}
        </Text>
      ) : null}

      <DatePickerModal
        locale="ja"
        mode="single"
        visible={expirationDatePickerOpen}
        onDismiss={() => setExpirationDatePickerOpen(false)}
        date={toDateObject(expirationDate)}
        onConfirm={({ date }) => {
          setExpirationDatePickerOpen(false);

          if (!date) return;

          setExpirationDate(toDateString(date));
          setExpirationDateError("");
        }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Button
          mode="outlined"
          onPress={() => setPurchasedDatePickerOpen(true)}
          style={{
            flex: 1,
            marginRight: 8,
          }}
          contentStyle={{ height: 44 }}
        >
          購入日：{purchasedDate || "未選択"}
        </Button>

        <Button
          mode="contained"
          buttonColor="#6b7280"
          textColor="#ffffff"
          onPress={() => {
            setPurchasedDate("");
            setPurchasedDateError("");
          }}
          style={{
            width: 96,
          }}
          contentStyle={{ height: 44 }}
        >
          クリア
        </Button>
      </View>

      {purchasedDateError ? (
        <Text style={{ color: "red", marginTop: 4 }}>{purchasedDateError}</Text>
      ) : null}

      <DatePickerModal
        locale="ja"
        mode="single"
        visible={purchasedDatePickerOpen}
        onDismiss={() => setPurchasedDatePickerOpen(false)}
        date={toDateObject(purchasedDate)}
        onConfirm={({ date }) => {
          setPurchasedDatePickerOpen(false);

          if (!date) return;

          setPurchasedDate(toDateString(date));
          setPurchasedDateError("");
        }}
      />

      <View style={{ marginTop: 10 }}>
        <Menu
          visible={statusMenuVisible}
          onDismiss={() => setStatusMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setStatusMenuVisible(true)}>
              ステータス：{selectedStatusLabel}
            </Button>
          }
        >
          {statusOptions.map((item) => (
            <Menu.Item
              key={item.value}
              title={item.label}
              onPress={() => {
                setStatus(item.value);
                setStatusMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      <Button
        mode="contained"
        onPress={onSave}
        loading={loading}
        disabled={loading || !ingredientsName.trim()}
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
