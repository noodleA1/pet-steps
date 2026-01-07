import { useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, Modal, FlatList } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useGame, type Pet as PetType, type Egg } from "@/lib/game-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BREEDING_LEVEL, EGG_HATCH_STEPS, ELEMENT_EFFECTIVENESS, type ElementType } from "@/shared/game-types";

// Element colors mapping
const ELEMENT_COLORS: Record<string, string> = {
  fire: "#F97316",
  water: "#3B82F6",
  earth: "#84CC16",
  air: "#06B6D4",
};

// Mock eligible breeding partners (in real app, would come from server)
const MOCK_PARTNERS = [
  { 
    id: "p1", 
    name: "Blaze Dragon", 
    element: "fire", 
    level: 92, 
    attack: 55, 
    defense: 42, 
    health: 110,
    generation: 3,
    ownerName: "FireMaster",
    imageUrl: "https://placehold.co/150x150/F97316/white?text=Blaze",
  },
  { 
    id: "p2", 
    name: "Aqua Serpent", 
    element: "water", 
    level: 95, 
    attack: 48, 
    defense: 52, 
    health: 120,
    generation: 2,
    ownerName: "WaterWizard",
    imageUrl: "https://placehold.co/150x150/3B82F6/white?text=Aqua",
  },
  { 
    id: "p3", 
    name: "Stone Titan", 
    element: "earth", 
    level: 90, 
    attack: 42, 
    defense: 65, 
    health: 140,
    generation: 4,
    ownerName: "EarthShaker",
    imageUrl: "https://placehold.co/150x150/84CC16/white?text=Stone",
  },
  { 
    id: "p4", 
    name: "Wind Spirit", 
    element: "air", 
    level: 98, 
    attack: 60, 
    defense: 38, 
    health: 95,
    generation: 5,
    ownerName: "SkyDancer",
    imageUrl: "https://placehold.co/150x150/06B6D4/white?text=Wind",
  },
];

type Partner = typeof MOCK_PARTNERS[0];

function PartnerCard({ partner, onSelect, isSelected }: { partner: Partner; onSelect: () => void; isSelected: boolean }) {
  const colors = useColors();
  
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect();
      }}
      style={({ pressed }) => [
        styles.partnerCard,
        { 
          borderColor: isSelected ? colors.primary : ELEMENT_COLORS[partner.element],
          borderWidth: isSelected ? 3 : 2,
          opacity: pressed ? 0.8 : 1,
        }
      ]}
    >
      <View className="flex-row items-center">
        <View 
          className="w-16 h-16 rounded-full items-center justify-center overflow-hidden mr-3"
          style={{ borderWidth: 2, borderColor: ELEMENT_COLORS[partner.element] }}
        >
          <Image
            source={{ uri: partner.imageUrl }}
            style={{ width: 60, height: 60 }}
            contentFit="cover"
          />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{partner.name}</Text>
          <View className="flex-row items-center mt-1">
            <View 
              className="px-2 py-0.5 rounded-full mr-2"
              style={{ backgroundColor: ELEMENT_COLORS[partner.element] }}
            >
              <Text className="text-white text-xs capitalize">{partner.element}</Text>
            </View>
            <Text className="text-muted text-sm">Lv.{partner.level}</Text>
          </View>
          <Text className="text-xs text-muted mt-1">Owner: {partner.ownerName}</Text>
        </View>
        {isSelected && (
          <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
            <IconSymbol name="checkmark" size={20} color="white" />
          </View>
        )}
      </View>
      
      {/* Stats Preview */}
      <View className="flex-row justify-between mt-3 pt-3 border-t border-border">
        <View className="items-center flex-1">
          <Text className="text-foreground font-semibold">{partner.attack}</Text>
          <Text className="text-xs text-muted">ATK</Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-foreground font-semibold">{partner.defense}</Text>
          <Text className="text-xs text-muted">DEF</Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-foreground font-semibold">{partner.health}</Text>
          <Text className="text-xs text-muted">HP</Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-foreground font-semibold">Gen {partner.generation}</Text>
          <Text className="text-xs text-muted">Gen</Text>
        </View>
      </View>
    </Pressable>
  );
}

