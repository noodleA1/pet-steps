import { useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, TextInput, Modal } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

// Mock guild data
const MOCK_GUILDS = [
  { id: "1", name: "Step Warriors", members: 42, weeklySteps: 1250000, rank: 1 },
  { id: "2", name: "Walking Dead", members: 38, weeklySteps: 980000, rank: 2 },
  { id: "3", name: "Pace Makers", members: 35, weeklySteps: 875000, rank: 3 },
  { id: "4", name: "Trail Blazers", members: 28, weeklySteps: 720000, rank: 4 },
  { id: "5", name: "Foot Soldiers", members: 45, weeklySteps: 650000, rank: 5 },
];

// Mock guild members
const MOCK_MEMBERS = [
  { id: "1", name: "StepMaster", weeklySteps: 52000, role: "leader", petName: "Blaze Dragon", petLevel: 45 },
  { id: "2", name: "WalkingWonder", weeklySteps: 48000, role: "officer", petName: "Aqua Serpent", petLevel: 38 },
  { id: "3", name: "PaceRunner", weeklySteps: 45000, role: "member", petName: "Stone Golem", petLevel: 42 },
  { id: "4", name: "TrailHiker", weeklySteps: 42000, role: "member", petName: "Wind Eagle", petLevel: 35 },
  { id: "5", name: "StepChamp", weeklySteps: 38000, role: "member", petName: "Fire Fox", petLevel: 32 },
];

function GuildCard({ guild, onJoin, isJoined }: { guild: typeof MOCK_GUILDS[0]; onJoin: () => void; isJoined: boolean }) {
  const colors = useColors();
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return colors.muted;
  };
  
  return (
    <View className="bg-surface rounded-2xl p-4 mb-3">
      <View className="flex-row items-center mb-3">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: getRankColor(guild.rank) }}
        >
          <Text className="text-white font-bold text-lg">#{guild.rank}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-lg">{guild.name}</Text>
          <Text className="text-muted text-sm">{guild.members} members</Text>
        </View>
        {!isJoined && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onJoin();
            }}
            style={({ pressed }) => [
              styles.joinButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Text className="text-white font-medium">Join</Text>
          </Pressable>
        )}
      </View>
      <View className="flex-row justify-between">
        <View>
          <Text className="text-muted text-xs">Weekly Steps</Text>
          <Text className="text-foreground font-medium">{(guild.weeklySteps / 1000).toFixed(0)}k</Text>
        </View>
        <View>
          <Text className="text-muted text-xs">Avg per Member</Text>
          <Text className="text-foreground font-medium">{Math.floor(guild.weeklySteps / guild.members).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}

function MemberRow({ member, rank }: { member: typeof MOCK_MEMBERS[0]; rank: number }) {
  const colors = useColors();
  
  const getRoleColor = (role: string) => {
    if (role === "leader") return colors.warning;
    if (role === "officer") return colors.primary;
    return colors.muted;
  };
  
  return (
    <View className="flex-row items-center py-3 border-b border-border">
      <Text className="w-8 text-center text-muted font-medium">{rank}</Text>
      <View className="flex-1 ml-2">
        <View className="flex-row items-center">
          <Text className="text-foreground font-medium">{member.name}</Text>
          {member.role !== "member" && (
            <View 
              className="ml-2 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: getRoleColor(member.role) }}
            >
              <Text className="text-white text-xs capitalize">{member.role}</Text>
            </View>
          )}
        </View>
        <Text className="text-sm text-muted">{member.petName} (Lv.{member.petLevel})</Text>
      </View>
      <View className="items-end">
        <Text className="text-foreground font-medium">{member.weeklySteps.toLocaleString()}</Text>
        <Text className="text-xs text-muted">steps</Text>
      </View>
    </View>
  );
}

function CompetitionBanner({ daysLeft, guildRank }: { daysLeft: number; guildRank: number }) {
  const colors = useColors();
  
  return (
    <View className="bg-primary rounded-2xl p-4 mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <IconSymbol name="trophy.fill" size={24} color="white" />
          <Text className="text-white font-bold text-lg ml-2">Guild Competition</Text>
        </View>
        <View className="bg-white/20 px-3 py-1 rounded-full">
          <Text className="text-white font-medium">{daysLeft} days left</Text>
        </View>
      </View>
      <Text className="text-white/80 mb-3">
        Walk together, battle together! Top guilds earn exclusive rewards.
      </Text>
      <View className="flex-row justify-between">
        <View>
          <Text className="text-white/60 text-xs">Current Rank</Text>
          <Text className="text-white font-bold text-2xl">#{guildRank}</Text>
        </View>
        <View>
          <Text className="text-white/60 text-xs">Battle Points</Text>
          <Text className="text-white font-bold text-2xl">1,250</Text>
        </View>
        <View>
          <Text className="text-white/60 text-xs">Guild Steps</Text>
          <Text className="text-white font-bold text-2xl">1.2M</Text>
        </View>
      </View>
    </View>
  );
}

