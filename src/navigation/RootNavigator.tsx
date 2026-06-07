import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import GroupScreen from "../screens/GroupScreen";
import GroupMemberScreen from "../screens/GroupMemberScreen";

import CraveMenuScreen from "../screens/CraveMenuScreen";
import CraveMenuEditScreen from "../screens/CraveMenuEditScreen";

import FoodInventoryScreen from "../screens/FoodInventoryScreen";
import FoodInventoryEditScreen from "../screens/FoodInventoryEditScreen";
import ExpirationListScreen from "../screens/ExpirationListScreen";

import GroceryListScreen from "../screens/GroceryListScreen";
import GroceryListEditScreen from "../screens/GroceryListEditScreen";
import GrocerySuggestionScreen from "../screens/GrocerySuggestionScreen";

import MealLogScreen from "../screens/MealLogScreen";
import MealLogEditScreen from "../screens/MealLogEditScreen";
import MealPhotoAnalysisScreen from "../screens/MealPhotoAnalysisScreen";

import CalendarScreen from "../screens/CalendarScreen";
import CalendarDayDetailScreen from "../screens/CalendarDayDetailScreen";
import CalendarEditScreen from "../screens/CalendarEditScreen";

import RecipeScreen from "../screens/RecipeScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import RecipeEditScreen from "../screens/RecipeEditScreen";
import RecipeSuggestionScreen from "../screens/RecipeSuggestionScreen";

import SettingsScreen from "../screens/SettingsScreen";
import AiSuggestionReviewScreen from "../screens/AiSuggestionReviewScreen";

export type RootStackParamList = {
  Home: undefined;

  Profile: undefined;
  Group: undefined;
  GroupMember: { groupId: string };

  CraveMenu: undefined;
  CraveMenuEdit: { craveMenuId?: string } | undefined;

  FoodInventory: undefined;
  FoodInventoryEdit: { foodInventoryId?: string } | undefined;
  ExpirationList: undefined;

  GroceryList: undefined;
  GroceryListEdit: { groceryListId?: string } | undefined;
  GrocerySuggestion: undefined;

  MealLog: undefined;
  MealLogEdit: { mealLogId?: string } | undefined;
  MealPhotoAnalysis: undefined;

  Calendar: undefined;
  CalendarDayDetail: { date: string };
  CalendarEdit: { calendarId?: string; date?: string } | undefined;

  Recipe: undefined;
  RecipeDetail: { recipeId: string };
  RecipeEdit: { recipeId?: string } | undefined;
  RecipeSuggestion: { menuName?: string } | undefined;

  Settings: undefined;
  AiSuggestionReview: {
    suggestion: {
      title: string;
      description?: string;
      category?: string;
      ingredients: string[];
      steps: string[];
    };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
  initialRouteName?: keyof RootStackParamList;
};

export default function RootNavigator({ initialRouteName = "Home" }: Props) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        {/* 既存の Stack.Screen はそのまま */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "ホーム" }}
        />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "プロフィール" }}
        />
        <Stack.Screen
          name="Group"
          component={GroupScreen}
          options={{ title: "グループ管理" }}
        />
        <Stack.Screen
          name="GroupMember"
          component={GroupMemberScreen}
          options={{ title: "メンバー管理" }}
        />

        <Stack.Screen
          name="CraveMenu"
          component={CraveMenuScreen}
          options={{ title: "食べたいメニュー" }}
        />
        <Stack.Screen
          name="CraveMenuEdit"
          component={CraveMenuEditScreen}
          options={{ title: "食べたいメニュー登録・編集" }}
        />

        <Stack.Screen
          name="FoodInventory"
          component={FoodInventoryScreen}
          options={{ title: "今ある食材" }}
        />
        <Stack.Screen
          name="FoodInventoryEdit"
          component={FoodInventoryEditScreen}
          options={{ title: "食材登録・編集" }}
        />
        <Stack.Screen
          name="ExpirationList"
          component={ExpirationListScreen}
          options={{ title: "期限一覧" }}
        />

        <Stack.Screen
          name="GroceryList"
          component={GroceryListScreen}
          options={{ title: "買うものリスト" }}
        />
        <Stack.Screen
          name="GroceryListEdit"
          component={GroceryListEditScreen}
          options={{ title: "買うもの登録・編集" }}
        />
        <Stack.Screen
          name="GrocerySuggestion"
          component={GrocerySuggestionScreen}
          options={{ title: "買うもの自動提案" }}
        />

        <Stack.Screen
          name="MealLog"
          component={MealLogScreen}
          options={{ title: "食事の記録" }}
        />
        <Stack.Screen
          name="MealLogEdit"
          component={MealLogEditScreen}
          options={{ title: "食事記録登録・編集" }}
        />
        <Stack.Screen
          name="MealPhotoAnalysis"
          component={MealPhotoAnalysisScreen}
          options={{ title: "食事写真AI解析" }}
        />

        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: "カレンダー" }}
        />
        <Stack.Screen
          name="CalendarDayDetail"
          component={CalendarDayDetailScreen}
          options={{ title: "日別詳細" }}
        />
        <Stack.Screen
          name="CalendarEdit"
          component={CalendarEditScreen}
          options={{ title: "予定登録・編集" }}
        />

        <Stack.Screen
          name="Recipe"
          component={RecipeScreen}
          options={{ title: "レシピ" }}
        />
        <Stack.Screen
          name="RecipeDetail"
          component={RecipeDetailScreen}
          options={{ title: "レシピ詳細" }}
        />
        <Stack.Screen
          name="RecipeEdit"
          component={RecipeEditScreen}
          options={{ title: "レシピ登録・編集" }}
        />
        <Stack.Screen
          name="RecipeSuggestion"
          component={RecipeSuggestionScreen}
          options={{ title: "レシピAI提案" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "設定" }}
        />
        <Stack.Screen
          name="AiSuggestionReview"
          component={AiSuggestionReviewScreen}
          options={{ title: "AI提案レビュー" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