function OffspringPreview({ mom, dad }: { mom: PetType; dad: Partner }) {
  const colors = useColors();
  
  // Calculate predicted stats (20% from each parent + base)
  const baseAttack = 10;
  const baseDefense = 10;
  const baseHealth = 50;
  
  const predictedAttack = Math.floor(baseAttack + (mom.attack * 0.2) + (dad.attack * 0.2));
  const predictedDefense = Math.floor(baseDefense + (mom.defense * 0.2) + (dad.defense * 0.2));
  const predictedHealth = Math.floor(baseHealth + (mom.maxHealth * 0.2) + (dad.health * 0.2));
  
  // Determine elements
  const primaryElement = mom.primaryElement;
  const secondaryElement = dad.element !== mom.primaryElement ? dad.element : null;
  
  // Check element synergy
  const hasElementSynergy = secondaryElement !== null;
  const synergies: string[] = [];
  
  if (hasElementSynergy) {
    // Check for strengths
    const momStrong = ELEMENT_EFFECTIVENESS[mom.primaryElement as keyof typeof ELEMENT_EFFECTIVENESS];
    const dadStrong = ELEMENT_EFFECTIVENESS[dad.element as keyof typeof ELEMENT_EFFECTIVENESS];
    
    if (momStrong) {
      Object.entries(momStrong).forEach(([elem, mult]) => {
        if (mult > 1) synergies.push(`Strong vs ${elem}`);
      });
    }
    if (dadStrong) {
      Object.entries(dadStrong).forEach(([elem, mult]) => {
        if (mult > 1 && !synergies.includes(`Strong vs ${elem}`)) {
          synergies.push(`Strong vs ${elem}`);
        }
      });
    }
  }
  
  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <Text className="text-lg font-semibold text-foreground mb-3">Offspring Preview</Text>
      
      {/* Elements */}
      <View className="flex-row items-center mb-3">
        <Text className="text-muted mr-2">Elements:</Text>
        <View 
          className="px-3 py-1 rounded-full mr-2"
          style={{ backgroundColor: ELEMENT_COLORS[primaryElement] }}
        >
          <Text className="text-white text-sm capitalize">{primaryElement}</Text>
        </View>
        {secondaryElement && (
          <View 
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: ELEMENT_COLORS[secondaryElement] }}
          >
            <Text className="text-white text-sm capitalize">{secondaryElement}</Text>
          </View>
        )}
      </View>
      
      {/* Predicted Stats */}
      <View className="flex-row justify-between mb-3">
        <View className="items-center flex-1">
          <IconSymbol name="flame.fill" size={20} color={colors.attack} />
          <Text className="text-xl font-bold text-foreground">{predictedAttack}</Text>
          <Text className="text-xs text-muted">Attack</Text>
        </View>
        <View className="items-center flex-1">
          <IconSymbol name="shield.fill" size={20} color={colors.defense} />
          <Text className="text-xl font-bold text-foreground">{predictedDefense}</Text>
          <Text className="text-xs text-muted">Defense</Text>
        </View>
        <View className="items-center flex-1">
          <IconSymbol name="bolt.heart.fill" size={20} color={colors.health} />
          <Text className="text-xl font-bold text-foreground">{predictedHealth}</Text>
          <Text className="text-xs text-muted">Health</Text>
        </View>
      </View>
      
      {/* Synergies */}
      {synergies.length > 0 && (
        <View className="mt-2">
          <Text className="text-sm text-muted mb-1">Element Synergies:</Text>
          <View className="flex-row flex-wrap">
            {synergies.slice(0, 3).map((synergy, index) => (
              <View key={index} className="bg-success/20 px-2 py-1 rounded mr-2 mb-1">
                <Text className="text-success text-xs">{synergy}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Generation */}
      <View className="mt-3 pt-3 border-t border-border">
        <Text className="text-sm text-muted">
          Generation: {Math.max(mom.generation, dad.generation) + 1}
        </Text>
      <Text className="text-xs text-muted mt-1">
        Stats inherit 20% from each parent. Higher generation pets can have stronger base stats.
      </Text>
    </View>
  </View>
  );
}

function EggView({ egg, stepsToHatch }: { egg: Egg; stepsToHatch: number }) {
  const colors = useColors();
  
  if (!egg) return null;
  
  const progress = ((EGG_HATCH_STEPS - stepsToHatch) / EGG_HATCH_STEPS) * 100;
  
  return (
    <View className="bg-surface rounded-2xl p-6 items-center">
      {/* Egg Animation Placeholder */}
      <View 
        className="w-32 h-40 rounded-full items-center justify-center mb-4"
        style={{ 
          backgroundColor: colors.primary + "20",
          borderWidth: 3,
          borderColor: colors.primary,
        }}
      >
        <IconSymbol name="sparkles" size={48} color={colors.primary} />
      </View>
      
      <Text className="text-xl font-bold text-foreground mb-2">Your Egg</Text>
      
      {/* Progress */}
      <View className="w-full mb-4">
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm text-muted">Hatching Progress</Text>
          <Text className="text-sm text-foreground font-medium">{Math.floor(progress)}%</Text>
        </View>
        <View className="h-4 bg-background rounded-full overflow-hidden">
          <View 
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: colors.primary }
            ]}
          />
        </View>
      </View>
      
      <Text className="text-muted text-center">
        Walk {stepsToHatch.toLocaleString()} more steps to hatch your egg!
      </Text>
      
      {/* Egg Info */}
      <View className="mt-4 w-full">
        <View className="flex-row justify-between py-2 border-t border-border">
          <Text className="text-muted">Primary Element</Text>
          <View 
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: ELEMENT_COLORS[egg.primaryElement] }}
          >
            <Text className="text-white text-xs capitalize">{egg.primaryElement}</Text>
          </View>
        </View>
        {egg.secondaryElement && (
          <View className="flex-row justify-between py-2 border-t border-border">
            <Text className="text-muted">Secondary Element</Text>
            <View 
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: ELEMENT_COLORS[egg.secondaryElement] }}
            >
              <Text className="text-white text-xs capitalize">{egg.secondaryElement}</Text>
            </View>
          </View>
        )}
        <View className="flex-row justify-between py-2 border-t border-border">
          <Text className="text-muted">Generation</Text>
          <Text className="text-foreground font-medium">{egg.generation}</Text>
        </View>
      </View>
    </View>
  );
}

