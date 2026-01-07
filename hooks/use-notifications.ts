import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Storage keys
const NOTIFICATION_SETTINGS_KEY = "petsteps_notification_settings";
const PUSH_TOKEN_KEY = "petsteps_push_token";

export interface NotificationSettings {
  enabled: boolean;
  petCareReminders: boolean;
  battleEnergyAlerts: boolean;
  guildCompetitions: boolean;
  dailyGoalReminders: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  petCareReminders: true,
  battleEnergyAlerts: true,
  guildCompetitions: true,
  dailyGoalReminders: true,
};

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [permissionStatus, setPermissionStatus] = useState<string>("undetermined");
  const notificationListener = useRef<{ remove: () => void } | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    // Load saved settings
    loadSettings();
    
    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) setExpoPushToken(token);
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    // Listen for notification responses (when user taps)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification response:", response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    await saveSettings(newSettings);
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    // Handle navigation based on notification type
    if (data?.type === "pet_care") {
      // Navigate to pet screen
    } else if (data?.type === "battle_energy") {
      // Navigate to battle screen
    } else if (data?.type === "guild_competition") {
      // Navigate to guild screen
    }
  };

  return {
    expoPushToken,
    settings,
    permissionStatus,
    updateSetting,
    saveSettings,
    schedulePetCareReminder,
    scheduleBattleEnergyNotification,
    scheduleGuildCompetitionNotification,
    cancelAllNotifications,
    cancelNotificationsByType,
  };
}

// Register for push notifications
async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF6B35",
    });

    // Create specific channels for different notification types
    await Notifications.setNotificationChannelAsync("pet-care", {
      name: "Pet Care Reminders",
      description: "Reminders when your pet needs food, water, or attention",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF6B35",
    });

    await Notifications.setNotificationChannelAsync("battle", {
      name: "Battle Notifications",
      description: "Alerts when battle energy is refilled",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#6366F1",
    });

    await Notifications.setNotificationChannelAsync("guild", {
      name: "Guild Competitions",
      description: "Announcements for guild competition events",
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#22C55E",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "pet-steps", // Replace with actual Expo project ID
      });
      token = tokenData.data;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    } catch (error) {
      console.error("Error getting push token:", error);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

// Schedule pet care reminder
export async function schedulePetCareReminder(
  type: "hunger" | "thirst" | "happiness",
  petName: string,
  currentLevel: number
): Promise<string | null> {
  const titles = {
    hunger: `${petName} is getting hungry! 🍖`,
    thirst: `${petName} needs water! 💧`,
    happiness: `${petName} wants to play! 🎮`,
  };

  const bodies = {
    hunger: `Your pet's hunger is at ${currentLevel}%. Feed them to keep their defense strong!`,
    thirst: `Your pet's thirst is at ${currentLevel}%. Give them water to maintain their crit rate!`,
    happiness: `Your pet's happiness is at ${currentLevel}%. Play with them to boost their attack!`,
  };

  // Schedule notification for when level drops below threshold
  const trigger: Notifications.NotificationTriggerInput = currentLevel <= 30 
    ? null // Immediate if critical
    : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 30 }; // 30 minutes if not critical

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: titles[type],
        body: bodies[type],
        data: { type: "pet_care", careType: type },
        sound: true,
        badge: 1,
      },
      trigger,
    });
    return id;
  } catch (error) {
    console.error("Failed to schedule pet care reminder:", error);
    return null;
  }
}

// Schedule battle energy refill notification
export async function scheduleBattleEnergyNotification(
  minutesUntilFull: number,
  currentEnergy: number,
  maxEnergy: number
): Promise<string | null> {
  if (currentEnergy >= maxEnergy) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Battle Energy Restored! ⚡",
        body: `Your battle energy is now full (${maxEnergy}/${maxEnergy}). Time to battle!`,
        data: { type: "battle_energy" },
        sound: true,
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutesUntilFull * 60,
      },
    });
    return id;
  } catch (error) {
    console.error("Failed to schedule battle energy notification:", error);
    return null;
  }
}

// Schedule single energy point notification
export async function scheduleEnergyPointNotification(
  minutesUntilNext: number
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Battle Energy +1 ⚡",
        body: "You've gained 1 battle energy. Ready for another fight?",
        data: { type: "battle_energy" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutesUntilNext * 60,
      },
    });
    return id;
  } catch (error) {
    console.error("Failed to schedule energy point notification:", error);
    return null;
  }
}

// Schedule guild competition notification
export async function scheduleGuildCompetitionNotification(
  type: "start" | "ending_soon" | "end" | "results",
  guildName?: string,
  competitionDetails?: string
): Promise<string | null> {
  const content = {
    start: {
      title: "Guild Competition Started! 🏆",
      body: `The bi-weekly guild competition has begun! Walk and battle to earn points for ${guildName || "your guild"}!`,
    },
    ending_soon: {
      title: "Competition Ending Soon! ⏰",
      body: "Only 24 hours left in the guild competition. Make every step count!",
    },
    end: {
      title: "Competition Ended! 🎉",
      body: "The guild competition has ended. Check the results to see how your guild performed!",
    },
    results: {
      title: "Competition Results Are In! 📊",
      body: competitionDetails || "See how your guild ranked in the competition!",
    },
  };

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: content[type].title,
        body: content[type].body,
        data: { type: "guild_competition", competitionType: type },
        sound: true,
        badge: 1,
      },
      trigger: null, // Immediate - server will trigger at appropriate time
    });
    return id;
  } catch (error) {
    console.error("Failed to schedule guild competition notification:", error);
    return null;
  }
}

// Schedule daily goal reminder
export async function scheduleDailyGoalReminder(
  currentSteps: number,
  goalSteps: number,
  hoursUntilEndOfDay: number
): Promise<string | null> {
  const stepsRemaining = goalSteps - currentSteps;
  if (stepsRemaining <= 0) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Goal Reminder 🎯",
        body: `You need ${stepsRemaining.toLocaleString()} more steps to reach your daily goal! Keep walking!`,
        data: { type: "daily_goal" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.min(hoursUntilEndOfDay * 3600, 4 * 3600), // Remind in 4 hours or before end of day
      },
    });
    return id;
  } catch (error) {
    console.error("Failed to schedule daily goal reminder:", error);
    return null;
  }
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Cancel notifications by type
export async function cancelNotificationsByType(type: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Get all scheduled notifications
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
