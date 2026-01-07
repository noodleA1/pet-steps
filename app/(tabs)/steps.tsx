import { ScrollView, Text, View, Pressable, StyleSheet, Dimensions } from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function CircularProgress({ value, max, size, strokeWidth, color }: { 
  value: number; 
  max: number; 
  size: number; 
  strokeWidth: number;
  color: string;
}) {
  const colors = useColors();
  const percentage = Math.min(100, (value / max) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Background circle */}
      <View 
        style={[
          styles.circleBackground,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.surface,
          }
        ]} 
      />
      {/* Progress indicator (simplified - using a colored arc effect) */}
      <View 
        style={[
          styles.circleProgress,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: percentage > 25 ? color : "transparent",
            borderRightColor: percentage > 50 ? color : "transparent",
            borderBottomColor: percentage > 75 ? color : "transparent",
            borderLeftColor: percentage > 0 ? color : "transparent",
            transform: [{ rotate: "-90deg" }],
          }
        ]} 
      />
      {/* Center content */}
      <View style={styles.circleCenter}>
        <Text className="text-4xl font-bold text-foreground">{value.toLocaleString()}</Text>
        <Text className="text-sm text-muted">of {max.toLocaleString()}</Text>
      </View>
    </View>
  );
}

function WeeklyBar({ day, steps, maxSteps, isToday }: { day: string; steps: number; maxSteps: number; isToday: boolean }) {
  const colors = useColors();
  const percentage = Math.min(100, (steps / maxSteps) * 100);
  
  return (
    <View className="items-center flex-1">
      <View className="h-32 w-6 bg-surface rounded-full overflow-hidden justify-end">
        <View 
          style={[
            styles.barFill, 
            { 
              height: `${percentage}%`, 
              backgroundColor: isToday ? colors.primary : colors.muted,
            }
          ]} 
        />
      </View>
      <Text className={`text-xs mt-2 ${isToday ? "text-primary font-semibold" : "text-muted"}`}>
        {day}
      </Text>
      <Text className="text-xs text-muted">{steps > 0 ? (steps / 1000).toFixed(1) + "k" : "0"}</Text>
    </View>
  );
}

function StatCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View className="bg-surface rounded-2xl p-4 flex-1 mx-1">
      <View className="flex-row items-center mb-2">
        <IconSymbol name={icon as any} size={20} color={color} />
      </View>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  );
}

export default function StepsScreen() {
  const { state, addSteps } = useGame();
  const colors = useColors();
  
  // Mock weekly data (in a real app, this would come from step history)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1; // Convert Sunday=0 to index 6
  
  const weeklyData = days.map((day, index) => ({
    day,
    steps: index === todayIndex ? state.todaySteps : Math.floor(Math.random() * 8000) + 2000,
    isToday: index === todayIndex,
  }));
  
  const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.steps, 0);
  const dailyAverage = Math.floor(weeklyTotal / 7);
  
  // Calculate XP earned today
  const xpEarned = state.todaySteps; // 1 step = 1 XP
  
  // Calculate consumables earned (every 1000 steps = 1 consumable)
  const consumablesEarned = Math.floor(state.todaySteps / 1000);
  
  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-2xl font-bold text-foreground">Today's Steps</Text>
          <Text className="text-muted">Keep walking to level up your pet!</Text>
        </View>
        
        {/* Circular Progress */}
        <View className="items-center mb-6">
          <CircularProgress 
            value={state.todaySteps} 
            max={state.dailyStepGoal} 
            size={200} 
            strokeWidth={12}
            color={colors.primary}
          />
        </View>
        
        {/* Goal Progress */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold text-foreground">Daily Goal</Text>
            <Text className="text-primary font-medium">
              {Math.min(100, Math.floor((state.todaySteps / state.dailyStepGoal) * 100))}%
            </Text>
          </View>
          <View className="h-3 bg-background rounded-full overflow-hidden">
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(100, (state.todaySteps / state.dailyStepGoal) * 100)}%`,
                  backgroundColor: colors.primary,
                }
              ]} 
            />
          </View>
          <Text className="text-sm text-muted mt-2 text-center">
            {state.todaySteps >= state.dailyStepGoal 
              ? "Goal reached! Keep going for bonus rewards!"
              : `${(state.dailyStepGoal - state.todaySteps).toLocaleString()} steps to reach your goal`}
          </Text>
        </View>
        
        {/* Stats Cards */}
        <View className="flex-row mb-4">
          <StatCard 
            icon="sparkles" 
            value={xpEarned.toLocaleString()} 
            label="XP Earned" 
            color={colors.primary} 
          />
          <StatCard 
            icon="fork.knife" 
            value={consumablesEarned.toString()} 
            label="Items Earned" 
            color={colors.success} 
          />
        </View>
        
        {/* Weekly Chart */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-foreground">This Week</Text>
            <Text className="text-muted">{weeklyTotal.toLocaleString()} total</Text>
          </View>
          <View className="flex-row justify-between">
            {weeklyData.map((data, index) => (
              <WeeklyBar 
                key={index}
                day={data.day}
                steps={data.steps}
                maxSteps={state.dailyStepGoal}
                isToday={data.isToday}
              />
            ))}
          </View>
        </View>
        
        {/* Weekly Stats */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Weekly Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-muted">Weekly Goal</Text>
            <Text className="text-foreground font-medium">{state.weeklyStepGoal.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-muted">Weekly Total</Text>
            <Text className="text-foreground font-medium">{weeklyTotal.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-muted">Daily Average</Text>
            <Text className="text-foreground font-medium">{dailyAverage.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Total Steps (All Time)</Text>
            <Text className="text-foreground font-medium">{state.totalSteps.toLocaleString()}</Text>
          </View>
        </View>
        
        {/* Simulate Steps (for testing) */}
        <View className="gap-2 mb-4">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              addSteps(100);
            }}
            style={({ pressed }) => [
              styles.simulateButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <IconSymbol name="figure.walk" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">+100 Steps</Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              addSteps(1000);
            }}
            style={({ pressed }) => [
              styles.simulateButton,
              { backgroundColor: colors.secondary, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <IconSymbol name="figure.walk" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">+1,000 Steps</Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              addSteps(5000);
            }}
            style={({ pressed }) => [
              styles.simulateButton,
              { backgroundColor: colors.success, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <IconSymbol name="figure.walk" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">+5,000 Steps</Text>
          </Pressable>
        </View>
        
        {/* Health App Connection Notice */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <View className="flex-row items-center">
            <IconSymbol name="bolt.heart.fill" size={24} color={colors.primary} />
            <View className="ml-3 flex-1">
              <Text className="text-foreground font-medium">Connect Health App</Text>
              <Text className="text-sm text-muted">
                Sync with Apple Health or Google Fit for automatic step tracking
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  circleBackground: {
    position: "absolute",
  },
  circleProgress: {
    position: "absolute",
  },
  circleCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  barFill: {
    width: "100%",
    borderRadius: 999,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  simulateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});