export default function BreedingScreen() {
  const { state, breedPet } = useGame();
  const colors = useColors();
  const router = useRouter();
  
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const pet = state.activePet;
  const canBreed = pet && pet.level >= BREEDING_LEVEL && !state.egg;
  const hasEgg = !!state.egg;
  
  const handleBreed = () => {
    if (!selectedPartner || !pet) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Create egg with inherited stats
    breedPet(selectedPartner.id, selectedPartner.element as ElementType, {
      attack: selectedPartner.attack,
      defense: selectedPartner.defense,
      health: selectedPartner.health,
    });
    
    setShowConfirmModal(false);
    setSelectedPartner(null);
  };
  
  // If user has an egg, show egg view
  if (hasEgg && state.egg) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-row items-center mb-4">
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground ml-2">Your Egg</Text>
        </View>
        
        <EggView egg={state.egg} stepsToHatch={state.stepsToHatch} />
      </ScreenContainer>
    );
  }
  
  // If pet can't breed yet
  if (!canBreed) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-row items-center mb-4">
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground ml-2">Breeding</Text>
        </View>
        
        <View className="flex-1 items-center justify-center">
          <IconSymbol name="lock.fill" size={64} color={colors.muted} />
          <Text className="text-xl font-semibold text-foreground mt-4 mb-2">Breeding Locked</Text>
          <Text className="text-muted text-center px-8">
            {!pet 
              ? "You need a pet to breed!"
              : `Your pet needs to reach level ${BREEDING_LEVEL} to breed. Current level: ${pet.level}`
            }
          </Text>
        </View>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground ml-2">Breeding</Text>
        </View>
        
        {/* Your Pet */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Your Pet (Mother)</Text>
          <View className="flex-row items-center">
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
              <View className="flex-row items-center mt-1">
                <View 
                  className="px-2 py-0.5 rounded-full mr-2"
                  style={{ backgroundColor: ELEMENT_COLORS[pet.primaryElement] }}
                >
                  <Text className="text-white text-xs capitalize">{pet.primaryElement}</Text>
                </View>
                <Text className="text-muted">Lv.{pet.level}</Text>
              </View>
              <Text className="text-sm text-muted mt-1">Generation {pet.generation}</Text>
            </View>
          </View>
        </View>
        
        {/* Partner Selection */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Select Partner (Father)</Text>
          <Text className="text-sm text-muted mb-3">
            Choose a partner from eligible pets. Different elements create dual-type offspring!
          </Text>
          
          {MOCK_PARTNERS.map(partner => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onSelect={() => setSelectedPartner(partner)}
              isSelected={selectedPartner?.id === partner.id}
            />
          ))}
        </View>
        
        {/* Offspring Preview */}
        {selectedPartner && (
          <OffspringPreview mom={pet} dad={selectedPartner} />
        )}
        
        {/* Breed Button */}
        <Pressable
          onPress={() => {
            if (selectedPartner) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowConfirmModal(true);
            }
          }}
          disabled={!selectedPartner}
          style={({ pressed }) => [
            styles.breedButton,
            { 
              backgroundColor: selectedPartner ? colors.primary : colors.muted,
              opacity: pressed && selectedPartner ? 0.8 : 1,
            }
          ]}
        >
          <IconSymbol name="sparkles" size={24} color="white" />
          <Text className="text-white text-lg font-semibold ml-2">
            {selectedPartner ? "Start Breeding" : "Select a Partner"}
          </Text>
        </Pressable>
        
        {/* Info */}
        <View className="mt-4 p-4 bg-surface rounded-2xl">
          <Text className="text-sm text-muted text-center">
            Breeding creates an egg that hatches after {EGG_HATCH_STEPS.toLocaleString()} steps. 
            The offspring inherits 20% of stats from each parent and gains both elements.
          </Text>
        </View>
      </ScrollView>
      
      {/* Confirm Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-foreground text-center mb-4">Confirm Breeding</Text>
            
            {selectedPartner && (
              <View className="items-center mb-4">
                <View className="flex-row items-center justify-center">
                  <View 
                    className="w-16 h-16 rounded-full items-center justify-center overflow-hidden"
                    style={{ borderWidth: 2, borderColor: ELEMENT_COLORS[pet.primaryElement] }}
                  >
                    <Image
                      source={{ uri: pet.imageUrl || `https://placehold.co/80x80/${ELEMENT_COLORS[pet.primaryElement].slice(1)}/white?text=${pet.name.charAt(0)}` }}
                      style={{ width: 60, height: 60 }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="mx-4">
                    <IconSymbol name="bolt.heart.fill" size={32} color={colors.primary} />
                  </View>
                  <View 
                    className="w-16 h-16 rounded-full items-center justify-center overflow-hidden"
                    style={{ borderWidth: 2, borderColor: ELEMENT_COLORS[selectedPartner.element] }}
                  >
                    <Image
                      source={{ uri: selectedPartner.imageUrl }}
                      style={{ width: 60, height: 60 }}
                      contentFit="cover"
                    />
                  </View>
                </View>
                <Text className="text-muted text-center mt-3">
                  {pet.name} × {selectedPartner.name}
                </Text>
              </View>
            )}
            
            <Text className="text-muted text-center mb-6">
              This will create an egg. Your current pet will retire when the egg hatches.
            </Text>
            
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowConfirmModal(false)}
                style={({ pressed }) => [
                  styles.modalButton,
                  { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1, flex: 1 }
                ]}
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleBreed}
                style={({ pressed }) => [
                  styles.modalButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1, flex: 1 }
                ]}
              >
                <Text className="text-white font-semibold">Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  partnerCard: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  breedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  modalButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
});
