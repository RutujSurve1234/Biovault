// ─── App.js ──────────────────────────────────────────────────────────────────
// Navigation root for BioVault.
// Three screens: Auth → Dashboard → SendTransaction
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-get-random-values";

import AuthScreen from "./screens/AuthScreen";
import DashboardScreen from "./screens/DashboardScreen";
import SendTransactionScreen from "./screens/SendTransactionScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Auth"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: "#0D0D1A" },
            // Smooth slide transition
            gestureEnabled: false,
          }}
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen
            name="SendTransaction"
            component={SendTransactionScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
