import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OfflineDownloadScreen from '../screens/Settings/OfflineDownloadScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import SearchScreen from '../screens/Home/SearchScreen';
import ReaderScreen from '../screens/Reader/ReaderScreen';
import ReaderListScreen from '../screens/Reader/ReaderListScreen';
import BookmarksScreen from '../screens/Bookmarks/BookmarksScreen';
import PrayerTimesScreen from '../screens/PrayerTimes/PrayerTimesScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Home: '🏠',
  Bookmarks: '🔖',
  PrayerTimes: '🕌',
  Settings: '⚙️',
};

function HomeStack({ screenOptions }) {
  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReaderList" component={ReaderListScreen} options={{ headerShown: true, title: 'Collection' }} />
      <Stack.Screen name="OfflineDownload" component={OfflineDownloadScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function BookmarksStack({ screenOptions }) {
  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <Stack.Screen name="BookmarksMain" component={BookmarksScreen} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function SettingsStack({ screenOptions }) {
  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="OfflineDownload" component={OfflineDownloadScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, spacing, radius } = useTheme();
  const screenOptions = {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '500', fontSize: 16 },
    headerShadowVisible: false,
  };
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.navBg,
            borderTopWidth: 0.5,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textDim,
          tabBarLabelStyle: { fontSize: 11 },
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
              {TAB_ICONS[route.name]}
            </Text>
          ),
        })}
      >
        <Tab.Screen name="Home">{() => <HomeStack screenOptions={screenOptions} />}</Tab.Screen>
        <Tab.Screen name="Bookmarks">{() => <BookmarksStack screenOptions={screenOptions} />}</Tab.Screen>
        <Tab.Screen name="PrayerTimes" component={PrayerTimesScreen} />
        <Tab.Screen name="Settings">{() => <SettingsStack screenOptions={screenOptions} />}</Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}