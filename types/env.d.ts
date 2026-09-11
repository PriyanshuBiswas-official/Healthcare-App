declare module 'react-native-config' {
  export interface NativeConfig {
    API_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    GOOGLE_WEB_CLIENT_ID: string;
    POSTHOG_PROJECT_TOKEN: string;
    POSTHOG_HOST: string;
  }

  const Config: NativeConfig;
  export default Config;
}
