import { useState, useEffect } from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const SAFETY_WARNING_KEY = "safety_warning_shown";
const WARNING_INTERVAL = 24 * 60 * 60 * 1000; // Show once per day

interface SafetyWarningModalProps {
  visible?: boolean;
  onDismiss?: () => void;
  forceShow?: boolean;
}

export function SafetyWarningModal({ visible: externalVisible, onDismiss, forceShow }: SafetyWarningModalProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const colors = useColors();
  
  const visible = externalVisible ?? internalVisible;
  
  useEffect(() => {
    if (forceShow) return;
    
    checkAndShowWarning();
  }, [forceShow]);
  
  const checkAndShowWarning = async () => {
    try {
      const lastShown = await AsyncStorage.getItem(SAFETY_WARNING_KEY);
      const now = Date.now();
      
      if (!lastShown || (now - parseInt(lastShown, 10)) > WARNING_INTERVAL) {
        setInternalVisible(true);
      }
    } catch (error) {
      // If error reading, show warning to be safe
      setInternalVisible(true);
    }
  };
  
  const handleDismiss = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await AsyncStorage.setItem(SAFETY_WARNING_KEY, Date.now().toString());
    } catch (error) {
      console.error("Failed to save warning state:", error);
    }
    
    setInternalVisible(false);
    onDismiss?.();
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Warning Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.warning + "20" }]}>
            <IconSymbol name="exclamationmark.triangle" size={48} color={colors.warning} />
          </View>
          
          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            Stay Safe While Walking!
          </Text>
          
          {/* Warning Messages */}
          <View style={styles.messageContainer}>
            <View style={styles.messageRow}>
              <IconSymbol name="eye" size={20} color={colors.primary} />
              <Text style={[styles.message, { color: colors.muted }]}>
                Always be aware of your surroundings
              </Text>
            </View>
            
            <View style={styles.messageRow}>
              <IconSymbol name="figure.walk" size={20} color={colors.primary} />
              <Text style={[styles.message, { color: colors.muted }]}>
                Watch for traffic and obstacles
              </Text>
            </View>
            
            <View style={styles.messageRow}>
              <IconSymbol name="headphones" size={20} color={colors.primary} />
              <Text style={[styles.message, { color: colors.muted }]}>
                Keep volume low to hear your environment
              </Text>
            </View>
            
            <View style={styles.messageRow}>
              <IconSymbol name="moon.stars" size={20} color={colors.primary} />
              <Text style={[styles.message, { color: colors.muted }]}>
                Use caution when walking at night
              </Text>
            </View>
          </View>
          
          {/* Disclaimer */}
          <Text style={[styles.disclaimer, { color: colors.muted }]}>
            Your safety is more important than any game. Stop and look up whenever you need to interact with the app.
          </Text>
          
          {/* Acknowledge Button */}
          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Text style={styles.buttonText}>I Understand</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  messageContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 20,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  message: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    fontStyle: "italic",
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
