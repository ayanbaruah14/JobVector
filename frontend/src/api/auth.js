import api from "./axios";

export const SignupApiCompany = (data) => api.post("/company/register", data);
export const LoginApiCompany = (data) => api.post("/company/login", data);
export const SignupApiUser = (data) => api.post("/user/create", data);
export const LoginApiUser = (data) => api.post("/user/login", data);
export const GetUserProfile = (userId) => api.get(`/user/profile/${userId}`);
export const GoogleLoginApiUser = (data) => api.post("/user/google", data);
export const GoogleLoginApiCompany = (data) => api.post("/company/google", data);
