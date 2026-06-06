import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ExpirationListScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall">期限切れリスト</Text>

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
