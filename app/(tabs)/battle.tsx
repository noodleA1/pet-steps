import { useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, Modal } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ELEMENT_EFFECTIVENESS, getCareModifiers, type BattleTurn, DAILY_BATTLE_LIMIT } from "@/shared/game-types";

// Element colors mapping
const ELEMENT_COLORS: Record<string, string> = {
  fire: "#F97316",
  water: "#3B82F6",
  earth: "#84CC16",
  air: "#06B6D4",
};

// Mock opponents for demo
const MOCK_OPPONENTS = [
  { id: "1", name: "Shadow Wolf", element: "air", level: 15, attack: 18, defense: 12, health: 95, imageUrl: "https://placehold.co/150x150/06B6D4/white?text=Wolf" },
  { id: "2", name: "Flame Serpent", element: "fire", level: 12, attack: 20, defense: 10, health: 85, imageUrl: "https://placehold.co/150x150/F97316/white?text=Serpent" },
  { id: "3", name: "Stone Guardian", element: "earth", level: 18, attack: 14, defense: 22, health: 120, imageUrl: "https://placehold.co/150x150/84CC16/white?text=Guardian" },
  { id: "4", name: "Tide Dragon", element: "water", level: 20, attack: 16, defense: 18, health: 110, imageUrl: "https://placehold.co/150x150/3B82F6/white?text=Dragon" },
];

interface BattleState {
  isActive: boolean;
  opponent: typeof MOCK_OPPONENTS[0] | null;
  playerHealth: number;
  opponentHealth: number;
  turns: BattleTurn[];
  currentTurn: number;
  isPlayerTurn: boolean;
  winner: "player" | "opponent" | null;
}

function BattleHistoryItem({ won, opponentName, opponentLevel, date }: { won: boolean; opponentName: string; opponentLevel: number; date: string }) {
  const colors = useColors();
  
  return (
    <View className="bg-surface rounded-xl p-3 mb-2 flex-row items-center">
      <View 
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: won ? colors.success : colors.error }}
      >
        <IconSymbol name={won ? "trophy.fill" : "xmark"} size={20} color="white" />
      </View>
      <View className="flex-1">
        <Text className="text-foreground font-medium">{opponentName}</Text>
        <Text className="text-sm text-muted">Level {opponentLevel}</Text>
      </View>
      <View className="items-end">
        <Text className={`font-semibold ${won ? "text-success" : "text-error"}`}>
          {won ? "Victory" : "Defeat"}
        </Text>
        <Text className="text-xs text-muted">{date}</Text>
      </View>
    </View>
  );
}

