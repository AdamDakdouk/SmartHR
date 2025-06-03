import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import * as Animatable from "react-native-animatable";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, BackHandler, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";

type TabConfig = {
  name: string;
  title: string;
  iconFocused: keyof typeof Ionicons.glyphMap;
  iconUnfocused: keyof typeof Ionicons.glyphMap;
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const tintColor = themeColors.tint;
  const backgroundColor = themeColors.background;

  // Define inactive color based on theme
  const inactiveColor = colorScheme === "dark" ? "#666666" : "#9CA3AF";

  // Setup back handler for tab screens
  useEffect(() => {
    // This handles Android back button within tabs
    const backAction = () => {
      Alert.alert("Hold on!", "Are you sure you want to exit?", [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        {
          text: "YES",
          onPress: () => BackHandler.exitApp(),
        },
      ]);
      return true; // Prevents default back button behavior
    };

    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }
  }, []);

  const tabs: TabConfig[] = [
    {
      name: "index",
      title: "Home",
      iconFocused: "home",
      iconUnfocused: "home-outline",
    },
    {
      name: "calendar",
      title: "Calendar",
      iconFocused: "calendar-sharp",
      iconUnfocused: "calendar-outline",
    },
    {
      name: "chatbot",
      title: "Chatbot",
      iconFocused: "chatbubble-sharp",
      iconUnfocused: "chatbubble-outline",
    },
    {
      name: "profile",
      title: "Profile",
      iconFocused: "person-circle-sharp",
      iconUnfocused: "person-circle-outline",
    },
  ];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor,
          height: 75,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 20,
          paddingTop: 0,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8, // Android shadow
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                name={focused ? tab.iconFocused : tab.iconUnfocused}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

interface AnimatedTabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  name,
  color,
  focused,
}) => {
  return (
    <Animatable.View
      animation={focused ? "bounceIn" : undefined}
      duration={500}
      style={[
        styles.iconContainer,
        { transform: [{ scale: focused ? 1.2 : 1 }] },
      ]}
    >
      <TabBarIcon name={name} color={color} />
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
});
