import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Store access and refresh tokens
export const storeTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error("Error storing tokens:", error);
  }
};

// Get the access token
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

// Get the refresh token
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

// Remove tokens (e.g., on logout)
export const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error clearing tokens:", error);
  }
};
