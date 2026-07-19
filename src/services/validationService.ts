import * as yup from 'yup';
import { CIVIL_STATUS_OPTIONS, SEX_OPTIONS } from '../constants/config';
import type { RegistrationFormValues } from '../types/registration';

export const registrationSchema: yup.ObjectSchema<RegistrationFormValues> = yup.object({
  firstName: yup.string().trim().required('First name is required.'),
  middleName: yup.string().trim().optional(),
  lastName: yup.string().trim().required('Last name is required.'),
  age: yup
    .string()
    .required('Age is required.')
    .matches(/^\d+$/, 'Age must be a number.')
    .test('range', 'Age must be between 1 and 120.', (value) => {
      if (!value) return false;
      const n = Number(value);
      return n >= 1 && n <= 120;
    }),
  birthdate: yup.string().optional(),
  sex: yup.string().oneOf([...SEX_OPTIONS]).optional() as yup.Schema<
    RegistrationFormValues['sex']
  >,
  civilStatus: yup.string().oneOf([...CIVIL_STATUS_OPTIONS]).optional() as yup.Schema<
    RegistrationFormValues['civilStatus']
  >,
  nationality: yup.string().trim().optional(),
  phoneNumber: yup
    .string()
    .required('Phone number is required.')
    .matches(/^\d+$/, 'Phone number must contain digits only.'),
  email: yup.string().trim().email('Enter a valid email address.').optional(),
  houseNumber: yup.string().trim().optional(),
  street: yup.string().trim().optional(),
  barangay: yup.string().trim().optional(),
  city: yup.string().trim().optional(),
  province: yup.string().trim().optional(),
  zipCode: yup.string().trim().optional(),
  country: yup.string().trim().optional(),
  occupation: yup.string().trim().optional(),
  company: yup.string().trim().optional(),
  emergencyContactName: yup.string().trim().optional(),
  emergencyContactNumber: yup.string().trim().optional(),
  relationship: yup.string().trim().optional(),
  remarks: yup.string().trim().optional(),
}) as yup.ObjectSchema<RegistrationFormValues>;

export function isCompleteAddressFilled(values: RegistrationFormValues): boolean {
  return Boolean(
    values.houseNumber?.trim() ||
      values.street?.trim() ||
      values.barangay?.trim() ||
      values.city?.trim() ||
      values.province?.trim()
  );
}
