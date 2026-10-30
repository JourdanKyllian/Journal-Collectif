import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Poppins_700Bold, Poppins_900Black } from '@expo-google-fonts/poppins';
import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { Raleway_600SemiBold } from '@expo-google-fonts/raleway';

import { useJuryNotificationDemo } from '@/hooks/useJuryNotificationDemo';
import { CityProvider } from '@/context/CityContext';
import { AuthProvider } from '@/context/AuthContext';
import { COLORS } from '@/theme/tokens';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/common/CustomToast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useJuryNotificationDemo();

  const [fontsLoaded, fontError] = useFonts({
    Poppins_700Bold,
    Poppins_900Black,
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Raleway_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AuthProvider>
        <CityProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.blanc },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="articles/[id]"
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="admin/dashboard"
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="admin/editor"
              options={{
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="modals/submit"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="modals/declare-lost"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="modals/login"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
          <Toast config={toastConfig} topOffset={54} />
        </CityProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