function NoGuildView({ onBrowse, onCreate }: { onBrowse: () => void; onCreate: () => void }) {
  const colors = useColors();
  
  return (
    <View className="flex-1 items-center justify-center p-6">
      <IconSymbol name="person.3.fill" size={64} color={colors.muted} />
      <Text className="text-xl font-semibold text-foreground mt-4 mb-2">Join a Guild</Text>
      <Text className="text-muted text-center mb-6">
        Team up with other walkers! Compete in bi-weekly competitions and earn rewards together.
      </Text>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onBrowse();
        }}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
        ]}
      >
        <IconSymbol name="person.3.fill" size={20} color="white" />
        <Text className="text-white font-semibold text-lg ml-2">Browse Guilds</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onCreate();
        }}
        style={({ pressed }) => [
          styles.secondaryButton,
          { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 }
        ]}
      >
        <IconSymbol name="plus" size={20} color={colors.primary} />
        <Text className="text-primary font-semibold ml-2">Create Guild</Text>
      </Pressable>
    </View>
  );
}

function MyGuildView({ onLeave }: { onLeave: () => void }) {
  const colors = useColors();
  const myGuild = MOCK_GUILDS[0]; // Pretend user is in the top guild
  
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      {/* Competition Banner */}
      <CompetitionBanner daysLeft={5} guildRank={1} />
      
      {/* Guild Info */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-3">
          <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mr-3">
            <IconSymbol name="crown.fill" size={32} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">{myGuild.name}</Text>
            <Text className="text-muted">{myGuild.members} members • Rank #{myGuild.rank}</Text>
          </View>
        </View>
        <View className="flex-row justify-between">
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-foreground">{(myGuild.weeklySteps / 1000000).toFixed(1)}M</Text>
            <Text className="text-xs text-muted">Weekly Steps</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-foreground">156</Text>
            <Text className="text-xs text-muted">Battle Wins</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-foreground">12</Text>
            <Text className="text-xs text-muted">Competitions Won</Text>
          </View>
        </View>
      </View>
      
      {/* Members */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold text-foreground">Members</Text>
          <Text className="text-muted">This Week</Text>
        </View>
        {MOCK_MEMBERS.map((member, index) => (
          <MemberRow key={member.id} member={member} rank={index + 1} />
        ))}
      </View>
      
      {/* Guild Actions */}
      <View className="gap-2 mb-4">
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <IconSymbol name="bell.fill" size={20} color={colors.foreground} />
          <Text className="text-foreground font-medium ml-3 flex-1">Guild Announcements</Text>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </Pressable>
        
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <IconSymbol name="trophy.fill" size={20} color={colors.foreground} />
          <Text className="text-foreground font-medium ml-3 flex-1">Competition History</Text>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </Pressable>
        
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onLeave();
          }}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <IconSymbol name="xmark" size={20} color={colors.error} />
          <Text className="text-error font-medium ml-3 flex-1">Leave Guild</Text>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function BrowseGuildsModal({ visible, onClose, onJoin }: { visible: boolean; onClose: () => void; onJoin: (guildId: string) => void }) {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredGuilds = MOCK_GUILDS.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <Text className="text-xl font-bold text-foreground">Browse Guilds</Text>
          <Pressable onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        
        {/* Search */}
        <View className="p-4">
          <View className="bg-surface rounded-xl px-4 py-3 flex-row items-center">
            <IconSymbol name="sparkles" size={20} color={colors.muted} />
            <TextInput
              className="flex-1 ml-3 text-foreground"
              placeholder="Search guilds..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
        
        {/* Guild List */}
        <ScrollView className="flex-1 px-4">
          {filteredGuilds.map(guild => (
            <GuildCard
              key={guild.id}
              guild={guild}
              onJoin={() => onJoin(guild.id)}
              isJoined={false}
            />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function GuildScreen() {
  const { state } = useGame();
  const colors = useColors();
  
  const [hasGuild, setHasGuild] = useState(false);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  
  const handleJoinGuild = (guildId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHasGuild(true);
    setShowBrowseModal(false);
  };
  
  const handleLeaveGuild = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setHasGuild(false);
  };
  
  const handleCreateGuild = () => {
    // Would open create guild modal
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="items-center mb-4">
        <Text className="text-2xl font-bold text-foreground">Walking Guild</Text>
        <Text className="text-muted">Team up and compete together!</Text>
      </View>
      
      {hasGuild ? (
        <MyGuildView onLeave={handleLeaveGuild} />
      ) : (
        <NoGuildView 
          onBrowse={() => setShowBrowseModal(true)} 
          onCreate={handleCreateGuild} 
        />
      )}
      
      <BrowseGuildsModal
        visible={showBrowseModal}
        onClose={() => setShowBrowseModal(false)}
        onJoin={handleJoinGuild}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: "100%",
    marginBottom: 12,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: "100%",
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  joinButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
});
