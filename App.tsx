import "./amplifyConfig";

import { withAuthenticator } from "@aws-amplify/ui-react-native";
import { PaperProvider } from "react-native-paper";
import RootNavigator from "./src/navigation/RootNavigator";

function App() {
  return (
    <PaperProvider>
      <RootNavigator />
    </PaperProvider>
  );
}

export default withAuthenticator(App, {
  loginMechanisms: ["email"],
});
