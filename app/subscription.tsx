import { useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/shared/game-types";

const TIER_FEATURES = {
  free: {
    color: "#6B7280",
    features: [
      "Template pets only (4 elements)",
      "Basic step tracking",
      "3 battles per day",
      "Join walking groups",
    ],
    limitations: [
      "No AI pet generation",
      "No custom pet images",
      "No battle videos",
      "No 3D models",
    ],
  },
  tier1: {
    color: "#3B82F6",
    features: [
      "AI pet generation on evolution",
      "Text-to-image pet creation",
      "Photo-to-pet transformation",
      "10 AI tokens per month",
      "1 video generation pack",
      "All free tier features",
    ],
    limitations: [
      "Limited regenerations",
      "No 3D models",
    ],
  },
  tier2: {
    color: "#8B5CF6",
    features: [
      "50 AI tokens per month",
      "Unlimited image regenerations",
      "3 video generation packs",
      "Priority matchmaking",
      "Exclusive pet templates",
      "All Tier 1 features",
    ],
    limitations: [
      "No 3D models",
    ],
  },
  tier3: {
    color: "#F59E0B",
    features: [
      "Virtually unlimited tokens",
      "1 3D model generation per month",
      "Unlimited video generations",
      "Exclusive legendary templates",
      "VIP guild badge",
      "Early access to new features",
      "All Tier 2 features",
    ],
    limitations: [],
  },
};

function TierCard({ 
  tier, 
  isCurrentTier, 
  onSelect 
}: { 
  tier: SubscriptionTier; 
  isCurrentTier: boolean;
  onSelect: () => void;
}) {
  const colors = useColors();
  const tierInfo = SUBSCRIPTION_TIERS[tier];
  const tierFeatures = TIER_FEATURES[tier];
  
  return (
    <View 
      className="rounded-2xl p-4 mb-4"
      style={{ 
        backgroundColor: colors.surface,
        borderWidth: isCurrentTier ? 3 : 1,
        borderColor: isCurrentTier ? tierFeatures.color : colors.border,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <View className="flex-row items-center">
            <Text className="text-xl font-bold text-foreground">{tierInfo.name}</Text>
            {isCurrentTier && (
              <View 
                className="ml-2 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: tierFeatures.color }}
              >
                <Text className="text-white text-xs font-medium">Current</Text>
              </View>
            )}
          </View>
          <Text className="text-muted text-sm mt-1">
            {tier === "free" ? "Free forever" : `$${tierInfo.price}/month`}
          </Text>
        </View>
        {tier !== "free" && (
          <View 
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: tierFeatures.color + "20" }}
          >
            <IconSymbol 
              name={tier === "tier3" ? "crown.fill" : "star.fill"} 
              size={24} 
              color={tierFeatures.color} 
            />
          </View>
        )}
      </View>
      
      {/* Tokens */}
      {tier !== "free" && (
        <View className="bg-background rounded-xl p-3 mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-muted">AI Tokens</Text>
            <Text className="text-foreground font-semibold">
              {tierInfo.aiTokensPerMonth === 200 ? "Unlimited" : `${tierInfo.aiTokensPerMonth}/month`}
            </Text>
          </View>
        </View>
      )}
      
      {/* Features */}
      <View className="mb-3">
        {tierFeatures.features.map((feature, index) => (
          <View key={index} className="flex-row items-center py-1.5">
            <IconSymbol name="checkmark" size={16} color={tierFeatures.color} />
            <Text className="text-foreground ml-2 flex-1">{feature}</Text>
          </View>
        ))}
      </View>
      
      {/* Limitations */}
      {tierFeatures.limitations.length > 0 && (
        <View className="mb-3 pt-3 border-t border-border">
          {tierFeatures.limitations.map((limitation, index) => (
            <View key={index} className="flex-row items-center py-1">
              <IconSymbol name="xmark" size={14} color={colors.muted} />
              <Text className="text-muted ml-2 text-sm">{limitation}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Action Button */}
      {!isCurrentTier && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSelect();
          }}
          style={({ pressed }) => [
            styles.tierButton,
            { 
              backgroundColor: tier === "free" ? colors.surface : tierFeatures.color,
              borderColor: tierFeatures.color,
              borderWidth: tier === "free" ? 2 : 0,
              opacity: pressed ? 0.8 : 1,
            }
          ]}
        >
          <Text 
            className="font-semibold text-center"
            style={{ color: tier === "free" ? tierFeatures.color : "white" }}
          >
            {tier === "free" ? "Stay Free" : `Subscribe to ${tierInfo.name}`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function SubscriptionScreen() {
  const { state, dispatch } = useGame();
  const colors = useColors();
  const router = useRouter();
  
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  
  const handleSelectTier = (tier: SubscriptionTier) => {
    if (tier === "free") {
      // Just stay on free tier
      dispatch({ type: "SET_STATE", payload: { subscriptionTier: "free", showPaywall: false } });
      router.back();
      return;
    }
    
    // In a real app, this would open a payment flow
    // For demo, we'll simulate subscription
    setSelectedTier(tier);
    
    // Simulate successful subscription
    setTimeout(() => {
      const tierInfo = SUBSCRIPTION_TIERS[tier];
      dispatch({ 
        type: "SET_STATE", 
        payload: { 
          subscriptionTier: tier,
          aiTokens: tierInfo.aiTokensPerMonth,
          showPaywall: false,
        } 
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }, 1000);
  };
  
  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground ml-2">Choose Your Plan</Text>
        </View>
        
        {/* Current Status */}
        <View className="bg-surface rounded-2xl p-4 mb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-muted text-sm">Current Plan</Text>
              <Text className="text-xl font-bold text-foreground">
                {SUBSCRIPTION_TIERS[state.subscriptionTier].name}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-muted text-sm">AI Tokens</Text>
              <Text className="text-xl font-bold text-primary">{state.aiTokens}</Text>
            </View>
          </View>
        </View>
        
        {/* Tier Cards */}
        <TierCard 
          tier="free" 
          isCurrentTier={state.subscriptionTier === "free"}
          onSelect={() => handleSelectTier("free")}
        />
        
        <TierCard 
          tier="tier1" 
          isCurrentTier={state.subscriptionTier === "tier1"}
          onSelect={() => handleSelectTier("tier1")}
        />
        
        <TierCard 
          tier="tier2" 
          isCurrentTier={state.subscriptionTier === "tier2"}
          onSelect={() => handleSelectTier("tier2")}
        />
        
        <TierCard 
          tier="tier3" 
          isCurrentTier={state.subscriptionTier === "tier3"}
          onSelect={() => handleSelectTier("tier3")}
        />
        
        {/* Info */}
        <View className="mt-4 p-4 bg-surface rounded-2xl">
          <Text className="text-sm text-muted text-center">
            Subscriptions auto-renew monthly. Cancel anytime in your device settings.
            AI tokens reset at the start of each billing cycle.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tierButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
});
