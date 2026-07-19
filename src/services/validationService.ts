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
  completeAddress: yup.string().trim().required('Complete address is required.'),
}) as yup.ObjectSchema<RegistrationFormValues>;