function OpponentCard({ opponent, onSelect, disabled }: { opponent: typeof MOCK_OPPONENTS[0]; onSelect: () => void; disabled: boolean }) {
  const colors = useColors();
  
  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect();
        }
      }}
      style={({ pressed }) => [
        styles.opponentCard,
        { 
          borderColor: ELEMENT_COLORS[opponent.element],
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        }
      ]}
    >
      <Image
        source={{ uri: opponent.imageUrl }}
        style={{ width: 60, height: 60, borderRadius: 30 }}
        contentFit="cover"
      />
      <View className="ml-3 flex-1">
        <Text className="text-foreground font-semibold">{opponent.name}</Text>
        <View className="flex-row items-center mt-1">
          <View 
            className="px-2 py-0.5 rounded-full mr-2"
            style={{ backgroundColor: ELEMENT_COLORS[opponent.element] }}
          >
            <Text className="text-white text-xs capitalize">{opponent.element}</Text>
          </View>
          <Text className="text-muted text-sm">Lv.{opponent.level}</Text>
        </View>
      </View>
      <View className="items-end">
        <View className="flex-row items-center">
          <IconSymbol name="flame.fill" size={14} color={colors.attack} />
          <Text className="text-sm text-foreground ml-1">{opponent.attack}</Text>
        </View>
        <View className="flex-row items-center">
          <IconSymbol name="shield.fill" size={14} color={colors.defense} />
          <Text className="text-sm text-foreground ml-1">{opponent.defense}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function BattleArena({ battle, onClose }: { battle: BattleState; onClose: () => void }) {
  const { state } = useGame();
  const colors = useColors();
  const pet = state.activePet;
  
  if (!pet || !battle.opponent) return null;
  
  const playerHealthPercent = (battle.playerHealth / pet.maxHealth) * 100;
  const opponentHealthPercent = (battle.opponentHealth / battle.opponent.health) * 100;
  
  return (
    <View className="flex-1 bg-background p-4">
      {/* Battle Header */}
      <View className="items-center mb-6">
        <Text className="text-2xl font-bold text-foreground">Battle!</Text>
        <Text className="text-muted">Turn {battle.currentTurn}</Text>
      </View>
      
      {/* Opponent */}
      <View className="items-center mb-4">
        <Text className="text-lg font-semibold text-foreground mb-2">{battle.opponent.name}</Text>
        <View 
          className="w-32 h-32 rounded-full items-center justify-center overflow-hidden mb-2"
          style={{ borderWidth: 3, borderColor: ELEMENT_COLORS[battle.opponent.element] }}
        >
          <Image
            source={{ uri: battle.opponent.imageUrl }}
            style={{ width: 120, height: 120 }}
            contentFit="cover"
          />
        </View>
        {/* Health Bar */}
        <View className="w-48">
          <View className="h-4 bg-surface rounded-full overflow-hidden">
            <View 
              style={[
                styles.healthBar,
                { 
                  width: `${opponentHealthPercent}%`,
                  backgroundColor: opponentHealthPercent > 50 ? colors.success : opponentHealthPercent > 25 ? colors.warning : colors.error,
                }
              ]}
            />
          </View>
          <Text className="text-center text-sm text-muted mt-1">
            {battle.opponentHealth}/{battle.opponent.health}
          </Text>
        </View>
      </View>
      
      {/* VS */}
      <View className="items-center my-4">
        <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
          <Text className="text-white text-xl font-bold">VS</Text>
        </View>
      </View>
      
      {/* Player Pet */}
      <View className="items-center mb-4">
        <Text className="text-lg font-semibold text-foreground mb-2">{pet.name}</Text>
        <View 
          className="w-32 h-32 rounded-full items-center justify-center overflow-hidden mb-2"
          style={{ borderWidth: 3, borderColor: ELEMENT_COLORS[pet.primaryElement] }}
        >
          <Image
            source={{ uri: pet.imageUrl || "https://placehold.co/150x150/6366F1/white?text=Pet" }}
            style={{ width: 120, height: 120 }}
            contentFit="cover"
          />
        </View>
        {/* Health Bar */}
        <View className="w-48">
          <View className="h-4 bg-surface rounded-full overflow-hidden">
            <View 
              style={[
                styles.healthBar,
                { 
                  width: `${playerHealthPercent}%`,
                  backgroundColor: playerHealthPercent > 50 ? colors.success : playerHealthPercent > 25 ? colors.warning : colors.error,
                }
              ]}
            />
          </View>
          <Text className="text-center text-sm text-muted mt-1">
            {battle.playerHealth}/{pet.maxHealth}
          </Text>
        </View>
      </View>
      
      {/* Battle Log */}
      <View className="bg-surface rounded-2xl p-4 flex-1 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-2">Battle Log</Text>
        <ScrollView>
          {battle.turns.map((turn, index) => (
            <Text key={index} className="text-sm text-muted mb-1">
              Turn {turn.turn}: {turn.isCrit ? "CRITICAL! " : ""}{turn.damage} damage dealt
            </Text>
          ))}
          {battle.winner && (
            <Text className={`text-lg font-bold mt-2 ${battle.winner === "player" ? "text-success" : "text-error"}`}>
              {battle.winner === "player" ? "Victory!" : "Defeat..."}
            </Text>
          )}
        </ScrollView>
      </View>
      
      {/* Close Button */}
      {battle.winner && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onClose();
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            { 
              backgroundColor: battle.winner === "player" ? colors.success : colors.primary,
              opacity: pressed ? 0.8 : 1,
            }
          ]}
        >
          <Text className="text-white text-lg font-semibold">
            {battle.winner === "player" ? "Claim Rewards" : "Continue"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function BattleScreen() {
  const { state, canBattle, useBattle } = useGame();
  const colors = useColors();
  const pet = state.activePet;
  
  const [battle, setBattle] = useState<BattleState>({
    isActive: false,
    opponent: null,
    playerHealth: 0,
    opponentHealth: 0,
    turns: [],
    currentTurn: 0,
    isPlayerTurn: true,
    winner: null,
  });
  
  const [showBattleModal, setShowBattleModal] = useState(false);
  
  const battlesRemaining = DAILY_BATTLE_LIMIT - state.dailyBattlesUsed;
  const today = new Date().toDateString();
  const actualBattlesRemaining = state.lastBattleDate === today ? battlesRemaining : DAILY_BATTLE_LIMIT;
  
  // Mock battle history
  const battleHistory = [
    { won: true, opponentName: "Fire Drake", opponentLevel: 12, date: "Today" },
    { won: false, opponentName: "Stone Titan", opponentLevel: 18, date: "Yesterday" },
    { won: true, opponentName: "Wind Spirit", opponentLevel: 10, date: "2 days ago" },
  ];
  
  const startBattle = (opponent: typeof MOCK_OPPONENTS[0]) => {
    if (!pet || !canBattle()) return;
    
    useBattle();
    
    // Initialize battle
    setBattle({
      isActive: true,
      opponent,
      playerHealth: pet.maxHealth,
      opponentHealth: opponent.health,
      turns: [],
      currentTurn: 1,
      isPlayerTurn: true,
      winner: null,
    });
    
    setShowBattleModal(true);
    
    // Simulate auto-battle
    simulateBattle(opponent);
  };
  
  const simulateBattle = (opponent: typeof MOCK_OPPONENTS[0]) => {
    if (!pet) return;
    
    let playerHealth = pet.maxHealth;
    let opponentHealth = opponent.health;
    const turns: BattleTurn[] = [];
    let currentTurn = 1;
    let isPlayerTurn = true;
    
    // Get care modifiers
    const careModifiers = getCareModifiers(pet.happiness, pet.hunger, pet.thirst);
    
    // Get element effectiveness
    const playerElement = pet.primaryElement as keyof typeof ELEMENT_EFFECTIVENESS;
    const opponentElement = opponent.element as keyof typeof ELEMENT_EFFECTIVENESS;
    const playerEffectiveness = ELEMENT_EFFECTIVENESS[playerElement]?.[opponentElement] || 1;
    const opponentEffectiveness = ELEMENT_EFFECTIVENESS[opponentElement]?.[playerElement] || 1;
    
    // Simulate turns
    const interval = setInterval(() => {
      if (playerHealth <= 0 || opponentHealth <= 0) {
        clearInterval(interval);
        const winner = playerHealth > 0 ? "player" : "opponent";
        setBattle(prev => ({ ...prev, winner, turns }));
        return;
      }
      
      if (isPlayerTurn) {
        // Player attacks
        const baseDamage = pet.attack * careModifiers.attackMod;
        const defense = opponent.defense;
        const isCrit = Math.random() < (pet.critRate + careModifiers.critMod);
        const critMultiplier = isCrit ? 1.5 : 1;
        const damage = Math.max(1, Math.floor((baseDamage - defense * 0.5) * playerEffectiveness * critMultiplier));
        
        opponentHealth = Math.max(0, opponentHealth - damage);
        
        turns.push({
          turn: currentTurn,
          attackerId: 1,
          defenderId: 2,
          damage,
          isCrit,
          attackerHealthAfter: playerHealth,
          defenderHealthAfter: opponentHealth,
        });
      } else {
        // Opponent attacks
        const baseDamage = opponent.attack;
        const defense = pet.defense * careModifiers.defenseMod;
        const isCrit = Math.random() < 0.1;
        const critMultiplier = isCrit ? 1.5 : 1;
        const damage = Math.max(1, Math.floor((baseDamage - defense * 0.5) * opponentEffectiveness * critMultiplier));
        
        playerHealth = Math.max(0, playerHealth - damage);
        
        turns.push({
          turn: currentTurn,
          attackerId: 2,
          defenderId: 1,
          damage,
          isCrit,
          attackerHealthAfter: opponentHealth,
          defenderHealthAfter: playerHealth,
        });
        
        currentTurn++;
      }
      
      isPlayerTurn = !isPlayerTurn;
      
      setBattle(prev => ({
        ...prev,
        playerHealth,
        opponentHealth,
        turns: [...turns],
        currentTurn,
        isPlayerTurn,
      }));
    }, 1000);
  };
  
  const closeBattle = () => {
    setShowBattleModal(false);
    setBattle({
      isActive: false,
      opponent: null,
      playerHealth: 0,
      opponentHealth: 0,
      turns: [],
      currentTurn: 0,
      isPlayerTurn: true,
      winner: null,
    });
  };
  
  if (!pet) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <IconSymbol name="bolt.fill" size={64} color={colors.muted} />
          <Text className="text-xl font-semibold text-foreground mt-4">No Pet</Text>
          <Text className="text-muted text-center mt-2">
            You need a pet to battle! Go to the Pet tab to get started.
          </Text>
        </View>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-2xl font-bold text-foreground">Battle Arena</Text>
          <Text className="text-muted">Challenge opponents to earn rewards!</Text>
        </View>
        
        {/* Daily Battles */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold text-foreground">Daily Battles</Text>
            <Text className="text-primary font-medium">{actualBattlesRemaining}/{DAILY_BATTLE_LIMIT}</Text>
          </View>
          <View className="h-3 bg-background rounded-full overflow-hidden">
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(actualBattlesRemaining / DAILY_BATTLE_LIMIT) * 100}%`,
                  backgroundColor: colors.primary,
                }
              ]}
            />
          </View>
          <Text className="text-sm text-muted mt-2 text-center">
            {actualBattlesRemaining > 0 
              ? `${actualBattlesRemaining} battles remaining today`
              : "No battles remaining. Come back tomorrow!"}
          </Text>
        </View>
        
        {/* Find Opponent */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Find Opponent</Text>
          {MOCK_OPPONENTS.map(opponent => (
            <OpponentCard
              key={opponent.id}
              opponent={opponent}
              onSelect={() => startBattle(opponent)}
              disabled={actualBattlesRemaining <= 0}
            />
          ))}
        </View>
        
        {/* Battle History */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Recent Battles</Text>
          {battleHistory.map((battle, index) => (
            <BattleHistoryItem
              key={index}
              won={battle.won}
              opponentName={battle.opponentName}
              opponentLevel={battle.opponentLevel}
              date={battle.date}
            />
          ))}
        </View>
        
        {/* Your Stats */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Your Battle Stats</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-muted">Win Rate</Text>
            <Text className="text-foreground font-medium">67%</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-muted">Total Battles</Text>
            <Text className="text-foreground font-medium">24</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Current Streak</Text>
            <Text className="text-success font-medium">3 wins</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Battle Modal */}
      <Modal
        visible={showBattleModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <BattleArena battle={battle} onClose={closeBattle} />
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  opponentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  healthBar: {
    height: "100%",
    borderRadius: 999,
  },
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
});
