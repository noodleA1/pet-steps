import { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface CountdownTimerProps {
  endTime: Date;
  onComplete?: () => void;
  showUrgent?: boolean; // Show urgent styling when < 24 hours
  compact?: boolean; // Smaller display for inline use
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeRemaining(endTime: Date): TimeRemaining {
  const total = endTime.getTime() - Date.now();
  
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  
  return { days, hours, minutes, seconds, total };
}

function padNumber(num: number): string {
  return num.toString().padStart(2, "0");
}

export function CountdownTimer({ endTime, onComplete, showUrgent = true, compact = false }: CountdownTimerProps) {
  const colors = useColors();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining(endTime));
  
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(endTime);
      setTimeRemaining(remaining);
      
      if (remaining.total <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endTime, onComplete]);
  
  const isUrgent = showUrgent && timeRemaining.days === 0 && timeRemaining.total > 0;
  const isEnded = timeRemaining.total <= 0;
  
  if (isEnded) {
    return (
      <View className="flex-row items-center">
        <IconSymbol name="checkmark.circle.fill" size={compact ? 16 : 20} color={colors.success} />
        <Text 
          className="font-semibold ml-1"
          style={{ color: colors.success, fontSize: compact ? 12 : 14 }}
        >
          Competition Ended
        </Text>
      </View>
    );
  }
  
  if (compact) {
    // Compact inline display
    return (
      <View className="flex-row items-center">
        {isUrgent && (
          <IconSymbol name="exclamationmark.triangle.fill" size={14} color={colors.warning} />
        )}
        <Text 
          className="font-medium ml-1"
          style={{ color: isUrgent ? colors.warning : colors.foreground, fontSize: 12 }}
        >
          {timeRemaining.days > 0 
            ? `${timeRemaining.days}d ${padNumber(timeRemaining.hours)}h`
            : `${padNumber(timeRemaining.hours)}:${padNumber(timeRemaining.minutes)}:${padNumber(timeRemaining.seconds)}`
          }
        </Text>
      </View>
    );
  }
  
  // Full countdown display
  return (
    <View 
      className="rounded-2xl p-4"
      style={{ backgroundColor: isUrgent ? `${colors.warning}20` : colors.surface }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-center mb-3">
        {isUrgent ? (
          <>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.warning} />
            <Text 
              className="font-bold text-base ml-2"
              style={{ color: colors.warning }}
            >
              Competition Ending Soon!
            </Text>
          </>
        ) : (
          <>
            <IconSymbol name="clock.fill" size={20} color={colors.primary} />
            <Text 
              className="font-bold text-base ml-2"
              style={{ color: colors.foreground }}
            >
              Time Remaining
            </Text>
          </>
        )}
      </View>
      
      {/* Countdown digits */}
      <View className="flex-row justify-center items-center">
        {timeRemaining.days > 0 && (
          <>
            <TimeUnit 
              value={timeRemaining.days} 
              label="Days" 
              isUrgent={isUrgent}
            />
            <Text 
              className="text-2xl font-bold mx-1"
              style={{ color: isUrgent ? colors.warning : colors.muted }}
            >
              :
            </Text>
          </>
        )}
        <TimeUnit 
          value={timeRemaining.hours} 
          label="Hours" 
          isUrgent={isUrgent}
        />
        <Text 
          className="text-2xl font-bold mx-1"
          style={{ color: isUrgent ? colors.warning : colors.muted }}
        >
          :
        </Text>
        <TimeUnit 
          value={timeRemaining.minutes} 
          label="Mins" 
          isUrgent={isUrgent}
        />
        <Text 
          className="text-2xl font-bold mx-1"
          style={{ color: isUrgent ? colors.warning : colors.muted }}
        >
          :
        </Text>
        <TimeUnit 
          value={timeRemaining.seconds} 
          label="Secs" 
          isUrgent={isUrgent}
        />
      </View>
      
      {/* Urgent message */}
      {isUrgent && (
        <Text 
          className="text-center text-sm mt-3"
          style={{ color: colors.warning }}
        >
          Make every step count! Battle now to earn more points.
        </Text>
      )}
    </View>
  );
}

function TimeUnit({ value, label, isUrgent }: { value: number; label: string; isUrgent: boolean }) {
  const colors = useColors();
  
  return (
    <View className="items-center">
      <View 
        className="w-14 h-14 rounded-xl items-center justify-center"
        style={{ backgroundColor: isUrgent ? colors.warning : colors.primary }}
      >
        <Text className="text-white text-2xl font-bold">
          {padNumber(value)}
        </Text>
      </View>
      <Text 
        className="text-xs mt-1"
        style={{ color: colors.muted }}
      >
        {label}
      </Text>
    </View>
  );
}

// Hook for easy countdown state management
export function useCountdown(endTime: Date) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining(endTime));
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(endTime);
      setTimeRemaining(remaining);
      
      if (remaining.total <= 0) {
        clearInterval(interval);
        setIsComplete(true);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endTime]);
  
  return {
    ...timeRemaining,
    isComplete,
    isUrgent: timeRemaining.days === 0 && timeRemaining.total > 0,
    formatted: timeRemaining.days > 0 
      ? `${timeRemaining.days}d ${padNumber(timeRemaining.hours)}h ${padNumber(timeRemaining.minutes)}m`
      : `${padNumber(timeRemaining.hours)}:${padNumber(timeRemaining.minutes)}:${padNumber(timeRemaining.seconds)}`,
  };
}
