/**
 * Notification Manager
 * 
 * Integrates push notifications with game state to trigger alerts
 * for pet care, battle energy, and guild competitions.
 */

import {
  schedulePetCareReminder,
  scheduleBattleEnergyNotification,
  scheduleEnergyPointNotification,
  scheduleGuildCompetitionNotification,
  scheduleDailyGoalReminder,
  cancelNotificationsByType,
} from "@/hooks/use-notifications";

// Thresholds for triggering notifications
const CARE_WARNING_THRESHOLD = 40; // Warn when care level drops below 40%
const CARE_CRITICAL_THRESHOLD = 20; // Critical alert below 20%

interface PetCareState {
  hunger: number;
  thirst: number;
  happiness: number;
  name: string;
}

interface BattleEnergyState {
  currentEnergy: number;
  maxEnergy: number;
  lastRechargeTime: number;
  rechargeMinutes: number;
}

interface DailyGoalState {
  currentSteps: number;
  goalSteps: number;
}

// Track which notifications have been sent to avoid spam
const sentNotifications = {
  hunger_warning: false,
  hunger_critical: false,
  thirst_warning: false,
  thirst_critical: false,
  happiness_warning: false,
  happiness_critical: false,
  energy_full: false,
};

/**
 * Check pet care levels and schedule notifications if needed
 */
export async function checkPetCareNotifications(petState: PetCareState): Promise<void> {
  const { hunger, thirst, happiness, name } = petState;

  // Check hunger
  if (hunger <= CARE_CRITICAL_THRESHOLD && !sentNotifications.hunger_critical) {
    await schedulePetCareReminder("hunger", name, hunger);
    sentNotifications.hunger_critical = true;
    sentNotifications.hunger_warning = true;
  } else if (hunger <= CARE_WARNING_THRESHOLD && !sentNotifications.hunger_warning) {
    await schedulePetCareReminder("hunger", name, hunger);
    sentNotifications.hunger_warning = true;
  } else if (hunger > CARE_WARNING_THRESHOLD) {
    // Reset flags when level recovers
    sentNotifications.hunger_warning = false;
    sentNotifications.hunger_critical = false;
  }

  // Check thirst
  if (thirst <= CARE_CRITICAL_THRESHOLD && !sentNotifications.thirst_critical) {
    await schedulePetCareReminder("thirst", name, thirst);
    sentNotifications.thirst_critical = true;
    sentNotifications.thirst_warning = true;
  } else if (thirst <= CARE_WARNING_THRESHOLD && !sentNotifications.thirst_warning) {
    await schedulePetCareReminder("thirst", name, thirst);
    sentNotifications.thirst_warning = true;
  } else if (thirst > CARE_WARNING_THRESHOLD) {
    sentNotifications.thirst_warning = false;
    sentNotifications.thirst_critical = false;
  }

  // Check happiness
  if (happiness <= CARE_CRITICAL_THRESHOLD && !sentNotifications.happiness_critical) {
    await schedulePetCareReminder("happiness", name, happiness);
    sentNotifications.happiness_critical = true;
    sentNotifications.happiness_warning = true;
  } else if (happiness <= CARE_WARNING_THRESHOLD && !sentNotifications.happiness_warning) {
    await schedulePetCareReminder("happiness", name, happiness);
    sentNotifications.happiness_warning = true;
  } else if (happiness > CARE_WARNING_THRESHOLD) {
    sentNotifications.happiness_warning = false;
    sentNotifications.happiness_critical = false;
  }
}

/**
 * Schedule battle energy notifications
 */
export async function scheduleBattleEnergyAlerts(energyState: BattleEnergyState): Promise<void> {
  const { currentEnergy, maxEnergy, lastRechargeTime, rechargeMinutes } = energyState;

  if (currentEnergy >= maxEnergy) {
    // Energy is full, no notification needed
    sentNotifications.energy_full = false;
    return;
  }

  // Calculate time until full
  const now = Date.now();
  const minutesSinceLastRecharge = (now - lastRechargeTime) / (1000 * 60);
  const energyNeeded = maxEnergy - currentEnergy;
  const minutesUntilFull = (energyNeeded * rechargeMinutes) - (minutesSinceLastRecharge % rechargeMinutes);

  if (!sentNotifications.energy_full && minutesUntilFull > 0) {
    // Schedule notification for when energy is full
    await scheduleBattleEnergyNotification(Math.ceil(minutesUntilFull), currentEnergy, maxEnergy);
    sentNotifications.energy_full = true;
  }
}

/**
 * Schedule daily goal reminder
 */
export async function scheduleDailyGoalAlert(goalState: DailyGoalState): Promise<void> {
  const { currentSteps, goalSteps } = goalState;

  if (currentSteps >= goalSteps) {
    // Goal already met
    return;
  }

  // Calculate hours until end of day (midnight)
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const hoursUntilEndOfDay = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Only remind if there's still time and we're past midday
  if (hoursUntilEndOfDay > 0 && now.getHours() >= 12) {
    await scheduleDailyGoalReminder(currentSteps, goalSteps, hoursUntilEndOfDay);
  }
}

/**
 * Trigger guild competition notification
 */
export async function triggerGuildCompetitionAlert(
  type: "start" | "ending_soon" | "end" | "results",
  guildName?: string,
  details?: string
): Promise<void> {
  await scheduleGuildCompetitionNotification(type, guildName, details);
}

/**
 * Cancel all pet care notifications (e.g., when pet is fed)
 */
export async function cancelPetCareNotifications(): Promise<void> {
  await cancelNotificationsByType("pet_care");
  // Reset sent flags
  sentNotifications.hunger_warning = false;
  sentNotifications.hunger_critical = false;
  sentNotifications.thirst_warning = false;
  sentNotifications.thirst_critical = false;
  sentNotifications.happiness_warning = false;
  sentNotifications.happiness_critical = false;
}

/**
 * Cancel battle energy notifications
 */
export async function cancelBattleEnergyNotifications(): Promise<void> {
  await cancelNotificationsByType("battle_energy");
  sentNotifications.energy_full = false;
}

/**
 * Reset all notification flags (e.g., on app start)
 */
export function resetNotificationFlags(): void {
  Object.keys(sentNotifications).forEach((key) => {
    sentNotifications[key as keyof typeof sentNotifications] = false;
  });
}
