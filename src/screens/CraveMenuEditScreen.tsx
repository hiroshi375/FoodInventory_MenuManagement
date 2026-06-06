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
type CraveMenuEditRouteProp = RouteProp<RootStackParamList, "CraveMenuEdit">;

const statusOptions = [
  { label: "未対応", value: "active" },
  { label: "食べた", value: "cooked" },
  { label: "アーカイブ", value: "archived" },
];

const priorityOptions = ["5", "4", "3", "2", "1"];

export default function CraveMenuEditScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CraveMenuEditRouteProp>();

  const craveMenuId = route.params?.craveMenuId;

  const [menuName, setMenuName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("3");
  const [cravingReason, setCravingReason] = useState("");
  const [status, setStatus] = useState("active");

  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  const [menuNameError, setMenuNameError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditMode = !!craveMenuId;

  useEffect(() => {
    const loadCraveMenu = async () => {
      if (!craveMenuId) return;

      try {
        setLoading(true);

        const result = await client.models.CraveMenuList.get({
          id: craveMenuId,
        });

        const item = result.data;

        if (!item) {
          Alert.alert("エラー", "対象のメニューが見つかりません。");
          navigation.goBack();
          return;
        }

        setMenuName(item.menuName ?? "");
        setDescription(item.description ?? "");
        setCategory(item.category ?? "");
        setPriority(item.priority != null ? String(item.priority) : "3");
        setCravingReason(item.cravingReason ?? "");
        setStatus(item.status ?? "active");
      } catch (e) {
        console.error("loadCraveMenu error:", e);
        Alert.alert("エラー", "食べたいメニューの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    loadCraveMenu();
  }, [craveMenuId, navigation]);

  const validateForm = () => {
    let valid = true;

    setMenuNameError("");

    if (!menuName.trim()) {
      setMenuNameError("メニュー名を入力してください。");
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
        menuName: menuName.trim(),
        description: description.trim(),
        category: category.trim(),
        priority: Number(priority),
        cravingReason: cravingReason.trim(),
        status,
      };

      if (isEditMode && craveMenuId) {
        await client.models.CraveMenuList.update({
          id: craveMenuId,
          ...input,
        });

        Alert.alert("完了", "食べたいメニューを更新しました。");
      } else {
        await client.models.CraveMenuList.create({
          groupId: appContext.defaultGroupId,
          createdByUserId: appContext.cognitoUserId,
          ...input,
        });

        Alert.alert("完了", "食べたいメニューを登録しました。");
      }

      navigation.goBack();
    } catch (e) {
      console.error("save CraveMenu error:", e);
      Alert.alert("エラー", "保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const selectedStatusLabel =
    statusOptions.find((item) => item.value === status)?.label ?? "未対応";

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
        {isEditMode ? "食べたいメニュー編集" : "食べたいメニュー登録"}
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

      <View style={{ marginTop: 10 }}>
        <Menu
          visible={priorityMenuVisible}
          onDismiss={() => setPriorityMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setPriorityMenuVisible(true)}
            >
              食べたい度：{priority}
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

      <TextInput
        label="食べたい理由"
        value={cravingReason}
        onChangeText={setCravingReason}
        mode="outlined"
        multiline
        style={{ marginTop: 10 }}
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
