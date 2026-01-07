import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, Modal } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { 
  Equipment, 
  EquipmentSlot, 
  EquipmentRarity,
  EQUIPMENT_RARITY, 
  EQUIPMENT_SLOTS,
  COMPETITION_REWARDS,
  generateEquipment,
  ConsumableType,
} from "@/shared/game-types";

interface RewardItem {
  type: "equipment" | "consumable" | "tokens";
  equipment?: Equipment;
  consumable?: { type: ConsumableType; amount: number };
  tokens?: number;
  revealed: boolean;
}

function RewardCard({ 
  item, 
  index, 
  onReveal,
  revealed,
}: { 
  item: RewardItem; 
  index: number;
  onReveal: () => void;
  revealed: boolean;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateY: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));
  
  const handlePress = () => {
    if (revealed) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Flip animation
    rotation.value = withSequence(
      withSpring(90, { damping: 15 }),
      withSpring(0, { damping: 15 })
    );
    scale.value = withSequence(
      withSpring(1.1, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    
    setTimeout(() => {
      onReveal();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 200);
  };
  
  const getRarityColor = (rarity: EquipmentRarity) => EQUIPMENT_RARITY[rarity].color;
  
  const getConsumableIcon = (type: ConsumableType) => {
    const icons: Record<ConsumableType, string> = {
      food: "fork.knife",
      water: "drop.fill",
      toy: "gamecontroller.fill",
      treat: "gift.fill",
      energy_boost: "battery.100",
    };
    return icons[type] || "gift.fill";
  };
  
  const getConsumableName = (type: ConsumableType) => {
    const names: Record<ConsumableType, string> = {
      food: "Pet Food",
      water: "Fresh Water",
      toy: "Play Toy",
      treat: "Special Treat",
      energy_boost: "Energy Boost",
    };
    return names[type] || type;
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.rewardCard,
          { 
            backgroundColor: revealed 
              ? (item.type === "equipment" && item.equipment 
                  ? getRarityColor(item.equipment.rarity) + "20" 
                  : colors.surface)
              : colors.primary,
            borderColor: revealed 
              ? (item.type === "equipment" && item.equipment 
                  ? getRarityColor(item.equipment.rarity) 
                  : colors.border)
              : colors.primary,
            opacity: pressed && !revealed ? 0.8 : 1,
          }
        ]}
      >
        {!revealed ? (
          <View className="items-center justify-center py-8">
            <IconSymbol name="gift.fill" size={48} color="white" />
            <Text className="text-white font-bold mt-2">Tap to Reveal</Text>
            <Text className="text-white/70 text-xs">Reward #{index + 1}</Text>
          </View>
        ) : (
          <View className="items-center py-4">
            {item.type === "equipment" && item.equipment && (
              <>
                <View 
                  className="w-16 h-16 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: getRarityColor(item.equipment.rarity) + "30" }}
                >
                  <IconSymbol 
                    name={EQUIPMENT_SLOTS[item.equipment.slot].icon as any} 
                    size={32} 
                    color={getRarityColor(item.equipment.rarity)} 
                  />
                </View>
                <Text 
                  className="font-bold text-center"
                  style={{ color: getRarityColor(item.equipment.rarity) }}
                >
                  {EQUIPMENT_RARITY[item.equipment.rarity].name}
                </Text>
                <Text className="text-foreground font-semibold text-center" numberOfLines={2}>
                  {item.equipment.name}
                </Text>
                <Text className="text-muted text-sm">
                  +{item.equipment.statBonus} {EQUIPMENT_SLOTS[item.equipment.slot].stat}
                </Text>
                {item.equipment.element && (
                  <View className="flex-row items-center mt-1">
                    <View 
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ 
                        backgroundColor: item.equipment.element === "fire" ? "#EF4444" 
                          : item.equipment.element === "water" ? "#3B82F6"
                          : item.equipment.element === "earth" ? "#84CC16"
                          : "#8B5CF6"
                      }}
                    />
                    <Text className="text-xs text-muted capitalize">
                      {item.equipment.element} (+{item.equipment.elementBonus})
                    </Text>
                  </View>
                )}
              </>
            )}
            
            {item.type === "consumable" && item.consumable && (
              <>
                <View 
                  className="w-16 h-16 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: colors.success + "30" }}
                >
                  <IconSymbol 
                    name={getConsumableIcon(item.consumable.type) as any} 
                    size={32} 
                    color={colors.success} 
                  />
                </View>
                <Text className="text-foreground font-semibold text-center">
                  {getConsumableName(item.consumable.type)}
                </Text>
                <Text className="text-success font-bold text-lg">
                  x{item.consumable.amount}
                </Text>
              </>
            )}
            
            {item.type === "tokens" && item.tokens && (
              <>
                <View 
                  className="w-16 h-16 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: colors.warning + "30" }}
                >
                  <IconSymbol name="sparkles" size={32} color={colors.warning} />
                </View>
                <Text className="text-foreground font-semibold text-center">
                  AI Tokens
                </Text>
                <Text className="text-warning font-bold text-lg">
                  +{item.tokens}
                </Text>
              </>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function EquipmentInventoryItem({ 
  equipment, 
  onEquip, 
  onDiscard,
  canEquip,
}: { 
  equipment: Equipment;
  onEquip: () => void;
  onDiscard: () => void;
  canEquip: boolean;
}) {
  const colors = useColors();
  const rarityColor = EQUIPMENT_RARITY[equipment.rarity].color;
  
  return (
    <View 
      className="bg-surface rounded-xl p-3 mb-2"
      style={{ borderLeftWidth: 4, borderLeftColor: rarityColor }}
    >
      <View className="flex-row items-center">
        <View 
          className="w-12 h-12 rounded-lg items-center justify-center mr-3"
          style={{ backgroundColor: rarityColor + "20" }}
        >
          <IconSymbol 
            name={EQUIPMENT_SLOTS[equipment.slot].icon as any} 
            size={24} 
            color={rarityColor} 
          />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{equipment.name}</Text>
          <Text className="text-muted text-sm">
            +{equipment.statBonus} {EQUIPMENT_SLOTS[equipment.slot].stat}
            {equipment.element && ` • ${equipment.element}`}
          </Text>
        </View>
        <View className="flex-row">
          {canEquip && (
            <Pressable
              onPress={onEquip}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <Text className="text-white text-xs font-medium">Equip</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onDiscard}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: colors.error, opacity: pressed ? 0.8 : 1, marginLeft: 8 }
            ]}
          >
            <Text className="text-white text-xs font-medium">Discard</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function CompetitionRewardsScreen() {
  const { state, addEquipment, equipItem, discardEquipment } = useGame();
  const colors = useColors();
  
  // Mock competition result - in production this would come from server/navigation params
  const [guildRank] = useState(2); // Simulating 2nd place finish
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [allRevealed, setAllRevealed] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  
  // Generate rewards based on rank
  useEffect(() => {
    const rankRewards = COMPETITION_REWARDS[guildRank] || COMPETITION_REWARDS[5];
    const generatedRewards: RewardItem[] = [];
    
    // Generate equipment rewards
    for (const slot of rankRewards.equipmentSlots) {
      const equipment = generateEquipment(
        slot,
        rankRewards.luckBonus,
        rankRewards.guaranteedRarity,
        state.activePet?.primaryElement
      );
      generatedRewards.push({
        type: "equipment",
        equipment,
        revealed: false,
      });
    }
    
    // Add consumable rewards
    for (const consumable of rankRewards.consumables) {
      generatedRewards.push({
        type: "consumable",
        consumable,
        revealed: false,
      });
    }
    
    // Add AI tokens
    if (rankRewards.aiTokens > 0) {
      generatedRewards.push({
        type: "tokens",
        tokens: rankRewards.aiTokens,
        revealed: false,
      });
    }
    
    // Shuffle rewards
    setRewards(generatedRewards.sort(() => Math.random() - 0.5));
  }, [guildRank]);
  
  const handleReveal = (index: number) => {
    setRewards(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], revealed: true };
      
      // Check if all revealed
      if (updated.every(r => r.revealed)) {
        setAllRevealed(true);
      }
      
      return updated;
    });
  };
  
  const handleClaimAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Add all equipment to inventory
    for (const reward of rewards) {
      if (reward.type === "equipment" && reward.equipment) {
        addEquipment(reward.equipment);
      }
      // In production, also add consumables and tokens to state
    }
    
    setShowInventory(true);
  };
  
  const handleEquip = (equipmentId: string, slot: EquipmentSlot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    equipItem(equipmentId, slot);
  };
  
  const handleDiscard = (equipmentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    discardEquipment(equipmentId);
  };
  
  const getRankTitle = (rank: number) => {
    if (rank === 1) return "🏆 Champion!";
    if (rank === 2) return "🥈 Runner Up!";
    if (rank === 3) return "🥉 Third Place!";
    return `#${rank} Finish`;
  };
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return colors.muted;
  };
  
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <Pressable onPress={() => router.back()} className="mr-3">
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">Competition Rewards</Text>
          </View>
          
          {/* Rank Banner */}
          <View 
            className="rounded-2xl p-6 mb-6 items-center"
            style={{ backgroundColor: getRankColor(guildRank) + "20" }}
          >
            <Text 
              className="text-3xl font-bold mb-2"
              style={{ color: getRankColor(guildRank) }}
            >
              {getRankTitle(guildRank)}
            </Text>
            <Text className="text-foreground text-center">
              Your guild finished in {guildRank === 1 ? "first" : guildRank === 2 ? "second" : guildRank === 3 ? "third" : `${guildRank}th`} place!
            </Text>
            <Text className="text-muted text-sm mt-1">
              Tap each reward to reveal your prizes
            </Text>
          </View>
          
          {/* Rewards Grid */}
          {!showInventory && (
            <>
              <View className="flex-row flex-wrap justify-between mb-6">
                {rewards.map((reward, index) => (
                  <View key={index} style={{ width: "48%", marginBottom: 12 }}>
                    <RewardCard
                      item={reward}
                      index={index}
                      onReveal={() => handleReveal(index)}
                      revealed={reward.revealed}
                    />
                  </View>
                ))}
              </View>
              
              {/* Claim Button */}
              {allRevealed && (
                <Pressable
                  onPress={handleClaimAll}
                  style={({ pressed }) => [
                    styles.claimButton,
                    { backgroundColor: colors.success, opacity: pressed ? 0.8 : 1 }
                  ]}
                >
                  <IconSymbol name="checkmark.circle.fill" size={24} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Claim All Rewards</Text>
                </Pressable>
              )}
            </>
          )}
          
          {/* Equipment Inventory */}
          {showInventory && (
            <>
              <Text className="text-xl font-bold text-foreground mb-4">
                New Equipment ({state.equipmentInventory.length})
              </Text>
              
              {state.equipmentInventory.length === 0 ? (
                <View className="bg-surface rounded-2xl p-8 items-center">
                  <IconSymbol name="tray.fill" size={48} color={colors.muted} />
                  <Text className="text-muted mt-4 text-center">
                    No equipment in inventory.{"\n"}All items have been equipped or discarded.
                  </Text>
                </View>
              ) : (
                state.equipmentInventory.map((equipment) => (
                  <EquipmentInventoryItem
                    key={equipment.id}
                    equipment={equipment}
                    onEquip={() => handleEquip(equipment.id, equipment.slot)}
                    onDiscard={() => handleDiscard(equipment.id)}
                    canEquip={!!state.activePet}
                  />
                ))
              )}
              
              {/* Done Button */}
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.claimButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1, marginTop: 24 }
                ]}
              >
                <Text className="text-white font-bold text-lg">Done</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  rewardCard: {
    borderRadius: 16,
    borderWidth: 2,
    minHeight: 140,
    justifyContent: "center",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
  },
});
