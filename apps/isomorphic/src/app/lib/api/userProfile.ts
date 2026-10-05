import { api } from '../axios';

export interface UserProfile {
  title: string;
  otherName?: string;
  phoneNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  highestQualification: string;
  professional: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  stateOfOrigin: string;
  lgaOfOrigin: string;
  homeTown: string;
  spouseName?: string;
  spousePhoneNumber?: string;
  spouseDateOfBirth?: string;
  nextOfKinName: string;
  nextOfKinPhoneNumber: string;
  nextOfKinRelationship: string;
  residentialAddress: string;
  stateOfResidence: string;
  lgaOfResidence: string;
  employmentCategory: string;
  occupation: string;
  employeeId?: string;
}

/**
 * Get user profile (now embedded in User model)
 * NOTE: Profile is now nested in the User object under the 'profile' field
 */
export const getUserProfile = async (userId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/users/${userId}`, options);
  
  // Extract profile from user object
  return data.profile || {};
};

/**
 * Update user profile (now part of User model)
 * Supports both flat structure and nested profile object
 */
export const upsertUserProfile = async (
  userId: string,
  payload: Partial<UserProfile>,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  
  const { phoneNumber, ...profilePayload } = payload || {};
  const requestBody: Record<string, unknown> = {
    profile: profilePayload,
  };
  if (phoneNumber !== undefined) {
    requestBody.phoneNumber = phoneNumber;
  }

  const { data } = await api.patch(`/users/${userId}`, requestBody, options);
  return data;
};

/**
 * Delete user profile (clears profile fields)
 */
export const deleteUserProfile = async (userId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  
  // Clear profile by setting it to empty object
  const { data } = await api.patch(`/users/${userId}`, { profile: {} }, options);
  return data;
};
