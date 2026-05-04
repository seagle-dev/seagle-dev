import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Redirect } from 'expo-router';

export default function Index() {
  const [fontsLoaded] = useFonts({
    'FunnelSans-Regular': require('../assets/fonts/FunnelSans/FunnelSans-Regular.ttf'),
    'FunnelSans-Bold': require('../assets/fonts/FunnelSans/FunnelSans-Bold.ttf'),
    'FunnelSans-Light': require('../assets/fonts/FunnelSans/FunnelSans-Light.ttf'),
    'FunnelSans-Medium': require('../assets/fonts/FunnelSans/FunnelSans-Medium.ttf'),
    'STIXTwoText-Regular': require('../assets/fonts/StixTwoTexts/STIXTwoText-Regular.ttf'),
    'STIXTwoText-Bold': require('../assets/fonts/StixTwoTexts/STIXTwoText-Bold.ttf'),
    'STIXTwoText-SemiBold': require('../assets/fonts/StixTwoTexts/STIXTwoText-SemiBold.ttf'),
    'STIXTwoText-Medium': require('../assets/fonts/StixTwoTexts/STIXTwoText-Medium.ttf'),
  });

  const [loading, setLoading] = React.useState(true);
  const [hasUser, setHasUser] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        setHasUser(!!stored);
      } catch (e) {
        console.error("Auth check error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // While fonts are loading or we are checking the token, show a spinner
  if (loading || !fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF8C42" />
      </View>
    );
  }

  // Once ready, redirect
  return hasUser ? <Redirect href="/tabs/library" /> : <Redirect href="/auth/Auth" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
