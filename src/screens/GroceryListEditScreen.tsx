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
type GroceryListEditRouteProp = RouteProp<
  RootStackParamList,
  "GroceryListEdit"
>;

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

const priorityOptions = ["1", "2", "3", "4", "5"];

const purchasedOptions = [
  { label: "未購入", value: false },
  { label: "購入済み", value: true },
];

export default function GroceryListEditScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GroceryListEditRouteProp>();

  const groceryListId = route.params?.groceryListId;
  const isEditMode = !!groceryListId;

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("3");
  const [isPurchased, setIsPurchased] = useState(false);

  const [unitMenuVisible, setUnitMenuVisible] = useState(false);
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [purchasedMenuVisible, setPurchasedMenuVisible] = useState(false);

  const [itemNameError, setItemNameError] = useState("");
  const [quantityError, setQuantityError] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadGroceryList = async () => {
      if (!groceryListId) return;

      try {
        setLoading(true);

        const result = await client.models.GroceryList.get({
          id: groceryListId,
        });

        const item = result.data;

        if (!item) {
          Alert.alert("エラー", "対象の買うものリストが見つかりません。");
          navigation.goBack();
          return;
        }

        setItemName(item.itemName ?? "");
        setCategory(item.category ?? "");
        setQuantity(item.quantity != null ? String(item.quantity) : "");
        setUnit(item.unit ?? "");
        setDescription(item.description ?? "");
        setPriority(item.priority != null ? String(item.priority) : "3");
        setIsPurchased(item.isPurchased ?? false);
      } catch (e) {
        console.error("loadGroceryList error:", e);
        Alert.alert("エラー", "買うものリストの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    loadGroceryList();
  }, [groceryListId, navigation]);

  const validateForm = () => {
    let valid = true;

    setItemNameError("");
    setQuantityError("");

    if (!itemName.trim()) {
      setItemNameError("アイテム名を入力してください。");
      valid = false;
    }

    if (quantity.trim()) {
      const quantityValue = Number(quantity);
      if (Number.isNaN(quantityValue)) {
        setQuantityError("数量は数値で入力してください。");
        valid = false;
      }
    }

    return valid;
  };

  const onSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const appContext = await getAppContext();

      const quantityValue = quantity.trim() ? Number(quantity) : undefined;
      const priorityValue = priority.trim() ? Number(priority) : undefined;

      const input = {
        itemName: itemName.trim(),
        category: category.trim(),
        quantity: quantityValue,
        unit: unit.trim(),
        description: description.trim(),
        priority: priorityValue,
        isPurchased,
        purchasedAt: isPurchased ? new Date().toISOString() : null,
        purchasedByUserId: isPurchased ? appContext.cognitoUserId : null,
      };

      if (isEditMode && groceryListId) {
        await client.models.GroceryList.update({
          id: groceryListId,
          ...input,
        });

        Alert.alert("完了", "買うものリストを更新しました。");
      } else {
        await client.models.GroceryList.create({
          groupId: appContext.defaultGroupId,
          createdByUserId: appContext.cognitoUserId,
          ...input,
        });

        Alert.alert("完了", "買うものリストを登録しました。");
      }

      navigation.goBack();
    } catch (e) {
      console.error("save GroceryList error:", e);
      Alert.alert("エラー", "保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const selectedPurchasedLabel =
    purchasedOptions.find((item) => item.value === isPurchased)?.label ??
    "未購入";

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        {isEditMode ? "買うもの編集" : "買うもの登録"}
      </Text>

      <TextInput
        label="アイテム名"
        value={itemName}
        onChangeText={(text) => {
          setItemName(text);
          if (text.trim()) setItemNameError("");
        }}
        mode="outlined"
        error={!!itemNameError}
        style={{ marginTop: 10 }}
      />
      {itemNameError ? (
        <Text style={{ color: "red", marginTop: 4 }}>{itemNameError}</Text>
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
                  height: 56,
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

      <TextInput
        label="メモ"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        style={{ marginTop: 10 }}
      />

      <View style={{ marginTop: 10 }}>
        <Menu
          visible={priorityMenuVisible}
          onDismiss={() => setPriorityMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setPriorityMenuVisible(true)}
            >
              優先度：{priority}
            </Button>
          }
        >
          {priorityOptions.map((value) => (
            <Menu.Item
              key={value}
              title={value}
              onPress={() => {
                setPriority(value);
                setPriorityMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      <View style={{ marginTop: 10 }}>
        <Menu
          visible={purchasedMenuVisible}
          onDismiss={() => setPurchasedMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setPurchasedMenuVisible(true)}
            >
              購入状態：{selectedPurchasedLabel}
            </Button>
          }
        >
          {purchasedOptions.map((item) => (
            <Menu.Item
              key={item.label}
              title={item.label}
              onPress={() => {
                setIsPurchased(item.value);
                setPurchasedMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      <Button
        mode="contained"
        onPress={onSave}
        loading={loading}
        disabled={loading || !itemName.trim()}
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
