// app/index.jsx
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, loading: authLoading } = useAuth();

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

  if (authLoading || !fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? <Redirect href="/tabs" /> : <Redirect href="/auth/Auth" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
