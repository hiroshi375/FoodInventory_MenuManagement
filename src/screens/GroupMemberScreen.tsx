import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function GroupMemberScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall">食品在庫編集</Text>

      <Button
        mode="contained"
        style={{ marginTop: 16 }}
        onPress={() => navigation.navigate("CraveMenuEdit")}
      >
        新規登録
      </Button>
    </View>
  );
}
