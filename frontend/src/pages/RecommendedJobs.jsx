import { useEffect, useState } from "react";
import { recommendJobs, applyJob, generateInterviewPrep } from "../api/job.api";
import JobCard from "../components/JobCard";
import Navbar from "../components/Navbar";
import AnimatedPopup from "../components/AnimatedPopup";

export default function RecommendedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null); 
  const [prepData, setPrepData] = useState(null);
  const [isPrepping, setIsPrepping] = useState(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId || userId === "undefined") {
      setPopup({ message: "Please create a profile first to get recommendations.", type: "error" });
      setTimeout(() => { window.location.href = "/create"; }, 2000);
      return;
    }

    setLoading(true);
    recommendJobs(userId)
      .then((res) => {
        setJobs(res.data.recommendations);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching recommendations:", err);
        setLoading(false);
      });
  }, [userId]);

  const handleApply = async (jobId) => {
    try {
      await applyJob(userId, jobId);

      
      setPopup({ message: "Application submitted successfully!", type: "success" });

      
      setJobs((prevJobs) => prevJobs.filter(job => job._id !== jobId));

    } catch (err) {
      console.log(err);
      setPopup({ message: "Error applying for this recommendation.", type: "error" });
    }
  };

  const handleApplyAll = async () => {
    if (!window.confirm(`Are you sure you want to apply to ${jobs.length} jobs?`)) return;

    let successCount = 0;
    const failedIds = [];

    
    for (const job of jobs) {
      try {
        await applyJob(userId, job._id);
        successCount++;
      } catch (e) {
        console.error(`Failed to apply to ${job._id}`, e);
        failedIds.push(job._id);
      }
    }

    setPopup({ message: `Successfully applied to ${successCount} jobs!`, type: "success" });

    
    setJobs((prevJobs) => prevJobs.filter(job => failedIds.includes(job._id)));
  };

  const handlePrep = async (jobId) => {
    setIsPrepping(true);
    setPrepData(null);
    try {
      const res = await generateInterviewPrep(jobId, userId);
      setPrepData(res.data.prep);
    } catch (err) {
      console.error("Prep error:", err);
      setPopup({ message: "Failed to generate interview prep.", type: "error" });
    } finally {
      setIsPrepping(false);
    }
  };

  return (
    <>
      <div>
        <Navbar />
      </div>

      { }
      {popup && (
        <AnimatedPopup
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup(null)}
        />
      )}

      <div className="min-h-screen bg-slate-950 p-6 md:p-12">
        <div className="max-w-7xl mx-auto">

          { }
          <div className="mb-12 relative flex items-end justify-between animate-fade-in">
            <div>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-600/10 blur-[100px] rounded-full"></div>

              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20 uppercase tracking-widest">
                  AI Powered
                </span>
                <span className="text-slate-500 text-sm italic">Updated just now</span>
              </div>

              <h2 className="text-4xl font-extrabold text-white tracking-tight">
                Recommended <span className="text-indigo-500 underline decoration-indigo-500/20">for You</span>
              </h2>
              <p className="text-slate-400 mt-3 text-lg max-w-2xl">
                We've analyzed your skills and preferences to find the perfect matches for your next career move.
              </p>
            </div>

            {jobs.length > 0 && !loading && (
              <button
                onClick={handleApplyAll}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <span>🚀</span> Apply to All {jobs.length} Jobs
              </button>
            )}
          </div>

          {/* Content Section */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
                {/* Spinning Rings */}
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-[spin_3s_linear_infinite]"></div>
                <div className="absolute inset-2 border-4 border-emerald-500/30 border-dashed rounded-full animate-[spin_4s_linear_infinite_reverse]"></div>
                <div className="absolute inset-4 border-2 border-purple-500/20 rounded-full animate-[spin_2s_linear_infinite]"></div>
                {/* Inner Glow */}
                <div className="absolute inset-6 bg-indigo-500/20 rounded-full animate-pulse blur-xl"></div>
                {/* Center Icon */}
                <div className="relative z-10 text-4xl animate-bounce">🧠</div>
              </div>
              
              <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 mb-4 animate-pulse">
                Engaging Neural Matchmaker...
              </h3>
              
              <div className="space-y-3 text-center max-w-md">
                <p className="text-slate-300 font-medium text-lg bg-slate-900/50 py-2 px-4 rounded-lg border border-slate-800">
                  <span className="inline-block animate-spin mr-2">⚙️</span>
                  Computing Semantic Similarity Vectors
                </p>
                <p className="text-slate-500 text-sm font-mono opacity-75">
                  &gt; Querying RAG pipeline... <br/>
                  &gt; Calculating high-dimensional cosine distances... <br/>
                  &gt; Filtering optimal career trajectories...
                </p>
              </div>
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up animation-delay-200">
              {jobs.map((job) => (
                <div key={job._id} className="relative transition-transform duration-300 hover:-translate-y-2">
                  {/* Decorative Match Label */}
                  <div className="absolute -top-3 -right-3 z-10 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-1 rounded shadow-lg transform rotate-3">
                    {Math.min(Math.round(job.score), 100)}% MATCH
                  </div>

                  <JobCard
                    job={job}
                    onApply={handleApply}
                    onPrep={handlePrep}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Empty State for no recommendations */
            <div className="text-center py-24 bg-slate-900/30 rounded-3xl border border-slate-800 backdrop-blur-sm">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white">Refining your matches...</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                No new recommendations at the moment, or you've applied to all currently recommended jobs.
              </p>
              <button
                onClick={() => window.location.href = "/create"}
                className="mt-8 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all"
              >
                Update Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Prep Modal */}
      {(isPrepping || prepData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => { setIsPrepping(false); setPrepData(null); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              ✕
            </button>
            
            {isPrepping ? (
              <div className="text-center py-12">
                <div className="text-6xl animate-bounce mb-4">🤖</div>
                <h3 className="text-2xl font-bold text-white mb-2">Analyzing your profile...</h3>
                <p className="text-indigo-400">Generating hyper-personalized interview prep...</p>
              </div>
            ) : prepData ? (
              <div>
                <h3 className="text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
                  <span>🤖</span> AI Interview Prep
                </h3>
                
                <div className="bg-indigo-950/50 border border-indigo-500/20 p-6 rounded-2xl mb-6">
                  <h4 className="text-indigo-400 font-bold mb-2 uppercase tracking-wider text-sm">Action Plan & Improvements</h4>
                  <p className="text-slate-200">{prepData.improvementPlan}</p>
                </div>

                <h4 className="text-xl font-bold text-white mb-4">Crucial Interview Topics</h4>
                <div className="space-y-4">
                  {(prepData.interviewTopics || []).map((t, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                      <p className="text-white font-medium mb-3"><span className="text-indigo-500 mr-2">#{i+1}</span> {t.topic}</p>
                      <div className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-800/50">
                        <p className="text-sm text-emerald-400"><span className="font-bold">💡 Why review this:</span> {t.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}