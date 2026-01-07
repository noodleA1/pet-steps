import { useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SUBSCRIPTION_TIERS, type ElementType } from "@/shared/game-types";
import { trpc } from "@/lib/trpc";

// Element colors mapping
const ELEMENT_COLORS: Record<string, string> = {
  fire: "#F97316",
  water: "#3B82F6",
  earth: "#84CC16",
  air: "#06B6D4",
};

type GenerationMode = "text-to-image" | "image-to-image";

function ElementSelector({ selected, onSelect }: { selected: ElementType; onSelect: (e: ElementType) => void }) {
  const elements: ElementType[] = ["fire", "water", "earth", "air"];
  
  return (
    <View className="flex-row justify-between mb-4">
      {elements.map(element => (
        <Pressable
          key={element}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(element);
          }}
          style={({ pressed }) => [
            styles.elementButton,
            { 
              backgroundColor: selected === element ? ELEMENT_COLORS[element] : "transparent",
              borderColor: ELEMENT_COLORS[element],
              opacity: pressed ? 0.8 : 1,
            }
          ]}
        >
          <IconSymbol 
            name="flame" 
            size={24} 
            color={selected === element ? "white" : ELEMENT_COLORS[element]} 
          />
          <Text 
            className={`text-sm font-medium mt-1 capitalize ${selected === element ? "text-white" : "text-foreground"}`}
          >
            {element}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function TokenDisplay({ tokens, tier }: { tokens: number; tier: string }) {
  const colors = useColors();
  const tierInfo = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
  
  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-muted text-sm">AI Tokens</Text>
          <Text className="text-2xl font-bold text-foreground">{tokens}</Text>
        </View>
        <View className="items-end">
          <Text className="text-muted text-sm">{tierInfo.name} Tier</Text>
          <Text className="text-primary text-sm">{tierInfo.aiTokensPerMonth}/month</Text>
        </View>
      </View>
      {tokens <= 0 && (
        <View className="mt-3 pt-3 border-t border-border">
          <Text className="text-warning text-sm text-center">
            You're out of tokens! Upgrade your subscription for more.
          </Text>
        </View>
      )}
    </View>
  );
}

export default function GeneratePetScreen() {
  const { state, createPet, dispatch } = useGame();
  const colors = useColors();
  const router = useRouter();
  
  const [mode, setMode] = useState<GenerationMode>("text-to-image");
  const [selectedElement, setSelectedElement] = useState<ElementType>("fire");
  const [petName, setPetName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const tierInfo = SUBSCRIPTION_TIERS[state.subscriptionTier];
  const canGenerate = tierInfo.canGenerateAI && state.aiTokens > 0;
  
  // Safe image generation mutation with moderation
  const generateSafeMutation = trpc.generateSafePetImage.useMutation({
    onSuccess: (data) => {
      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        // Only deduct token if charged
        if (data.tokensCharged) {
          dispatch({ type: "SET_STATE", payload: { aiTokens: state.aiTokens - 1 } });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(data.error || "Generation failed");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      setIsGenerating(false);
    },
    onError: (err) => {
      setError(err.message || "Failed to generate image");
      setIsGenerating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  // Validate uploaded image
  const validateImageMutation = trpc.validateUploadedImage.useMutation({
    onSuccess: (data) => {
      if (!data.valid) {
        setError(data.reason || "Please use a different image. Human photos and explicit content are not allowed.");
        setReferenceImage(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    },
  });

  // Prompt length limit
  const MAX_PROMPT_LENGTH = 200;
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setReferenceImage(imageUri);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Note: In production, upload image first then validate
      // For now, validation happens during generation
    }
  };
  
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera permission is required to take photos");
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      setReferenceImage(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const handleGenerate = async () => {
    if (!canGenerate) return;
    
    // Check prompt length
    if (prompt.length > MAX_PROMPT_LENGTH) {
      setError(`Prompt too long. Please keep it under ${MAX_PROMPT_LENGTH} characters.`);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Use safe generation with full moderation pipeline
      generateSafeMutation.mutate({
        userPrompt: prompt,
        element: selectedElement,
        evolutionLevel: state.activePet?.level || 1,
        secondaryElement: state.activePet?.secondaryElement,
        referenceImageUrl: mode === "image-to-image" ? referenceImage || undefined : undefined,
      });
    } catch (err) {
      setError("Failed to start generation");
      setIsGenerating(false);
    }
  };
  
  const handleCreatePet = () => {
    if (!generatedImage || !petName.trim()) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createPet(selectedElement, petName.trim(), false, undefined, generatedImage);
    router.replace("/(tabs)");
  };
  
  // Check if user has access
  if (!tierInfo.canGenerateAI) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-row items-center mb-4">
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground ml-2">AI Pet Generation</Text>
        </View>
        
        <View className="flex-1 items-center justify-center">
          <IconSymbol name="lock.fill" size={64} color={colors.muted} />
          <Text className="text-xl font-semibold text-foreground mt-4 mb-2">Premium Feature</Text>
          <Text className="text-muted text-center px-8 mb-6">
            AI pet generation is available for Basic tier ($2/mo) and above. 
            Create unique pets with text-to-image or evolve your real pet's photo!
          </Text>
          <Pressable
            onPress={() => router.push("/profile")}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Text className="text-white font-semibold">View Subscription Plans</Text>
          </Pressable>
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
          <Text className="text-2xl font-bold text-foreground ml-2">Create AI Pet</Text>
        </View>
        
        {/* Token Display */}
        <TokenDisplay tokens={state.aiTokens} tier={state.subscriptionTier} />
        
        {/* Mode Selection */}
        <View className="flex-row mb-4">
          <Pressable
            onPress={() => {
              setMode("text-to-image");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={({ pressed }) => [
              styles.modeButton,
              { 
                backgroundColor: mode === "text-to-image" ? colors.primary : colors.surface,
                opacity: pressed ? 0.8 : 1,
                flex: 1,
                marginRight: 8,
              }
            ]}
          >
            <IconSymbol 
              name="sparkles" 
              size={20} 
              color={mode === "text-to-image" ? "white" : colors.foreground} 
            />
            <Text className={`font-medium ml-2 ${mode === "text-to-image" ? "text-white" : "text-foreground"}`}>
              Text to Image
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              setMode("image-to-image");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={({ pressed }) => [
              styles.modeButton,
              { 
                backgroundColor: mode === "image-to-image" ? colors.primary : colors.surface,
                opacity: pressed ? 0.8 : 1,
                flex: 1,
              }
            ]}
          >
            <IconSymbol 
              name="photo.fill" 
              size={20} 
              color={mode === "image-to-image" ? "white" : colors.foreground} 
            />
            <Text className={`font-medium ml-2 ${mode === "image-to-image" ? "text-white" : "text-foreground"}`}>
              Photo to Pet
            </Text>
          </Pressable>
        </View>
        
        {/* Element Selection */}
        <Text className="text-lg font-semibold text-foreground mb-2">Choose Element</Text>
        <ElementSelector selected={selectedElement} onSelect={setSelectedElement} />
        
        {/* Image-to-Image: Reference Image */}
        {mode === "image-to-image" && (
          <View className="mb-4">
            <Text className="text-lg font-semibold text-foreground mb-2">Reference Photo</Text>
            <Text className="text-sm text-muted mb-3">
              Take a photo of your real pet and watch it transform into a fantasy creature!
            </Text>
            
            {referenceImage ? (
              <View className="items-center">
                <Image
                  source={{ uri: referenceImage }}
                  style={{ width: 200, height: 200, borderRadius: 16 }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => setReferenceImage(null)}
                  style={({ pressed }) => [
                    styles.smallButton,
                    { backgroundColor: colors.error, opacity: pressed ? 0.8 : 1, marginTop: 12 }
                  ]}
                >
                  <Text className="text-white font-medium">Remove Photo</Text>
                </Pressable>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <Pressable
                  onPress={takePhoto}
                  style={({ pressed }) => [
                    styles.photoButton,
                    { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1, flex: 1 }
                  ]}
                >
                  <IconSymbol name="camera.fill" size={32} color={colors.primary} />
                  <Text className="text-foreground font-medium mt-2">Take Photo</Text>
                </Pressable>
                
                <Pressable
                  onPress={pickImage}
                  style={({ pressed }) => [
                    styles.photoButton,
                    { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1, flex: 1 }
                  ]}
                >
                  <IconSymbol name="photo.fill" size={32} color={colors.primary} />
                  <Text className="text-foreground font-medium mt-2">Choose Photo</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
        
        {/* Prompt Input */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-2">
            {mode === "text-to-image" ? "Describe Your Pet" : "Evolution Details"}
          </Text>
          <Text className="text-sm text-muted mb-2">
            {mode === "text-to-image" 
              ? "Add details like wings, horns, twin heads, armor, etc."
              : "Describe how you want your pet to evolve (e.g., 'add dragon wings', 'make it more fierce')"}
          </Text>
          <TextInput
            className="bg-surface rounded-xl p-4 text-foreground min-h-[100px]"
            placeholder="e.g., dragon with crystal wings, glowing eyes, majestic pose..."
            placeholderTextColor={colors.muted}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            textAlignVertical="top"
          />
        </View>
        
        {/* Error Display */}
        {error && (
          <View className="bg-error/20 rounded-xl p-3 mb-4">
            <Text className="text-error text-center">{error}</Text>
          </View>
        )}
        
        {/* Generated Image Preview */}
        {generatedImage && (
          <View className="items-center mb-4">
            <Text className="text-lg font-semibold text-foreground mb-2">Your New Pet!</Text>
            <View 
              className="rounded-2xl overflow-hidden"
              style={{ borderWidth: 3, borderColor: ELEMENT_COLORS[selectedElement] }}
            >
              <Image
                source={{ uri: generatedImage }}
                style={{ width: 250, height: 250 }}
                contentFit="cover"
              />
            </View>
            
            {/* Pet Name Input */}
            <View className="w-full mt-4">
              <Text className="text-sm text-muted mb-2">Name your pet:</Text>
              <TextInput
                className="bg-surface rounded-xl p-4 text-foreground text-center text-lg"
                placeholder="Enter pet name..."
                placeholderTextColor={colors.muted}
                value={petName}
                onChangeText={setPetName}
              />
            </View>
          </View>
        )}
        
        {/* Action Buttons */}
        <View className="gap-3 mt-4">
          {!generatedImage ? (
            <Pressable
              onPress={handleGenerate}
              disabled={isGenerating || !canGenerate || (mode === "image-to-image" && !referenceImage)}
              style={({ pressed }) => [
                styles.primaryButton,
                { 
                  backgroundColor: canGenerate ? colors.primary : colors.muted,
                  opacity: (pressed && canGenerate) || isGenerating ? 0.8 : 1,
                }
              ]}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-semibold text-lg ml-2">Generating...</Text>
                </>
              ) : (
                <>
                  <IconSymbol name="sparkles" size={24} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    Generate Pet (1 Token)
                  </Text>
                </>
              )}
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={handleCreatePet}
                disabled={!petName.trim()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { 
                    backgroundColor: petName.trim() ? colors.success : colors.muted,
                    opacity: pressed && petName.trim() ? 0.8 : 1,
                  }
                ]}
              >
                <IconSymbol name="checkmark" size={24} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">Adopt This Pet!</Text>
              </Pressable>
              
              <Pressable
                onPress={() => {
                  setGeneratedImage(null);
                  setPetName("");
                }}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
                <Text className="text-primary font-semibold ml-2">Generate Again</Text>
              </Pressable>
            </>
          )}
        </View>
        
        {/* Info */}
        <View className="mt-6 p-4 bg-surface rounded-2xl">
          <Text className="text-sm text-muted text-center">
            {mode === "text-to-image" 
              ? "AI will generate a unique pet based on your description and chosen element. Each generation costs 1 token."
              : "Upload a photo of your real pet and AI will transform it into a fantasy creature with your chosen element!"}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  elementButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 70,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  photoButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    borderRadius: 16,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
