import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/navigation/CustomTabBar';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="deals" />
        <Tabs.Screen name="action" />
        <Tabs.Screen name="tools" />
        <Tabs.Screen name="profile" />
      </Tabs>

      {/* Bannière discrète de gestion des cookies & traceurs (RGPD / CNIL) */}
      <CookieConsentBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
