import { useEffect } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import { useColors } from "@/hooks/use-colors";
import { getXpForLevel, EVOLUTION_LEVELS, BREEDING_LEVEL, RETIREMENT_LEVEL } from "@/shared/game-types";
import { IconSymbol } from "@/components/ui/icon-symbol";

// Element colors mapping
const ELEMENT_COLORS: Record<string, string> = {
  fire: "#F97316",
  water: "#3B82F6",
  earth: "#84CC16",
  air: "#06B6D4",
};

// Template pet images (placeholder URLs - will be replaced with actual assets)
const TEMPLATE_IMAGES: Record<string, string> = {
  fire_drake: "https://placehold.co/300x300/F97316/white?text=Fire+Drake",
  fire_fox: "https://placehold.co/300x300/F97316/white?text=Flame+Fox",
  fire_phoenix: "https://placehold.co/300x300/F97316/white?text=Phoenix",
  water_serpent: "https://placehold.co/300x300/3B82F6/white?text=Aqua+Serpent",
  water_turtle: "https://placehold.co/300x300/3B82F6/white?text=Tide+Turtle",
  water_dolphin: "https://placehold.co/300x300/3B82F6/white?text=Dolphin",
  earth_golem: "https://placehold.co/300x300/84CC16/white?text=Stone+Golem",
  earth_bear: "https://placehold.co/300x300/84CC16/white?text=Forest+Bear",
  earth_rhino: "https://placehold.co/300x300/84CC16/white?text=Crystal+Rhino",
  air_eagle: "https://placehold.co/300x300/06B6D4/white?text=Wind+Eagle",
  air_fairy: "https://placehold.co/300x300/06B6D4/white?text=Cloud+Fairy",
  air_hawk: "https://placehold.co/300x300/06B6D4/white?text=Storm+Hawk",
};

function ProgressBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const colors = useColors();
  const percentage = Math.min(100, (value / max) * 100);
  
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-muted">{label}</Text>
        <Text className="text-sm text-foreground font-medium">{value}/{max}</Text>
      </View>
      <View className="h-3 bg-surface rounded-full overflow-hidden">
        <View 
          style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} 
        />
      </View>
    </View>
  );
}

function CareMeter({ value, icon, color, label }: { value: number; icon: string; color: string; label: string }) {
  const colors = useColors();
  const percentage = value;
  
  return (
    <View className="items-center flex-1">
      <View className="w-16 h-16 rounded-full bg-surface items-center justify-center mb-1" style={{ borderWidth: 3, borderColor: color }}>
        <IconSymbol name={icon as any} size={24} color={color} />
      </View>
      <View className="w-full h-2 bg-surface rounded-full overflow-hidden">
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text className="text-xs text-muted mt-1">{label}</Text>
    </View>
  );
}

function CareButton({ icon, label, onPress, disabled, color }: { icon: string; label: string; onPress: () => void; disabled?: boolean; color: string }) {
  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      style={({ pressed }) => [
        styles.careButton,
        { backgroundColor: color, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }
      ]}
    >
      <IconSymbol name={icon as any} size={20} color="white" />
      <Text className="text-white text-xs font-medium mt-1">{label}</Text>
    </Pressable>
  );
}

