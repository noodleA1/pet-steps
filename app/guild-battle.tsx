import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, Modal } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GUILD_BATTLE, GuildLeaderboardEntry, MemberContribution } from "@/shared/game-types";

// Mock competing guilds in current bracket
const MOCK_BRACKET_GUILDS = [
  { id: "1", name: "Step Warriors", rank: 1, totalPoints: 2450, battlePoints: 1200, stepsPoints: 1250 },
  { id: "2", name: "Walking Dead", rank: 2, totalPoints: 2100, battlePoints: 900, stepsPoints: 1200 },
  { id: "3", name: "Pace Makers", rank: 3, totalPoints: 1850, battlePoints: 750, stepsPoints: 1100 },
  { id: "4", name: "Trail Blazers", rank: 4, totalPoints: 1500, battlePoints: 600, stepsPoints: 900 },
  { id: "5", name: "Foot Soldiers", rank: 5, totalPoints: 1200, battlePoints: 400, stepsPoints: 800 },
];

// Mock opponents from other guilds
const MOCK_OPPONENTS = [
  { id: "op1", name: "ShadowWalker", guildId: "2", guildName: "Walking Dead", petName: "Dark Phoenix", petLevel: 42, petElement: "fire", power: 3200 },
  { id: "op2", name: "StormChaser", guildId: "3", guildName: "Pace Makers", petName: "Thunder Eagle", petLevel: 38, petElement: "air", power: 2900 },
  { id: "op3", name: "EarthShaker", guildId: "4", guildName: "Trail Blazers", petName: "Stone Giant", petLevel: 45, petElement: "earth", power: 3400 },
];

// Mock member contributions
const MOCK_CONTRIBUTIONS: MemberContribution[] = [
  { memberId: "1", memberName: "StepMaster", steps: 52000, battleWins: 8, battleLosses: 2, pointsContributed: 450 },
  { memberId: "2", memberName: "WalkingWonder", steps: 48000, battleWins: 6, battleLosses: 3, pointsContributed: 380 },
  { memberId: "3", memberName: "PaceRunner", steps: 45000, battleWins: 5, battleLosses: 4, pointsContributed: 320 },
  { memberId: "4", memberName: "You", steps: 38000, battleWins: 4, battleLosses: 2, pointsContributed: 280 },
  { memberId: "5", memberName: "TrailHiker", steps: 35000, battleWins: 3, battleLosses: 5, pointsContributed: 200 },
];

function GuildRankCard({ guild, isMyGuild }: { guild: typeof MOCK_BRACKET_GUILDS[0]; isMyGuild: boolean }) {
  const colors = useColors();
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return colors.muted;
  };
  
  return (
    <View 
      className="flex-row items-center p-3 rounded-xl mb-2"
      style={{ backgroundColor: isMyGuild ? `${colors.primary}20` : colors.surface }}
    >
      <View 
        className="w-8 h-8 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: getRankColor(guild.rank) }}
      >
        <Text className="text-white font-bold text-sm">#{guild.rank}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-foreground font-semibold">{guild.name}</Text>
        <Text className="text-muted text-xs">
          Battle: {guild.battlePoints} • Steps: {guild.stepsPoints}
        </Text>
      </View>
      <Text className="text-foreground font-bold text-lg">{guild.totalPoints.toLocaleString()}</Text>
      {isMyGuild && (
        <View className="ml-2 bg-primary px-2 py-1 rounded">
          <Text className="text-white text-xs font-medium">YOU</Text>
        </View>
      )}
    </View>
  );
}

function OpponentCard({ 
  opponent, 
  onBattle, 
  disabled 
}: { 
  opponent: typeof MOCK_OPPONENTS[0]; 
  onBattle: () => void;
  disabled: boolean;
}) {
  const colors = useColors();
  
  const getElementColor = (element: string) => {
    const elementColors: Record<string, string> = {
      fire: "#FF6B35",
      water: "#4A90D9",
      earth: "#8B7355",
      air: "#87CEEB",
    };
    return elementColors[element] || colors.muted;
  };
  
  // Higher ranked guild = more points
  const guildRank = MOCK_BRACKET_GUILDS.find(g => g.id === opponent.guildId)?.rank || 5;
  const pointsForWin = Math.floor(GUILD_BATTLE.pointsPerWin * (1 + (5 - guildRank) * GUILD_BATTLE.rankBonusMultiplier));
  
  return (
    <View className="bg-surface rounded-2xl p-4 mb-3">
      <View className="flex-row items-center mb-3">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: getElementColor(opponent.petElement) }}
        >
          <IconSymbol name="flame.fill" size={24} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{opponent.name}</Text>
          <Text className="text-muted text-sm">{opponent.guildName}</Text>
        </View>
        <View className="items-end">
          <Text className="text-foreground font-bold">{opponent.power}</Text>
          <Text className="text-xs text-muted">Power</Text>
        </View>
      </View>
      
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-foreground">{opponent.petName}</Text>
          <Text className="text-muted text-xs">Level {opponent.petLevel} • {opponent.petElement}</Text>
        </View>
        <View className="bg-primary/20 px-3 py-1 rounded-full">
          <Text className="text-primary font-medium">+{pointsForWin} pts</Text>
        </View>
      </View>
      
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onBattle();
        }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.battleButton,
          { 
            backgroundColor: disabled ? colors.muted : colors.primary, 
            opacity: pressed ? 0.8 : 1 
          }
        ]}
      >
        <IconSymbol name="bolt.fill" size={20} color="white" />
        <Text className="text-white font-semibold ml-2">
          {disabled ? "No Energy" : "Guild Battle"}
        </Text>
      </Pressable>
    </View>
  );
}

