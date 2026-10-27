import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/theme/tokens';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.vert, padding: 20 },
  title: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.or },
  subtitle: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.blanc, marginTop: 4 },
});
