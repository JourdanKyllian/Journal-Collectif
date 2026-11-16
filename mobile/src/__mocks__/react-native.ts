export const Platform = {
  OS: 'ios',
  select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
};

export const StyleSheet = {
  create: (styles: Record<string, unknown>) => styles,
  absoluteFill: {},
};

export const View = (props: Record<string, unknown>) => props.children ?? null;
export const Text = (props: Record<string, unknown>) => props.children ?? null;
export const Pressable = (props: Record<string, unknown>) => props.children ?? null;

export const Touchable = {
  Mixin: {},
};

export default {
  Platform,
  StyleSheet,
  View,
  Text,
  Pressable,
  Touchable,
};
