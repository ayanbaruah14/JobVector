import { useEffect, useState } from "react";
import { getCompanyJobs, deleteJob, searchCandidates } from "../api/job.api";
import JobCard from "../components/JobCard";
import { Link, useNavigate } from "react-router-dom";

export default function ProviderDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(userStr);
    const identifier = user.email || user.companyEmail;

    setLoading(true);
    getCompanyJobs(identifier)
      .then((res) => {
        setJobs(res.data.jobs);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching company jobs", err);
        setLoading(false);
      });
  }, [navigate]);



  const totalApplicants = jobs.reduce((acc, job) => acc + (job.peopleIds ? job.peopleIds.length : 0), 0);
  const avgApplicants = jobs.length > 0 ? (totalApplicants / jobs.length).toFixed(1) : "0.0";

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await searchCandidates(searchQuery);
      setSearchResults(res.data.candidates);
    } catch (err) {
      console.error("Search failed:", err);
      alert("AI Search failed. Check console.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">


        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Provider <span className="text-indigo-500">Dashboard</span>
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Manage your active listings and track candidate engagement.
            </p>
          </div>

          <div className="flex gap-4">
            <Link to="/provider/add">
              <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                <span className="text-xl">+</span> Post New Job
              </button>
            </Link>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl transition-all border border-slate-700 active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in animation-delay-100">
          {[
            { label: "Active Postings", value: jobs.length, color: "text-indigo-400" },
            { label: "Total Applicants", value: totalApplicants, color: "text-emerald-400" },
            { label: "Avg. Applicants/Job", value: avgApplicants, color: "text-amber-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
              <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* AI Semantic Search Section */}
        <div className="mb-16 bg-slate-900 border border-indigo-500/30 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">✨</div>
          <h2 className="text-2xl font-bold text-white mb-2">AI Candidate Search</h2>
          <p className="text-slate-400 mb-6 max-w-2xl">
            Describe the ideal candidate in plain English. Our AI will search all resumes mathematically and explain why they fit.
          </p>
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Someone who has built microservices in Node and knows AWS."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>

          {searchResults && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-slate-300 mb-4">Top Matches</h3>
              {searchResults.length === 0 ? (
                <p className="text-slate-500">No matching candidates found.</p>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((candidate, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white">{candidate.name}</h4>
                        <p className="text-slate-400 text-sm mb-2">{candidate.email}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(candidate.skills || []).slice(0, 5).map((skill, i) => (
                            <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md">{skill}</span>
                          ))}
                        </div>
                        <p className="text-sm text-slate-500">{candidate.experience} years experience</p>
                      </div>
                      <div className="flex-1 bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg">
                        <p className="text-sm text-indigo-200"><span className="font-bold text-indigo-400">AI Reasoning:</span> {candidate.searchReasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6 animate-fade-in animation-delay-200">
          <h3 className="text-xl font-bold text-white">Your Postings</h3>
          <div className="h-px bg-slate-800 flex-grow"></div>
        </div>


        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-slate-900 animate-pulse rounded-2xl border border-slate-800"></div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-300">
            {jobs.map((job) => (
              <div key={job._id} className="relative group">
                <JobCard job={job} />

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/jobs/${job._id}/applicants`)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    View Applicants
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this job?")) {
                        try {
                          await deleteJob(job._id);
                          setJobs(jobs.filter(j => j._id !== job._id));
                        } catch (err) {
                          alert("Failed to delete job");
                        }
                      }
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 text-slate-500 rounded-lg border border-slate-700 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800">
            <p className="text-slate-500 text-lg">You haven't posted any jobs yet.</p>
            <Link to="/provider/add" className="text-indigo-400 hover:text-indigo-300 font-bold mt-2 inline-block">
              Create your first listing now →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}