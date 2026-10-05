import { z } from 'zod';
import { messages } from '@/config/messages';
import { validateEmail } from './common-rules';

const userFormBaseSchema = z.object({
  firstname: z.string().min(1, { message: messages.fullNameIsRequired }),
  lastname: z.string().min(1, { message: messages.fullNameIsRequired }),
  email: validateEmail,
  role: z.string().min(1, { message: messages.roleIsRequired }),
  status: z.string().min(1, { message: messages.statusIsRequired }),
  countryCode: z
    .string()
    .min(1, { message: messages.countryCodeIsRequired }),
  phoneNumber: z
    .string()
    .min(1, { message: messages.phoneNumberIsRequired })
    .regex(/^\d{7,14}$/, { message: messages.invalidPhoneNumber }),
});

// Form schema for create user flow.
export const createUserSchema = userFormBaseSchema.extend({
  password: z
    .string()
    .min(1, { message: messages.passwordRequired })
    .min(6, { message: messages.passwordLengthMin })
    .max(32, { message: messages.passwordLengthMax }),
});

// Form schema for edit user flow (password is not edited here).
export const editUserSchema = userFormBaseSchema.extend({
  password: z
    .union([
      z.string().min(6, { message: messages.passwordLengthMin }).max(32, { message: messages.passwordLengthMax }),
      z.literal(''),
    ])
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;

/****
 * 
 * 
 *  "firstname": "John Doe",
  "lastname": "John Doe",
  "isOwner": false,
  "email": "morl@gmail.com.com",
  "password": "Password123"
 */
