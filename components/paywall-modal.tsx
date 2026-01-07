import { Modal, Text, View, Pressable, StyleSheet, ScrollView } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useGame } from "@/lib/game-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TEMPLATE_PETS, type ElementType } from "@/shared/game-types";

// Element colors mapping
const ELEMENT_COLORS: Record<string, string> = {
  fire: "#F97316",
  water: "#3B82F6",
  earth: "#84CC16",
  air: "#06B6D4",
};

const ELEMENT_ICONS: Record<string, string> = {
  fire: "🔥",
  water: "💧",
  earth: "🌿",
  air: "💨",
};

function TemplatePetCard({ 
  element, 
  onSelect 
}: { 
  element: ElementType; 
  onSelect: () => void;
}) {
  const colors = useColors();
  const templates = TEMPLATE_PETS[element];
  const template = templates[0]; // Use first template for each element
  
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect();
      }}
      style={({ pressed }) => [
        styles.templateCard,
        { 
          borderColor: ELEMENT_COLORS[element],
          opacity: pressed ? 0.8 : 1,
        }
      ]}
    >
      <View 
        className="w-16 h-16 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: ELEMENT_COLORS[element] + "20" }}
      >
        <Text className="text-3xl">{ELEMENT_ICONS[element]}</Text>
      </View>
      <Text className="text-foreground font-semibold text-center">{template.name}</Text>
      <Text className="text-muted text-xs text-center capitalize">{element}</Text>
    </Pressable>
  );
}

export function PaywallModal() {
  const { state, createPet, dispatch } = useGame();
  const colors = useColors();
  const router = useRouter();
  
  if (!state.showPaywall) return null;
  
  const handleSelectTemplate = (element: ElementType) => {
    const templates = TEMPLATE_PETS[element];
    const template = templates[0]; // Use first template
    createPet(element, template.name, true, template.templateType);
    dispatch({ type: "SET_STATE", payload: { showPaywall: false } });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  const handleUpgrade = () => {
    dispatch({ type: "SET_STATE", payload: { showPaywall: false } });
    router.push("/subscription" as any);
  };
  
  return (
    <Modal visible={state.showPaywall} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          {/* Celebration Header */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
              <IconSymbol name="trophy.fill" size={40} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-foreground text-center">
              Congratulations!
            </Text>
            <Text className="text-muted text-center mt-2">
              Your pet has reached retirement. Time to start a new journey!
            </Text>
          </View>
          
          {/* Premium Option */}
          <View 
            className="rounded-2xl p-4 mb-6"
            style={{ 
              backgroundColor: colors.primary + "10",
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <View className="flex-row items-center mb-3">
              <IconSymbol name="sparkles" size={24} color={colors.primary} />
              <Text className="text-lg font-bold text-foreground ml-2">Premium: AI Pet Creation</Text>
            </View>
            <Text className="text-muted mb-4">
              Create a unique pet with AI! Use text-to-image or transform a photo of your real pet into a fantasy creature.
            </Text>
            <View className="flex-row flex-wrap mb-4">
              <View className="flex-row items-center mr-4 mb-2">
                <IconSymbol name="checkmark" size={16} color={colors.success} />
                <Text className="text-foreground ml-1 text-sm">Custom AI images</Text>
              </View>
              <View className="flex-row items-center mr-4 mb-2">
                <IconSymbol name="checkmark" size={16} color={colors.success} />
                <Text className="text-foreground ml-1 text-sm">Photo-to-pet</Text>
              </View>
              <View className="flex-row items-center mr-4 mb-2">
                <IconSymbol name="checkmark" size={16} color={colors.success} />
                <Text className="text-foreground ml-1 text-sm">Battle videos</Text>
              </View>
            </View>
            <Pressable
              onPress={handleUpgrade}
              style={({ pressed }) => [
                styles.premiumButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <Text className="text-white font-semibold text-center">
                Upgrade from $2/month
              </Text>
            </Pressable>
          </View>
          
          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-muted mx-4">or stay free</Text>
            <View className="flex-1 h-px bg-border" />
          </View>
          
          {/* Free Template Options */}
          <View>
            <Text className="text-lg font-semibold text-foreground mb-3">
              Choose a Template Pet
            </Text>
            <Text className="text-muted text-sm mb-4">
              Select one of the four elemental creatures to begin your journey.
            </Text>
            
            <View className="flex-row flex-wrap justify-between">
              <TemplatePetCard 
                element="fire" 
                onSelect={() => handleSelectTemplate("fire")} 
              />
              <TemplatePetCard 
                element="water" 
                onSelect={() => handleSelectTemplate("water")} 
              />
              <TemplatePetCard 
                element="earth" 
                onSelect={() => handleSelectTemplate("earth")} 
              />
              <TemplatePetCard 
                element="air" 
                onSelect={() => handleSelectTemplate("air")} 
              />
            </View>
          </View>
          
          {/* Info */}
          <View className="mt-6 p-4 bg-surface rounded-2xl">
            <Text className="text-xs text-muted text-center">
              Free users can still level up, evolve, breed, and battle with template pets. 
              Premium unlocks AI-generated custom appearances.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  templateCard: {
    width: "48%",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  premiumButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
});
