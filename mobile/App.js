import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/store/AppContext';
import { colors } from './src/theme/theme';
import { Loader } from './src/components/ui';
import LevelUpModal from './src/components/LevelUpModal';
import LockdownOverlay from './src/components/LockdownOverlay';
import AchievementModal from './src/components/AchievementModal';

import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import QuestsScreen from './src/screens/QuestsScreen';
import DietScreen from './src/screens/DietScreen';
import StepsScreen from './src/screens/StepsScreen';
import CombatScreen from './src/screens/CombatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SystemScreen from './src/screens/SystemScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import MoreScreen from './src/screens/MoreScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StrengthScreen from './src/screens/StrengthScreen';
import PaywallScreen from './src/screens/PaywallScreen';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bgDarker, text: colors.text, border: colors.border, primary: colors.purple },
};

const ICONS = {
  Dashboard: 'view-dashboard',
  Quests: 'sword-cross',
  Diet: 'food-apple',
  Steps: 'shoe-print',
  Progress: 'chart-line-variant',
  More: 'dots-horizontal',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgDarker,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.purpleLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Quests" component={QuestsScreen} />
      <Tab.Screen name="Diet" component={DietScreen} />
      <Tab.Screen name="Steps" component={StepsScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs" component={MainTabs} />
      <MainStack.Screen name="Combat" component={CombatScreen} />
      <MainStack.Screen name="System" component={SystemScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
      <MainStack.Screen name="Strength" component={StrengthScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="Paywall" component={PaywallScreen} />
    </MainStack.Navigator>
  );
}

function Root() {
  const { ready, profile, body, bootstrap, pendingLevelUp, clearLevelUp, punishmentStatus, newAchievements, clearAchievements } = useApp();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      await bootstrap();
      setBooting(false);
    })();
  }, [bootstrap]);

  if (booting || !ready) {
    return (
      <View style={styles.center}>
        <Loader label="Loading System..." />
      </View>
    );
  }

  const onboarded = !!(profile && body);

  return (
    <>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!onboarded ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>

      {pendingLevelUp && (
        <LevelUpModal level={pendingLevelUp.level} rank={pendingLevelUp.rank} onClose={clearLevelUp} />
      )}

      {onboarded && newAchievements?.length > 0 && (
        <AchievementModal achievements={newAchievements} onClose={clearAchievements} />
      )}

      {onboarded && punishmentStatus?.hasLockdown && <LockdownOverlay />}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <Root />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
