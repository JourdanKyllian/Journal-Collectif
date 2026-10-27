import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Landmark, SlidersHorizontal, UserCircle, LogIn } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';

interface HomeHeaderProps {
  isLoggedIn: boolean;
  onFilterPress: () => void;
  onUserPress: () => void;
}

export default function HomeHeader({ isLoggedIn, onFilterPress, onUserPress }: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logoBox}>
          <Landmark size={20} color={COLORS.or} />
        </View>
        <Text style={styles.journalTitle}>Châlons</Text>
      </View>

      <View style={styles.headerActions}>
        <Pressable onPress={onFilterPress} style={styles.iconButton}>
          <SlidersHorizontal size={20} color={COLORS.noir} />
        </Pressable>

        <Pressable onPress={onUserPress} style={styles.userPill}>
          {isLoggedIn ? (
            <>
              <UserCircle size={20} color={COLORS.vert} />
              <Text style={styles.userPillText}>Kyllian</Text>
            </>
          ) : (
            <>
              <LogIn size={18} color={COLORS.blanc} />
              <Text style={[styles.userPillText, { color: COLORS.blanc }]}>Connexion</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.blanc,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.vert, alignItems: 'center', justifyContent: 'center' },
  journalTitle: { fontFamily: FONTS.heading, fontSize: 20, color: COLORS.noir, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  userPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.vert, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99 },
  userPillText: { fontFamily: FONTS.bodyBold, fontSize: 13 },
});
