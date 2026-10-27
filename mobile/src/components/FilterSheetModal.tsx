import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { MOCK_CATEGORIES } from '@/lib/mock-data';

interface FilterSheetModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function FilterSheetModal({
  visible,
  onClose,
  selectedCategory,
  onSelectCategory,
}: FilterSheetModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Filtrer par rubrique</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={20} color={COLORS.champagne} />
            </Pressable>
          </View>

          {MOCK_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.libelle;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  onSelectCategory(cat.libelle);
                  onClose();
                }}
                style={[styles.option, isSelected && styles.optionSelected]}
              >
                <Text style={styles.emoji}>{cat.icon}</Text>
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.label,
                      isSelected && { color: COLORS.vert, fontFamily: FONTS.bodyBold },
                    ]}
                  >
                    {cat.libelle}
                  </Text>
                  <Text style={styles.description}>{cat.description}</Text>
                </View>
                {isSelected && <Check size={18} color={COLORS.or} strokeWidth={3} />}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 28, 16, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.blanc,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(142, 134, 113, 0.35)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    color: COLORS.noir,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 6,
  },
  optionSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
  },
  emoji: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.noir,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
  },
});