function WelcomeScreen() {
  const { startTutorial } = useGame();
  const colors = useColors();
  
  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 items-center justify-center">
        <Text className="text-4xl font-bold text-foreground mb-4">PetSteps</Text>
        <Text className="text-lg text-muted text-center mb-8">
          Walk to level up your pet, evolve them through breeding, and battle other players!
        </Text>
        <View className="w-48 h-48 bg-surface rounded-full items-center justify-center mb-8">
          <IconSymbol name="flame" size={80} color={colors.primary} />
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            startTutorial();
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <Text className="text-white text-lg font-semibold">Start Your Journey</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function TutorialScreen() {
  const { state, addSteps } = useGame();
  const colors = useColors();
  const pet = state.activePet;
  
  if (!pet) return null;
  
  const stepsRemaining = 10 - state.tutorialSteps;
  
  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="items-center mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">Tutorial</Text>
          <Text className="text-muted text-center">
            Meet your Tutorial Companion! Walk {stepsRemaining} more steps to see them retire.
          </Text>
        </View>
        
        {/* Pet Display */}
        <View className="items-center mb-6">
          <View className="w-64 h-64 bg-surface rounded-3xl items-center justify-center mb-4" style={{ borderWidth: 3, borderColor: ELEMENT_COLORS[pet.primaryElement] }}>
            <Image
              source={{ uri: TEMPLATE_IMAGES[pet.templateType || "fire_phoenix"] }}
              style={{ width: 200, height: 200 }}
              contentFit="contain"
            />
          </View>
          <Text className="text-xl font-bold text-foreground">{pet.name}</Text>
          <View className="flex-row items-center mt-1">
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: ELEMENT_COLORS[pet.primaryElement] }}>
              <Text className="text-white text-sm font-medium">Level {pet.level}</Text>
            </View>
          </View>
        </View>
        
        {/* Tutorial Progress */}
        <View className="bg-surface rounded-2xl p-4 mb-6">
          <Text className="text-lg font-semibold text-foreground mb-2">Tutorial Progress</Text>
          <ProgressBar 
            value={state.tutorialSteps} 
            max={10} 
            color={colors.primary} 
            label="Steps to Retirement" 
          />
          <Text className="text-sm text-muted text-center">
            {stepsRemaining > 0 
              ? `Walk ${stepsRemaining} more steps to complete the tutorial!`
              : "Tutorial complete! Your pet is retiring..."}
          </Text>
        </View>
        
        {/* Simulate Steps Button (for testing) */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            addSteps(1);
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <IconSymbol name="figure.walk" size={20} color="white" />
          <Text className="text-white text-lg font-semibold ml-2">Simulate Step (+1)</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function PaywallScreen() {
  const { state, createPet, dispatch } = useGame();
  const colors = useColors();
  const router = useRouter();
  
  const handleSelectTemplate = (element: string, templateType: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createPet(element as any, name, true, templateType);
  };
  
  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="items-center mb-6">
          <IconSymbol name="sparkles" size={48} color={colors.primary} />
          <Text className="text-2xl font-bold text-foreground mt-4 mb-2">Choose Your Pet</Text>
          <Text className="text-muted text-center">
            Select a template pet to continue, or upgrade to create AI-generated pets!
          </Text>
        </View>
        
        {/* Free Tier - Template Pets */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Free - Template Pets</Text>
          <View className="flex-row flex-wrap justify-between">
            {Object.entries(ELEMENT_COLORS).map(([element, color]) => (
              <Pressable
                key={element}
                onPress={() => handleSelectTemplate(element, `${element}_drake`, `${element.charAt(0).toUpperCase() + element.slice(1)} Companion`)}
                style={({ pressed }) => [
                  styles.templateCard,
                  { borderColor: color, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <View className="w-16 h-16 rounded-full items-center justify-center mb-2" style={{ backgroundColor: color }}>
                  <IconSymbol name="flame" size={32} color="white" />
                </View>
                <Text className="text-foreground font-medium capitalize">{element}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Premium Options */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <IconSymbol name="lock.fill" size={20} color={colors.primary} />
            <Text className="text-lg font-semibold text-foreground ml-2">Premium - AI Generation</Text>
          </View>
          <Text className="text-muted mb-4">
            Create unique pets with AI! Text-to-image, image-to-image evolution, and more.
          </Text>
          
          {/* Tier Options */}
          <View className="gap-3">
            <View className="bg-background rounded-xl p-3 border border-border">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-foreground font-semibold">Basic - $2/mo</Text>
                  <Text className="text-sm text-muted">AI generation on evolution</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </View>
            
            <View className="bg-background rounded-xl p-3 border border-primary">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-foreground font-semibold">Premium - $5/mo</Text>
                  <Text className="text-sm text-muted">More regens, multiple video attempts</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </View>
            
            <View className="bg-background rounded-xl p-3 border border-border">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-foreground font-semibold">Ultimate - $10/mo</Text>
                  <Text className="text-sm text-muted">Unlimited + 3D generation</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function PetScreen() {
  const { state, feedPet, waterPet, playWithPet, addSteps } = useGame();
  const colors = useColors();
  const pet = state.activePet;
  
  if (!pet) return <WelcomeScreen />;
  
  const xpForNextLevel = getXpForLevel(pet.level);
  const xpProgress = pet.experience;
  
  // Get next milestone
  const nextEvolution = EVOLUTION_LEVELS.find(l => l > pet.level);
  const canBreed = pet.level >= BREEDING_LEVEL;
  const isNearRetirement = pet.level >= 95;
  
  const petImage = pet.imageUrl || TEMPLATE_IMAGES[pet.templateType || "fire_drake"] || TEMPLATE_IMAGES.fire_drake;
  
  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Pet Header */}
        <View className="items-center mb-4">
          <Text className="text-2xl font-bold text-foreground">{pet.name}</Text>
          <View className="flex-row items-center mt-1 gap-2">
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: ELEMENT_COLORS[pet.primaryElement] }}>
              <Text className="text-white text-sm font-medium capitalize">{pet.primaryElement}</Text>
            </View>
            {pet.secondaryElement && (
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: ELEMENT_COLORS[pet.secondaryElement] }}>
                <Text className="text-white text-sm font-medium capitalize">{pet.secondaryElement}</Text>
              </View>
            )}
            <Text className="text-muted text-sm">Gen {pet.generation}</Text>
          </View>
        </View>
        
        {/* Pet Image */}
        <View className="items-center mb-4">
          <View 
            className="w-64 h-64 bg-surface rounded-3xl items-center justify-center overflow-hidden"
            style={{ borderWidth: 3, borderColor: ELEMENT_COLORS[pet.primaryElement] }}
          >
            <Image
              source={{ uri: petImage }}
              style={{ width: 240, height: 240 }}
              contentFit="contain"
            />
          </View>
        </View>
        
        {/* Level & XP */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold text-foreground">Level {pet.level}</Text>
            {nextEvolution && (
              <Text className="text-sm text-primary">Evolves at Lv.{nextEvolution}</Text>
            )}
            {canBreed && !isNearRetirement && (
              <Text className="text-sm text-success">Can Breed!</Text>
            )}
            {isNearRetirement && (
              <Text className="text-sm text-warning">Near Retirement</Text>
            )}
          </View>
          <ProgressBar 
            value={xpProgress} 
            max={xpForNextLevel} 
            color={colors.primary} 
            label="Experience" 
          />
        </View>
        
        {/* Care Meters */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Pet Care</Text>
          <View className="flex-row justify-between mb-4">
            <CareMeter value={pet.happiness} icon="heart.fill" color={colors.happiness} label="Happy" />
            <CareMeter value={pet.hunger} icon="fork.knife" color={colors.hunger} label="Hunger" />
            <CareMeter value={pet.thirst} icon="drop.fill" color={colors.thirst} label="Thirst" />
          </View>
          
          {/* Care Actions */}
          <View className="flex-row justify-between">
            <CareButton 
              icon="fork.knife" 
              label={`Feed (${state.consumables.food})`}
              onPress={feedPet}
              disabled={state.consumables.food <= 0 || pet.hunger >= 100}
              color={colors.hunger}
            />
            <CareButton 
              icon="drop.fill" 
              label={`Water (${state.consumables.water})`}
              onPress={waterPet}
              disabled={state.consumables.water <= 0 || pet.thirst >= 100}
              color={colors.thirst}
            />
            <CareButton 
              icon="gamecontroller.fill" 
              label="Play"
              onPress={playWithPet}
              disabled={pet.happiness >= 100}
              color={colors.happiness}
            />
          </View>
        </View>
        
        {/* Stats */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Battle Stats</Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <IconSymbol name="flame.fill" size={24} color={colors.attack} />
              <Text className="text-2xl font-bold text-foreground">{pet.attack}</Text>
              <Text className="text-xs text-muted">Attack</Text>
            </View>
            <View className="items-center flex-1">
              <IconSymbol name="shield.fill" size={24} color={colors.defense} />
              <Text className="text-2xl font-bold text-foreground">{pet.defense}</Text>
              <Text className="text-xs text-muted">Defense</Text>
            </View>
            <View className="items-center flex-1">
              <IconSymbol name="bolt.heart.fill" size={24} color={colors.health} />
              <Text className="text-2xl font-bold text-foreground">{pet.maxHealth}</Text>
              <Text className="text-xs text-muted">Health</Text>
            </View>
          </View>
        </View>
        
        {/* Quick Actions (for testing) */}
        <View className="mb-4">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              addSteps(100);
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <IconSymbol name="figure.walk" size={20} color="white" />
            <Text className="text-white text-lg font-semibold ml-2">Simulate Steps (+100)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

export default function HomeScreen() {
  const { state } = useGame();
  
  // Show paywall if needed
  if (state.showPaywall) {
    return <PaywallScreen />;
  }
  
  // Show tutorial if not completed and has tutorial pet
  if (!state.tutorialCompleted && state.activePet?.id === "tutorial") {
    return <TutorialScreen />;
  }
  
  // Show welcome if no pet
  if (!state.activePet) {
    return <WelcomeScreen />;
  }
  
  // Show main pet screen
  return <PetScreen />;
}

const styles = StyleSheet.create({
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  careButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  templateCard: {
    width: "48%",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    backgroundColor: "transparent",
  },
});
