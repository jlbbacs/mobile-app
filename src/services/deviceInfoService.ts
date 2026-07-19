import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import type { DeviceMeta } from '../types/registration';

export const deviceInfoService = {
  getDeviceMeta(): DeviceMeta {
    const deviceModel = Device.modelName ?? 'Unknown device';
    const osVersion = `${Platform.OS} ${Device.osVersion ?? ''}`.trim();
    const appVersion = Application.nativeApplicationVersion ?? '1.0.0';
    return { deviceModel, osVersion, appVersion };
  },
};
