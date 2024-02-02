import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.app.connectfour',
  appName: 'Connect Four',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
