import { useEffect, useRef, useCallback, useState } from "react";
import { Platform, AppState, type AppStateStatus } from "react-native";
import { Pedometer } from "expo-sensors";

interface StepTrackerConfig {
  onStepsUpdate: (steps: number) => void;
  enabled?: boolean;
}

interface StepTrackerState {
  isAvailable: boolean;
  isPedometerAvailable: boolean;
  currentStepCount: number;
  error: string | null;
  permissionStatus: "unknown" | "granted" | "denied";
}

/**
 * Hook for tracking steps using device pedometer
 * Falls back to simulated steps for testing on web/simulator
 */
export function useStepTracker({ onStepsUpdate, enabled = true }: StepTrackerConfig) {
  const [state, setState] = useState<StepTrackerState>({
    isAvailable: false,
    isPedometerAvailable: false,
    currentStepCount: 0,
    error: null,
    permissionStatus: "unknown",
  });
  
  const subscriptionRef = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);
  const lastStepCountRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  
  // Check pedometer availability
  const checkAvailability = useCallback(async () => {
    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      setState(prev => ({
        ...prev,
        isPedometerAvailable: isAvailable,
        isAvailable: isAvailable || Platform.OS === "web", // Web uses simulation
      }));
      return isAvailable;
    } catch (error) {
      console.error("Error checking pedometer availability:", error);
      setState(prev => ({
        ...prev,
        error: "Failed to check pedometer availability",
        isAvailable: Platform.OS === "web",
      }));
      return false;
    }
  }, []);
  
  // Request permissions and start tracking
  const startTracking = useCallback(async () => {
    if (Platform.OS === "web") {
      // Web doesn't have pedometer, use simulation mode
      setState(prev => ({
        ...prev,
        isAvailable: true,
        permissionStatus: "granted",
      }));
      return true;
    }
    
    try {
      const isAvailable = await checkAvailability();
      
      if (!isAvailable) {
        setState(prev => ({
          ...prev,
          error: "Pedometer not available on this device",
        }));
        return false;
      }
      
      // Request permissions (iOS)
      const permission = await Pedometer.requestPermissionsAsync();
      
      if (permission.status !== "granted") {
        setState(prev => ({
          ...prev,
          permissionStatus: "denied",
          error: "Permission to access pedometer was denied",
        }));
        return false;
      }
      
      setState(prev => ({
        ...prev,
        permissionStatus: "granted",
      }));
      
      // Start watching step count
      subscriptionRef.current = Pedometer.watchStepCount(result => {
        const newSteps = result.steps - lastStepCountRef.current;
        if (newSteps > 0) {
          setState(prev => ({
            ...prev,
            currentStepCount: prev.currentStepCount + newSteps,
          }));
          onStepsUpdate(newSteps);
        }
        lastStepCountRef.current = result.steps;
      });
      
      return true;
    } catch (error) {
      console.error("Error starting step tracking:", error);
      setState(prev => ({
        ...prev,
        error: "Failed to start step tracking",
      }));
      return false;
    }
  }, [checkAvailability, onStepsUpdate]);
  
  // Stop tracking
  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);
  
  // Get steps for a date range (for historical data)
  const getStepsForDateRange = useCallback(async (start: Date, end: Date): Promise<number> => {
    if (Platform.OS === "web") {
      // Return simulated data for web
      return 0;
    }
    
    try {
      const result = await Pedometer.getStepCountAsync(start, end);
      return result.steps;
    } catch (error) {
      console.error("Error getting step count for date range:", error);
      return 0;
    }
  }, []);
  
  // Get today's steps
  const getTodaySteps = useCallback(async (): Promise<number> => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return getStepsForDateRange(startOfDay, now);
  }, [getStepsForDateRange]);
  
  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App came to foreground - sync steps
        if (Platform.OS !== "web" && state.permissionStatus === "granted") {
          const todaySteps = await getTodaySteps();
          const newSteps = todaySteps - state.currentStepCount;
          if (newSteps > 0) {
            setState(prev => ({
              ...prev,
              currentStepCount: todaySteps,
            }));
            onStepsUpdate(newSteps);
          }
        }
      }
      appStateRef.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [getTodaySteps, onStepsUpdate, state.currentStepCount, state.permissionStatus]);
  
  // Start/stop tracking based on enabled prop
  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }
    
    return () => stopTracking();
  }, [enabled, startTracking, stopTracking]);
  
  // Simulate steps (for testing/web)
  const simulateSteps = useCallback((count: number) => {
    setState(prev => ({
      ...prev,
      currentStepCount: prev.currentStepCount + count,
    }));
    onStepsUpdate(count);
  }, [onStepsUpdate]);
  
  return {
    ...state,
    startTracking,
    stopTracking,
    getTodaySteps,
    getStepsForDateRange,
    simulateSteps,
  };
}

/**
 * Calculate adaptive step goals based on user's walking history
 * @param recentDailySteps - Array of recent daily step counts
 * @returns Recommended daily and weekly step goals
 */
export function calculateAdaptiveGoals(recentDailySteps: number[]): {
  dailyGoal: number;
  weeklyGoal: number;
  tier: "sedentary" | "light" | "moderate" | "active" | "very_active";
} {
  if (recentDailySteps.length === 0) {
    return {
      dailyGoal: 5000,
      weeklyGoal: 35000,
      tier: "light",
    };
  }
  
  const average = recentDailySteps.reduce((a, b) => a + b, 0) / recentDailySteps.length;
  
  // Tier the user based on their average
  let tier: "sedentary" | "light" | "moderate" | "active" | "very_active";
  let dailyGoal: number;
  
  if (average < 3000) {
    tier = "sedentary";
    dailyGoal = Math.max(3000, Math.ceil(average * 1.2)); // 20% increase, min 3000
  } else if (average < 5000) {
    tier = "light";
    dailyGoal = Math.ceil(average * 1.15); // 15% increase
  } else if (average < 7500) {
    tier = "moderate";
    dailyGoal = Math.ceil(average * 1.1); // 10% increase
  } else if (average < 10000) {
    tier = "active";
    dailyGoal = Math.ceil(average * 1.08); // 8% increase
  } else {
    tier = "very_active";
    dailyGoal = Math.min(20000, Math.ceil(average * 1.05)); // 5% increase, max 20000
  }
  
  // Round to nearest 500
  dailyGoal = Math.round(dailyGoal / 500) * 500;
  
  return {
    dailyGoal,
    weeklyGoal: dailyGoal * 7,
    tier,
  };
}

/**
 * Calculate XP earned from steps using RPG-style leveling curve
 * 1 step = 1 XP
 */
export function calculateXpFromSteps(steps: number): number {
  return steps;
}
