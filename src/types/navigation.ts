import type { SubmitResult } from './registration';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  RegistrationForm: undefined;
  Success: { result: SubmitResult } | undefined;
  Settings: undefined;
  Admin: undefined;
};
