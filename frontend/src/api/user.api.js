import api from "./axios";




export const updateUser = (userData) =>
  api.put("/user/update", userData);


export const getApplications = (userId) =>
  api.get(`/user/${userId}/applications`);


export const uploadProfileData = (formData) =>
  api.put("/user/complete-profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getUserProfile = (userId) =>
  api.get(`/user/profile/${userId}`);
