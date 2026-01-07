import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, Switch } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const NOTIFICATION_SETTINGS_KEY = "petsteps_notification_settings";

interface NotificationSettings {
  // Pet Care
  hungerAlerts: boolean;
  thirstAlerts: boolean;
  happinessAlerts: boolean;
  criticalCareOnly: boolean; // Only alert at 20% instead of 40%
  
  // Battle
  battleEnergyFull: boolean;
  battleEnergyLow: boolean;
  guildBattleReminder: boolean;
  
  // Goals
  dailyGoalReminder: boolean;
  weeklyGoalProgress: boolean;
  streakReminder: boolean;
  
  // Guild
  guildCompetitionStart: boolean;
  guildCompetitionEnd: boolean;
  guildBattleResults: boolean;
  
  // General
  evolutionReady: boolean;
  breedingReady: boolean;
  eggHatching: boolean;
}

const defaultSettings: NotificationSettings = {
  hungerAlerts: true,
  thirstAlerts: true,
  happinessAlerts: true,
  criticalCareOnly: false,
  battleEnergyFull: true,
  battleEnergyLow: false,
  guildBattleReminder: true,
  dailyGoalReminder: true,
  weeklyGoalProgress: true,
  streakReminder: true,
  guildCompetitionStart: true,
  guildCompetitionEnd: true,
  guildBattleResults: true,
  evolutionReady: true,
  breedingReady: true,
  eggHatching: true,
};

