import * as Location from 'expo-location';
import type { LocationMeta } from '../types/registration';

export const locationService = {
  async requestCurrentLocation(): Promise<LocationMeta> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {};
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return {};
    }
  },
};
