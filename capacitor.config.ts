import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.momoglass.todo',
  appName: 'Momo Glass',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      iconColor: '#f472b6',
      smallIcon: 'ic_stat_momo',
    },
    StatusBar: {
      overlaysWebView: true,
    },
  },
};

export default config;