function SettingRow({ 
  icon, 
  title, 
  description, 
  value, 
  onToggle,
  disabled = false,
}: { 
  icon: string; 
  title: string; 
  description: string; 
  value: boolean; 
  onToggle: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  
  return (
    <View 
      className="flex-row items-center py-4 border-b"
      style={{ borderBottomColor: colors.border, opacity: disabled ? 0.5 : 1 }}
    >
      <View 
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${colors.primary}20` }}
      >
        <IconSymbol name={icon as any} size={20} color={colors.primary} />
      </View>
      <View className="flex-1 mr-3">
        <Text className="text-foreground font-medium">{title}</Text>
        <Text className="text-muted text-sm">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={() => {
          if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle();
          }
        }}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="white"
        disabled={disabled}
      />
    </View>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-muted text-sm font-medium uppercase tracking-wide mb-2">{title}</Text>
      <View className="bg-surface rounded-2xl px-4">
        {children}
      </View>
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (saved) {
          setSettings({ ...defaultSettings, ...JSON.parse(saved) });
        }
      } catch (error) {
        console.error("Failed to load notification settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);
  
  // Save settings on change
  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  };
  
  // Toggle all in a category
  const toggleCategory = (keys: (keyof NotificationSettings)[], enable: boolean) => {
    const newSettings = { ...settings };
    keys.forEach(key => {
      newSettings[key] = enable;
    });
    setSettings(newSettings);
    AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-muted">Loading...</Text>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="p-4 pb-0">
          <View className="flex-row items-center mb-4">
            <Pressable onPress={() => router.back()} className="mr-3">
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">Notifications</Text>
          </View>
          
          {/* Quick Actions */}
          <View className="flex-row gap-2 mb-6">
            <Pressable
              onPress={() => {
                const allKeys = Object.keys(defaultSettings) as (keyof NotificationSettings)[];
                toggleCategory(allKeys, true);
              }}
              style={({ pressed }) => [
                styles.quickButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <IconSymbol name="bell.fill" size={16} color="white" />
              <Text className="text-white font-medium ml-2">Enable All</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const allKeys = Object.keys(defaultSettings) as (keyof NotificationSettings)[];
                toggleCategory(allKeys, false);
              }}
              style={({ pressed }) => [
                styles.quickButton,
                { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <IconSymbol name="bell.slash.fill" size={16} color={colors.foreground} />
              <Text className="text-foreground font-medium ml-2">Disable All</Text>
            </Pressable>
          </View>
        </View>
        
        <View className="px-4 pb-4">
          {/* Pet Care */}
          <SettingSection title="Pet Care">
            <SettingRow
              icon="fork.knife"
              title="Hunger Alerts"
              description="Notify when your pet is getting hungry"
              value={settings.hungerAlerts}
              onToggle={() => updateSetting("hungerAlerts", !settings.hungerAlerts)}
            />
            <SettingRow
              icon="drop.fill"
              title="Thirst Alerts"
              description="Notify when your pet needs water"
              value={settings.thirstAlerts}
              onToggle={() => updateSetting("thirstAlerts", !settings.thirstAlerts)}
            />
            <SettingRow
              icon="heart.fill"
              title="Happiness Alerts"
              description="Notify when your pet is feeling sad"
              value={settings.happinessAlerts}
              onToggle={() => updateSetting("happinessAlerts", !settings.happinessAlerts)}
            />
            <SettingRow
              icon="exclamationmark.triangle.fill"
              title="Critical Only"
              description="Only alert when stats drop below 20%"
              value={settings.criticalCareOnly}
              onToggle={() => updateSetting("criticalCareOnly", !settings.criticalCareOnly)}
            />
          </SettingSection>
          
          {/* Battle */}
          <SettingSection title="Battle">
            <SettingRow
              icon="bolt.fill"
              title="Energy Full"
              description="Notify when battle energy is fully recharged"
              value={settings.battleEnergyFull}
              onToggle={() => updateSetting("battleEnergyFull", !settings.battleEnergyFull)}
            />
            <SettingRow
              icon="battery.25"
              title="Energy Low"
              description="Remind to use energy before it caps"
              value={settings.battleEnergyLow}
              onToggle={() => updateSetting("battleEnergyLow", !settings.battleEnergyLow)}
            />
            <SettingRow
              icon="person.3.fill"
              title="Guild Battle Reminder"
              description="Daily reminder to use guild battle energy"
              value={settings.guildBattleReminder}
              onToggle={() => updateSetting("guildBattleReminder", !settings.guildBattleReminder)}
            />
          </SettingSection>
          
          {/* Goals */}
          <SettingSection title="Goals & Streaks">
            <SettingRow
              icon="flag.fill"
              title="Daily Goal Reminder"
              description="Evening reminder if daily goal not met"
              value={settings.dailyGoalReminder}
              onToggle={() => updateSetting("dailyGoalReminder", !settings.dailyGoalReminder)}
            />
            <SettingRow
              icon="chart.bar.fill"
              title="Weekly Progress"
              description="Mid-week update on weekly goal progress"
              value={settings.weeklyGoalProgress}
              onToggle={() => updateSetting("weeklyGoalProgress", !settings.weeklyGoalProgress)}
            />
            <SettingRow
              icon="flame.fill"
              title="Streak Reminder"
              description="Don't break your streak! Daily reminder"
              value={settings.streakReminder}
              onToggle={() => updateSetting("streakReminder", !settings.streakReminder)}
            />
          </SettingSection>
          
          {/* Guild */}
          <SettingSection title="Guild">
            <SettingRow
              icon="trophy.fill"
              title="Competition Start"
              description="Notify when a new competition begins"
              value={settings.guildCompetitionStart}
              onToggle={() => updateSetting("guildCompetitionStart", !settings.guildCompetitionStart)}
            />
            <SettingRow
              icon="checkmark.circle.fill"
              title="Competition End"
              description="Notify when competition ends with results"
              value={settings.guildCompetitionEnd}
              onToggle={() => updateSetting("guildCompetitionEnd", !settings.guildCompetitionEnd)}
            />
            <SettingRow
              icon="bolt.fill"
              title="Guild Battle Results"
              description="Notify when your guild battles complete"
              value={settings.guildBattleResults}
              onToggle={() => updateSetting("guildBattleResults", !settings.guildBattleResults)}
            />
          </SettingSection>
          
          {/* Pet Events */}
          <SettingSection title="Pet Events">
            <SettingRow
              icon="sparkles"
              title="Evolution Ready"
              description="Notify when pet reaches evolution level"
              value={settings.evolutionReady}
              onToggle={() => updateSetting("evolutionReady", !settings.evolutionReady)}
            />
            <SettingRow
              icon="heart.fill"
              title="Breeding Ready"
              description="Notify when pet reaches breeding level"
              value={settings.breedingReady}
              onToggle={() => updateSetting("breedingReady", !settings.breedingReady)}
            />
            <SettingRow
              icon="gift.fill"
              title="Egg Hatching"
              description="Notify when egg is ready to hatch"
              value={settings.eggHatching}
              onToggle={() => updateSetting("eggHatching", !settings.eggHatching)}
            />
          </SettingSection>
          
          {/* Info */}
          <View className="bg-surface rounded-2xl p-4 mt-2">
            <View className="flex-row items-start">
              <IconSymbol name="info.circle.fill" size={20} color={colors.muted} />
              <Text className="text-muted text-sm ml-2 flex-1">
                Notifications require permission. If you're not receiving notifications, 
                check your device settings to ensure PetSteps has notification access.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  quickButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
});
