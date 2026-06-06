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

type CraveMenu = Schema["CraveMenuList"]["type"];

export default function CraveMenuScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [menus, setMenus] = useState<CraveMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const getPriorityCardColor = (priority?: number | null) => {
    switch (priority) {
      case 5:
        return "#1e40af"; // 濃い青
      case 4:
        return "#3b82f6";
      case 3:
        return "#93c5fd";
      case 2:
        return "#bfdbfe";
      case 1:
        return "#dbeafe"; // 薄い青
      default:
        return "#ffffff"; // 未設定
    }
  };
  const loadMenus = useCallback(async () => {
    try {
      setLoading(true);

      const appContext = await getAppContext();

      const result = await client.models.CraveMenuList.list({
        filter: {
          groupId: {
            eq: appContext.defaultGroupId,
          },
        },
      });

      const sortedMenus = [...result.data].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      setMenus(sortedMenus);
    } catch (e) {
      console.error("loadMenus error:", e);
      Alert.alert("エラー", "食べたいメニューの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMenus();
    }, [loadMenus]),
  );

  const onDelete = async (id: string) => {
    Alert.alert("確認", "このメニューを削除しますか？", [
      {
        text: "キャンセル",
        style: "cancel",
      },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await client.models.CraveMenuList.delete({ id });
            await loadMenus();
          } catch (e) {
            console.error("delete CraveMenu error:", e);
            Alert.alert("エラー", "削除に失敗しました。");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: CraveMenu }) => {
    return (
      <Card
        style={{
          marginBottom: 10,
          backgroundColor: getPriorityCardColor(item.priority),
        }}
        onPress={() =>
          navigation.navigate("CraveMenuEdit", {
            craveMenuId: item.id,
          })
        }
      >
        <Card.Content>
          <Text variant="titleMedium">{item.menuName}</Text>

          {item.description ? (
            <Text style={{ marginTop: 4 }}>{item.description}</Text>
          ) : null}

          <View style={{ marginTop: 8 }}>
            <Text>カテゴリー：{item.category || "未設定"}</Text>
            <Text>理由：{item.cravingReason || "未設定"}</Text>
            <Text>ステータス：{item.status || "active"}</Text>
          </View>
        </Card.Content>

        <Card.Actions>
          <Button
            mode="contained"
            buttonColor="#ffffff"
            textColor="#000000"
            onPress={() =>
              navigation.navigate("CraveMenuEdit", {
                craveMenuId: item.id,
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
          食べたいメニュー
        </Text>

        {menus.length === 0 && !loading ? (
          <Text style={{ marginTop: 20 }}>
            食べたいメニューはまだ登録されていません。
          </Text>
        ) : null}

        <FlatList
          data={menus}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={loadMenus}
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
        onPress={() => navigation.navigate("CraveMenuEdit")}
      />
    </View>
  );
}
