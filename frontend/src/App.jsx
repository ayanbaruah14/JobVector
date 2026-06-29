import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProfileGuard from "./components/ProfileGuard";

import Jobs from "./pages/Jobs";
import RecommendedJobs from "./pages/RecommendedJobs";
import Applications from "./pages/Applications";
import Applicants from "./pages/Applicants";
import CreateUser from "./pages/CreateUser";
import Signup from "./pages/signup";
import Login from "./pages/login";
import ProviderDashboard from "./pages/ProviderDashboard";
import AddJob from "./pages/AddJob";
import Profile from "./pages/Profile";

import CandidateProfile from "./pages/CandidateProfile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Login />} />
        <Route path="/jobs" element={<ProfileGuard><Jobs /></ProfileGuard>} />
        <Route path="/create" element={<ProfileGuard><CreateUser /></ProfileGuard>} />
        <Route path="/profile" element={<ProfileGuard><Profile /></ProfileGuard>} />
        <Route path="/recommend" element={<ProfileGuard><RecommendedJobs /></ProfileGuard>} />
        <Route path="/applications" element={<ProfileGuard><Applications /></ProfileGuard>} />

        <Route path="/provider" element={<ProviderDashboard />} />
        <Route path="/provider/add" element={<AddJob />} />

        <Route path="/jobs/:jobId/applicants" element={<Applicants />} />
        <Route path="/applicant/:userId" element={<CandidateProfile />} />
      </Routes>
    </BrowserRouter>
  );
}
