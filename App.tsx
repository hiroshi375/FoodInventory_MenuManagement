import "./amplifyConfig";

import { useEffect, useState } from "react";
import { View } from "react-native";
import { withAuthenticator } from "@aws-amplify/ui-react-native";
import { ActivityIndicator, PaperProvider, Text } from "react-native-paper";

import RootNavigator from "./src/navigation/RootNavigator";
import { bootstrapUser } from "./src/lib/bootstrapUser";
import type { RootStackParamList } from "./src/navigation/RootNavigator";

type InitialRouteName = keyof RootStackParamList;

function App() {
  const [loading, setLoading] = useState(true);
  const [initialRouteName, setInitialRouteName] =
    useState<InitialRouteName>("Home");

  useEffect(() => {
    const initialize = async () => {
      try {
        const result = await bootstrapUser();

        const needsProfileSetup =
          !result.displayName?.trim() || !result.defaultGroupId;

        if (needsProfileSetup) {
          setInitialRouteName("Profile");
        } else {
          setInitialRouteName("Home");
        }
      } catch (e) {
        console.error("bootstrapUser error:", e);

        // User作成や状態確認に失敗した場合も、まずプロフィール設定へ誘導する
        setInitialRouteName("Profile");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  if (loading) {
    return (
      <PaperProvider>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 12 }}>起動準備中...</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <RootNavigator initialRouteName={initialRouteName} />
    </PaperProvider>
  );
}

export default withAuthenticator(App, {
  loginMechanisms: ["email"],
});
