import api from "./axios";


export const getAllJobs = (userId) => 
  api.get(userId ? `/jobs?userId=${userId}` : "/jobs");


export const addJob = (jobData) =>
  api.post("/jobs/add", jobData);


export const applyJob = (userId, jobId) =>
  api.post("/jobs/apply", { userId, jobId });


export const recommendJobs = (userId) =>
  api.get(`/jobs/recommend/${userId}`);


export const getApplicants = (jobId) =>
  api.get(`/jobs/${jobId}/applicants`);


export const getCompanyJobs = (query) =>
  api.get(`/company/jobs?query=${query}`);


export const deleteJob = (jobId) =>
  api.delete(`/jobs/${jobId}`);

export const searchCandidates = (query) =>
  api.get(`/company/search-candidates?q=${query}`);

export const generateInterviewPrep = (jobId, userId) =>
  api.post(`/jobs/${jobId}/prep`, { userId });
