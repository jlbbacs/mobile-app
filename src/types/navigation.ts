import type { RegistrationRecord, SubmitResult } from './registration';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  RegistrationForm: undefined;
  Success: { result: SubmitResult } | undefined;
  Settings: undefined;
  Admin: undefined;
  Scan: undefined;
  Search: undefined;
  Profile: { registrationId: string };
  EditRegistration: { record: RegistrationRecord };
};
