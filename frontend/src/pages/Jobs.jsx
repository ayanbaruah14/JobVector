import { useEffect, useState } from "react";
import { getAllJobs, applyJob } from "../api/job.api";
import JobCard from "../components/JobCard";
import Navbar from "../components/Navbar";
import AnimatedPopup from "../components/AnimatedPopup";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    setLoading(true);
    getAllJobs(userId)
      .then((res) => {
        setJobs(res.data.jobs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleApply = async (jobId) => {
    try {
      await applyJob(userId, jobId);
      setPopup({ message: "Applied successfully!", type: "success" });
      setJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));
    } catch (err) {
      setPopup({ message: err.response?.data?.message || "Error applying for job", type: "error" });
    }
  };

  return (
    <>
      <div>
        <Navbar />
      </div>

      {popup && (
        <AnimatedPopup
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup(null)}
        />
      )}

      <div className="min-h-screen bg-slate-950 text-slate-200">
        { }
        <div className="bg-slate-900 border-b border-slate-800 py-16 px-6 animate-fade-in">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              Find your next <span className="text-indigo-500 underline decoration-indigo-500/30">dream job</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
              Browse through hundreds of open positions at top-tier tech companies and startups.
            </p>
          </div>
        </div>

        { }
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8 animate-fade-in animation-delay-100">
            <h2 className="text-2xl font-bold text-white">Latest Openings</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              {jobs.length} Active Positions
            </div>
          </div>

          {loading ? (
             
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-64 bg-slate-900 animate-pulse rounded-2xl border border-slate-800"></div>
              ))}
            </div>
          ) : jobs.length > 0 ? (
             
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-200">
              {jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onApply={handleApply}
                />
              ))}
            </div>
          ) : (
             
            <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 animate-fade-in">
              <h3 className="text-xl font-medium text-slate-400">No jobs found matching your criteria.</h3>
            </div>
          )}
        </main>
      </div>
    </>
  );
}