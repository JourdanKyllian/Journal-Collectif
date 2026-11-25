export const COLORS = {
  vert: '#0B1C10',
  or: '#D4AF37',
  orAccessible: '#8A6D14', // Contraste >= 4.5:1 sur fond clair (#FEF9F1 / #F5EFE6)
  noir: '#1A1A1A',
  champagne: '#8E8671',
  blanc: '#FEF9F1',
  surface: '#F5EFE6',
  urgent: '#DC2626',
  info: '#EA580C',
  success: '#16A34A',
  bleu: '#2563EB',
} as const;

export const FONTS = {
  heading: 'Poppins_900Black',
  headingBold: 'Poppins_700Bold',
  body: 'Montserrat_400Regular',
  bodySemiBold: 'Montserrat_600SemiBold',
  bodyBold: 'Montserrat_700Bold',
  accent: 'Raleway_600SemiBold',
  // Alias pour confort développeur
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_600SemiBold',
  semiBold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  poppinsBold: 'Poppins_700Bold',
  poppinsBlack: 'Poppins_900Black',
  montserrat: 'Montserrat_400Regular',
  montserratSemiBold: 'Montserrat_600SemiBold',
  montserratBold: 'Montserrat_700Bold',
} as const;