function ContributionRow({ contribution, rank }: { contribution: MemberContribution; rank: number }) {
  const colors = useColors();
  const isYou = contribution.memberName === "You";
  
  return (
    <View 
      className="flex-row items-center py-3 border-b"
      style={{ borderBottomColor: colors.border }}
    >
      <Text className="w-8 text-muted font-medium">#{rank}</Text>
      <View className="flex-1">
        <Text className={`font-medium ${isYou ? "text-primary" : "text-foreground"}`}>
          {contribution.memberName}
        </Text>
        <Text className="text-xs text-muted">
          {contribution.steps.toLocaleString()} steps • {contribution.battleWins}W/{contribution.battleLosses}L
        </Text>
      </View>
      <Text className="text-foreground font-bold">{contribution.pointsContributed}</Text>
    </View>
  );
}

export default function GuildBattleScreen() {
  const { state, getGuildBattleInfo, useGuildBattleEnergy } = useGame();
  const colors = useColors();
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<typeof MOCK_OPPONENTS[0] | null>(null);
  const [battleResult, setBattleResult] = useState<"win" | "lose" | null>(null);
  const [activeTab, setActiveTab] = useState<"battle" | "leaderboard" | "contributions">("battle");
  
  const guildInfo = getGuildBattleInfo();
  const competitionDaysLeft = 5; // Mock - would come from server
  
  const handleBattle = (opponent: typeof MOCK_OPPONENTS[0]) => {
    if (!guildInfo.canBattle) return;
    
    setSelectedOpponent(opponent);
    setShowBattleModal(true);
    
    // Use energy
    useGuildBattleEnergy();
    
    // Simulate battle (would be server-side in production)
    setTimeout(() => {
      const won = Math.random() > 0.4; // 60% win rate for demo
      setBattleResult(won ? "win" : "lose");
    }, 2000);
  };
  
  const closeBattleModal = () => {
    setShowBattleModal(false);
    setSelectedOpponent(null);
    setBattleResult(null);
  };
  
  if (!state.guildId) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <IconSymbol name="person.3.fill" size={64} color={colors.muted} />
          <Text className="text-xl font-semibold text-foreground mt-4 mb-2">Join a Guild First</Text>
          <Text className="text-muted text-center mb-6">
            You need to be in a guild to participate in guild battles.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="p-4 pb-0">
          <View className="flex-row items-center mb-4">
            <Pressable onPress={() => router.back()} className="mr-3">
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">Guild Battle</Text>
          </View>
          
          {/* Competition Status */}
          <View className="bg-primary rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <IconSymbol name="trophy.fill" size={20} color="white" />
                <Text className="text-white font-bold ml-2">Competition Active</Text>
              </View>
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white font-medium">{competitionDaysLeft} days left</Text>
              </View>
            </View>
            <Text className="text-white/80 text-sm mb-3">
              Battle members from competing guilds to earn points!
            </Text>
            
            {/* Guild Battle Energy */}
            <View className="bg-white/10 rounded-xl p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-medium">Guild Battle Energy</Text>
                <View className="flex-row">
                  {[...Array(guildInfo.maxEnergy)].map((_, i) => (
                    <View 
                      key={i}
                      className="w-6 h-6 rounded-full mx-0.5 items-center justify-center"
                      style={{ backgroundColor: i < guildInfo.energy ? "#FFD700" : "rgba(255,255,255,0.2)" }}
                    >
                      <IconSymbol name="bolt.fill" size={14} color={i < guildInfo.energy ? "#000" : "rgba(255,255,255,0.5)"} />
                    </View>
                  ))}
                </View>
              </View>
              <Text className="text-white/60 text-xs mt-1">
                {guildInfo.energy}/{guildInfo.maxEnergy} battles remaining today
              </Text>
            </View>
          </View>
          
          {/* Tab Selector */}
          <View className="flex-row bg-surface rounded-xl p-1 mb-4">
            {(["battle", "leaderboard", "contributions"] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="flex-1 py-2 rounded-lg"
                style={{ backgroundColor: activeTab === tab ? colors.primary : "transparent" }}
              >
                <Text 
                  className="text-center font-medium capitalize"
                  style={{ color: activeTab === tab ? "white" : colors.muted }}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Content */}
        <View className="px-4 pb-4">
          {activeTab === "battle" && (
            <>
              <Text className="text-lg font-semibold text-foreground mb-3">Available Opponents</Text>
              {MOCK_OPPONENTS.map((opponent) => (
                <OpponentCard
                  key={opponent.id}
                  opponent={opponent}
                  onBattle={() => handleBattle(opponent)}
                  disabled={!guildInfo.canBattle}
                />
              ))}
              {!guildInfo.canBattle && (
                <View className="bg-surface rounded-xl p-4 items-center">
                  <IconSymbol name="bolt.fill" size={32} color={colors.muted} />
                  <Text className="text-muted text-center mt-2">
                    No guild battle energy remaining today.{"\n"}Come back tomorrow!
                  </Text>
                </View>
              )}
            </>
          )}
          
          {activeTab === "leaderboard" && (
            <>
              <Text className="text-lg font-semibold text-foreground mb-3">Bracket Standings</Text>
              {MOCK_BRACKET_GUILDS.map((guild) => (
                <GuildRankCard 
                  key={guild.id} 
                  guild={guild} 
                  isMyGuild={guild.id === "1"} // Mock - first guild is "ours"
                />
              ))}
              <View className="bg-surface rounded-xl p-4 mt-4">
                <Text className="text-foreground font-medium mb-2">How Points Work</Text>
                <Text className="text-muted text-sm">
                  • Win a battle: +{GUILD_BATTLE.pointsPerWin} base points{"\n"}
                  • Beat higher ranked guild: +{GUILD_BATTLE.rankBonusMultiplier * 100}% bonus{"\n"}
                  • Every {GUILD_BATTLE.stepsPointsRatio.toLocaleString()} guild steps: +1 point{"\n"}
                  • Lose a battle: +{GUILD_BATTLE.pointsPerLoss} consolation points
                </Text>
              </View>
            </>
          )}
          
          {activeTab === "contributions" && (
            <>
              <Text className="text-lg font-semibold text-foreground mb-3">Member Contributions</Text>
              <View className="bg-surface rounded-xl p-4">
                {MOCK_CONTRIBUTIONS.map((contribution, index) => (
                  <ContributionRow 
                    key={contribution.memberId} 
                    contribution={contribution} 
                    rank={index + 1} 
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Battle Modal */}
      <Modal
        visible={showBattleModal}
        animationType="fade"
        transparent
        onRequestClose={closeBattleModal}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-6">
          <View className="bg-background rounded-3xl p-6 w-full max-w-sm">
            {!battleResult ? (
              <>
                <Text className="text-2xl font-bold text-foreground text-center mb-4">
                  Guild Battle!
                </Text>
                <View className="items-center mb-6">
                  <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-2">
                    <IconSymbol name="bolt.fill" size={40} color="white" />
                  </View>
                  <Text className="text-muted">Battling {selectedOpponent?.name}...</Text>
                </View>
                <View className="h-2 bg-surface rounded-full overflow-hidden">
                  <View className="h-full bg-primary animate-pulse" style={{ width: "60%" }} />
                </View>
              </>
            ) : (
              <>
                <View 
                  className="w-24 h-24 rounded-full items-center justify-center self-center mb-4"
                  style={{ backgroundColor: battleResult === "win" ? "#22C55E" : "#EF4444" }}
                >
                  <IconSymbol 
                    name={battleResult === "win" ? "trophy.fill" : "xmark"} 
                    size={48} 
                    color="white" 
                  />
                </View>
                <Text className="text-2xl font-bold text-foreground text-center mb-2">
                  {battleResult === "win" ? "Victory!" : "Defeat"}
                </Text>
                <Text className="text-muted text-center mb-4">
                  {battleResult === "win" 
                    ? `You earned points for your guild!`
                    : `Better luck next time. You still earned ${GUILD_BATTLE.pointsPerLoss} points.`
                  }
                </Text>
                {battleResult === "win" && (
                  <View className="bg-primary/20 rounded-xl p-3 mb-4">
                    <Text className="text-primary font-bold text-center text-xl">
                      +{GUILD_BATTLE.pointsPerWin} Points
                    </Text>
                  </View>
                )}
                <Pressable
                  onPress={closeBattleModal}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
                  ]}
                >
                  <Text className="text-white font-semibold">Continue</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  battleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
});
