import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ToastConfig, BaseToastProps } from 'react-native-toast-message';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.container, styles.successBorder]}>
      <View style={[styles.iconBox, { backgroundColor: 'rgba(22, 163, 74, 0.15)' }]}>
        <CheckCircle2 size={20} color={COLORS.success} />
      </View>
      <View style={styles.textContainer}>
        {text1 ? <Text style={styles.title}>{text1}</Text> : null}
        {text2 ? <Text style={styles.subtitle}>{text2}</Text> : null}
      </View>
    </View>
  ),

  error: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.container, styles.errorBorder]}>
      <View style={[styles.iconBox, { backgroundColor: 'rgba(220, 38, 38, 0.15)' }]}>
        <AlertCircle size={20} color={COLORS.urgent} />
      </View>
      <View style={styles.textContainer}>
        {text1 ? <Text style={styles.title}>{text1}</Text> : null}
        {text2 ? <Text style={styles.subtitle}>{text2}</Text> : null}
      </View>
    </View>
  ),

  info: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.container, styles.infoBorder]}>
      <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
        <Sparkles size={20} color={COLORS.or} />
      </View>
      <View style={styles.textContainer}>
        {text1 ? <Text style={styles.title}>{text1}</Text> : null}
        {text2 ? <Text style={styles.subtitle}>{text2}</Text> : null}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.vert,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: COLORS.noir,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    gap: 12,
  },
  successBorder: {
    borderColor: 'rgba(22, 163, 74, 0.35)',
  },
  errorBorder: {
    borderColor: 'rgba(220, 38, 38, 0.35)',
  },
  infoBorder: {
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: COLORS.blanc,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(254, 249, 241, 0.78)',
    marginTop: 2,
    lineHeight: 16,
  },
});
