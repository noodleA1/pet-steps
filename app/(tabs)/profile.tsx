import { useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, Modal, FlatList } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useGame, type Pet } from "@/lib/game-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SUBSCRIPTION_TIERS, type LineageNode } from "@/shared/game-types";

// Element colors mapping
const ELEMENT_COLORS: Record<string, string> = {
  fire: "#F97316",
  water: "#3B82F6",
  earth: "#84CC16",
  air: "#06B6D4",
};

function StatRow({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-border">
      <View className="flex-row items-center">
        <IconSymbol name={icon as any} size={20} color={color} />
        <Text className="text-foreground ml-3">{label}</Text>
      </View>
      <Text className="text-foreground font-semibold">{value}</Text>
    </View>
  );
}

function SubscriptionCard({ tier, isCurrentTier, onSelect }: { tier: keyof typeof SUBSCRIPTION_TIERS; isCurrentTier: boolean; onSelect: () => void }) {
  const colors = useColors();
  const tierInfo = SUBSCRIPTION_TIERS[tier];
  
  const getTierColor = () => {
    if (tier === "free") return colors.muted;
    if (tier === "tier1") return colors.primary;
    if (tier === "tier2") return colors.secondary;
    return "#FFD700";
  };
  
  return (
    <Pressable
      onPress={() => {
        if (!isCurrentTier) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect();
        }
      }}
      style={({ pressed }) => [
        styles.tierCard,
        { 
          borderColor: isCurrentTier ? getTierColor() : colors.border,
          borderWidth: isCurrentTier ? 2 : 1,
          opacity: pressed && !isCurrentTier ? 0.8 : 1,
        }
      ]}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-bold text-foreground">{tierInfo.name}</Text>
        {isCurrentTier && (
          <View className="bg-primary px-2 py-1 rounded-full">
            <Text className="text-white text-xs font-medium">Current</Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-foreground mb-2">
        {tierInfo.price === 0 ? "Free" : `$${tierInfo.price}/mo`}
      </Text>
      <View className="gap-1">
        {tierInfo.canGenerateAI && (
          <View className="flex-row items-center">
            <IconSymbol name="checkmark" size={16} color={colors.success} />
            <Text className="text-sm text-muted ml-2">AI Pet Generation</Text>
          </View>
        )}
        {tierInfo.aiTokensPerMonth > 0 && (
          <View className="flex-row items-center">
            <IconSymbol name="checkmark" size={16} color={colors.success} />
            <Text className="text-sm text-muted ml-2">{tierInfo.aiTokensPerMonth} AI tokens/month</Text>
          </View>
        )}
        {tierInfo.maxImageRegens > 0 && (
          <View className="flex-row items-center">
            <IconSymbol name="checkmark" size={16} color={colors.success} />
            <Text className="text-sm text-muted ml-2">{tierInfo.maxImageRegens} image regenerations</Text>
          </View>
        )}
        {tierInfo.maxVideoAttempts > 0 && (
          <View className="flex-row items-center">
            <IconSymbol name="checkmark" size={16} color={colors.success} />
            <Text className="text-sm text-muted ml-2">{tierInfo.maxVideoAttempts} video generations</Text>
          </View>
        )}
        {tierInfo.can3DGenerate && (
          <View className="flex-row items-center">
            <IconSymbol name="checkmark" size={16} color={colors.success} />
            <Text className="text-sm text-muted ml-2">3D Model Generation</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function RetiredPetCard({ pet, onViewLineage }: { pet: Pet; onViewLineage: () => void }) {
  const colors = useColors();
  
  return (
    <View className="bg-surface rounded-2xl p-4 mb-3">
      <View className="flex-row items-center">
        <View 
          className="w-16 h-16 rounded-full items-center justify-center overflow-hidden mr-3"
          style={{ borderWidth: 2, borderColor: ELEMENT_COLORS[pet.primaryElement] }}
        >
          <Image
            source={{ uri: pet.imageUrl || `https://placehold.co/100x100/${ELEMENT_COLORS[pet.primaryElement].slice(1)}/white?text=${pet.name.charAt(0)}` }}
            style={{ width: 60, height: 60 }}
            contentFit="cover"
          />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{pet.name}</Text>
          <View className="flex-row items-center mt-1">
            <View 
              className="px-2 py-0.5 rounded-full mr-2"
              style={{ backgroundColor: ELEMENT_COLORS[pet.primaryElement] }}
            >
              <Text className="text-white text-xs capitalize">{pet.primaryElement}</Text>
            </View>
            <Text className="text-muted text-sm">Lv.{pet.level}</Text>
          </View>
          <Text className="text-xs text-muted mt-1">Gen {pet.generation}</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onViewLineage();
          }}
          style={({ pressed }) => [
            styles.lineageButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <IconSymbol name="tree" size={16} color="white" />
          <Text className="text-white text-xs ml-1">Lineage</Text>
        </Pressable>
      </View>
      <View className="flex-row justify-between mt-3 pt-3 border-t border-border">
        <View className="items-center flex-1">
          <Text className="text-foreground font-semibold">{pet.attack}</Text>
          <Text className="text-xs text-muted">Attack</Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-foreground font-semibold">{pet.defense}</Text>
          <Text className="text-xs text-muted">Defense</Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-foreground font-semibold">{pet.maxHealth}</Text>
          <Text className="text-xs text-muted">Health</Text>
        </View>
      </View>
    </View>
  );
}

function LineageTreeNode({ node, depth = 0 }: { node: LineageNode; depth?: number }) {
  const colors = useColors();
  const indent = depth * 20;
  
  return (
    <View style={{ marginLeft: indent }}>
      <View className="flex-row items-center py-2">
        {depth > 0 && (
          <View className="w-4 h-px bg-border mr-2" />
        )}
        <View 
          className="w-10 h-10 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: ELEMENT_COLORS[node.element] }}
        >
          <Text className="text-white font-bold text-xs">{node.generation}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-medium">{node.name}</Text>
          <Text className="text-xs text-muted">
            {node.element}{node.secondaryElement ? ` / ${node.secondaryElement}` : ""} • 
            ATK {node.stats.attack} / DEF {node.stats.defense} / HP {node.stats.health}
          </Text>
        </View>
      </View>
      {node.parents && (
        <View className="ml-4 border-l border-border pl-2">
          {node.parents.mom && (
            <View>
              <Text className="text-xs text-muted mb-1">Mother:</Text>
              <LineageTreeNode node={node.parents.mom} depth={depth + 1} />
            </View>
          )}
          {node.parents.dad && (
            <View>
              <Text className="text-xs text-muted mb-1">Father:</Text>
              <LineageTreeNode node={node.parents.dad} depth={depth + 1} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function LineageModal({ visible, onClose, pet }: { visible: boolean; onClose: () => void; pet: Pet | null }) {
  const colors = useColors();
  
  if (!pet) return null;
  
  // Create mock lineage for demo
  const mockLineage: LineageNode = {
    petId: 1,
    name: pet.name,
    element: pet.primaryElement,
    secondaryElement: pet.secondaryElement,
    generation: pet.generation,
    imageUrl: pet.imageUrl,
    stats: {
      attack: pet.attack,
      defense: pet.defense,
      health: pet.maxHealth,
    },
    parents: pet.generation > 1 ? {
      mom: {
        petId: 2,
        name: "Aurora Flame",
        element: "fire",
        generation: pet.generation - 1,
        stats: { attack: 45, defense: 38, health: 95 },
      },
      dad: {
        petId: 3,
        name: "Tide Warrior",
        element: "water",
        generation: pet.generation - 1,
        stats: { attack: 42, defense: 44, health: 100 },
        parents: pet.generation > 2 ? {
          mom: {
            petId: 4,
            name: "Wave Dancer",
            element: "water",
            generation: pet.generation - 2,
            stats: { attack: 38, defense: 40, health: 90 },
          },
          dad: {
            petId: 5,
            name: "Stone Heart",
            element: "earth",
            generation: pet.generation - 2,
            stats: { attack: 35, defense: 50, health: 110 },
          },
        } : undefined,
      },
    } : undefined,
  };
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <Text className="text-xl font-bold text-foreground">Pet Lineage</Text>
          <Pressable onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        
        <ScrollView className="flex-1 p-4">
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View 
                className="w-20 h-20 rounded-full items-center justify-center overflow-hidden mr-4"
                style={{ borderWidth: 3, borderColor: ELEMENT_COLORS[pet.primaryElement] }}
              >
                <Image
                  source={{ uri: pet.imageUrl || `https://placehold.co/100x100/${ELEMENT_COLORS[pet.primaryElement].slice(1)}/white?text=${pet.name.charAt(0)}` }}
                  style={{ width: 76, height: 76 }}
                  contentFit="cover"
                />
              </View>
              <View>
                <Text className="text-xl font-bold text-foreground">{pet.name}</Text>
                <Text className="text-muted">Generation {pet.generation}</Text>
                <View className="flex-row mt-1">
                  <View 
                    className="px-2 py-0.5 rounded-full mr-1"
                    style={{ backgroundColor: ELEMENT_COLORS[pet.primaryElement] }}
                  >
                    <Text className="text-white text-xs capitalize">{pet.primaryElement}</Text>
                  </View>
                  {pet.secondaryElement && (
                    <View 
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: ELEMENT_COLORS[pet.secondaryElement] }}
                    >
                      <Text className="text-white text-xs capitalize">{pet.secondaryElement}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
          
          <Text className="text-lg font-semibold text-foreground mb-3">Ancestry Tree</Text>
          <View className="bg-surface rounded-2xl p-4">
            <LineageTreeNode node={mockLineage} />
          </View>
          
          <View className="mt-4 p-4 bg-surface rounded-2xl">
            <Text className="text-sm text-muted text-center">
              Lineage tracking shows how your pet inherited traits from previous generations. 
              Higher generation pets can have stronger base stats through selective breeding.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { state, dispatch } = useGame();
  const colors = useColors();
  
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showLineageModal, setShowLineageModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  
  const currentTier = state.subscriptionTier;
  const tierInfo = SUBSCRIPTION_TIERS[currentTier];
  
  // Calculate stats
  const totalBattles = 24; // Mock
  const battlesWon = 16; // Mock
  const winRate = Math.round((battlesWon / totalBattles) * 100);
  
  const handleViewLineage = (pet: Pet) => {
    setSelectedPet(pet);
    setShowLineageModal(true);
  };
  
  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-3">
            <IconSymbol name="person.fill" size={48} color="white" />
          </View>
          <Text className="text-2xl font-bold text-foreground">Trainer</Text>
          <View className="flex-row items-center mt-1">
            <View 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: currentTier === "free" ? colors.muted : colors.primary }}
            >
              <Text className="text-white text-sm font-medium">{tierInfo.name} Tier</Text>
            </View>
          </View>
        </View>
        
        {/* Subscription Card */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-foreground">Subscription</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSubscriptionModal(true);
              }}
            >
              <Text className="text-primary font-medium">Manage</Text>
            </Pressable>
          </View>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-foreground font-medium">{tierInfo.name}</Text>
              <Text className="text-sm text-muted">
                {tierInfo.price === 0 ? "Free forever" : `$${tierInfo.price}/month`}
              </Text>
            </View>
            {tierInfo.aiTokensPerMonth > 0 && (
              <View className="items-end">
                <Text className="text-foreground font-semibold">{state.aiTokens}</Text>
                <Text className="text-xs text-muted">AI Tokens</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Stats */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold text-foreground mb-2">Your Stats</Text>
          <StatRow 
            label="Total Steps" 
            value={state.totalSteps.toLocaleString()} 
            icon="figure.walk" 
            color={colors.primary} 
          />
          <StatRow 
            label="Pets Retired" 
            value={state.retiredPets.length.toString()} 
            icon="sparkles" 
            color={colors.secondary} 
          />
          <StatRow 
            label="Battles Won" 
            value={`${battlesWon}/${totalBattles}`} 
            icon="trophy.fill" 
            color={colors.warning} 
          />
          <StatRow 
            label="Win Rate" 
            value={`${winRate}%`} 
            icon="bolt.fill" 
            color={colors.success} 
          />
        </View>
        
        {/* Retired Pets / Pet History */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-foreground">Pet History</Text>
            <Text className="text-muted">{state.retiredPets.length} retired</Text>
          </View>
          
          {state.retiredPets.length > 0 ? (
            state.retiredPets.slice(0, 5).map((pet, index) => (
              <RetiredPetCard 
                key={pet.id} 
                pet={pet} 
                onViewLineage={() => handleViewLineage(pet)}
              />
            ))
          ) : (
            <View className="bg-surface rounded-2xl p-6 items-center">
              <IconSymbol name="sparkles" size={40} color={colors.muted} />
              <Text className="text-muted text-center mt-2">
                No retired pets yet. Keep walking to level up your pet to 100!
              </Text>
            </View>
          )}
        </View>
        
        {/* Settings */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold text-foreground mb-2">Settings</Text>
          
          <Pressable
            style={({ pressed }) => [
              styles.settingsRow,
              { opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <IconSymbol name="bolt.heart.fill" size={20} color={colors.foreground} />
            <Text className="text-foreground ml-3 flex-1">Health App Connection</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/notification-settings");
            }}
            style={({ pressed }) => [
              styles.settingsRow,
              { opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <IconSymbol name="bell.fill" size={20} color={colors.foreground} />
            <Text className="text-foreground ml-3 flex-1">Notifications</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [
              styles.settingsRow,
              { opacity: pressed ? 0.7 : 1, borderBottomWidth: 0 }
            ]}
          >
            <IconSymbol name="gear" size={20} color={colors.foreground} />
            <Text className="text-foreground ml-3 flex-1">App Settings</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </Pressable>
        </View>
      </ScrollView>
      
      {/* Subscription Modal */}
      <Modal visible={showSubscriptionModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Subscription Plans</Text>
            <Pressable onPress={() => setShowSubscriptionModal(false)}>
              <IconSymbol name="xmark" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          
          <ScrollView className="flex-1 p-4">
            {(Object.keys(SUBSCRIPTION_TIERS) as Array<keyof typeof SUBSCRIPTION_TIERS>).map(tier => (
              <SubscriptionCard
                key={tier}
                tier={tier}
                isCurrentTier={tier === currentTier}
                onSelect={() => {
                  // Would handle subscription upgrade
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              />
            ))}
            
            <View className="mt-4 p-4 bg-surface rounded-2xl">
              <Text className="text-sm text-muted text-center">
                Subscriptions help support the app and give you access to AI-powered pet generation, 
                evolution, and video creation features.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
      
      {/* Lineage Modal */}
      <LineageModal
        visible={showLineageModal}
        onClose={() => setShowLineageModal(false)}
        pet={selectedPet}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tierCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  lineageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
});
