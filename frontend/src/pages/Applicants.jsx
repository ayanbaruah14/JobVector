import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getApplicants } from "../api/job.api";

export default function Applicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState(null);

  useEffect(() => {
    getApplicants(jobId)
      .then((res) => {
        setUsers(res.data.applicants);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [jobId]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans text-slate-200 flex">
      <div className={`transition-all duration-300 ${selectedResume ? 'w-1/2 pr-6' : 'max-w-6xl w-full mx-auto'}`}>


        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link to="/provider" className="text-indigo-400 text-sm hover:underline flex items-center gap-2 mb-2 font-medium">
              ← Back to Job Postings
            </Link>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">
              Applicants <span className="text-slate-600 font-medium text-2xl ml-2 align-middle">({users.length})</span>
            </h2>
            <p className="text-slate-400 mt-2 text-lg">Review and manage candidates for Job ID: <span className="font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{jobId}</span></p>
          </div>

          <div className="flex gap-3">
          </div>
        </div>


        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
              <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-2 border-indigo-500/30 animate-pulse"></div>
            </div>
          </div>
        ) : users.length > 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400">
                  <th className="px-6 py-5 text-xs uppercase tracking-wider font-bold">Rank</th>
                  <th className="px-6 py-5 text-xs uppercase tracking-wider font-bold">Candidate</th>
                  <th className="px-6 py-5 text-xs uppercase tracking-wider font-bold w-1/2">AI Evaluation</th>
                  <th className="px-6 py-5 text-right text-xs uppercase tracking-wider font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-indigo-500/5 transition-all duration-200 group">
                    <td className="px-6 py-6 text-center">
                      <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                        #{u.finalRank || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-white font-bold truncate">{u.name}</div>
                          <div className="text-slate-500 text-xs truncate">
                            {u.experience ? `${u.experience} yrs exp.` : 'Fresher'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {u.skills && u.skills.slice(0, 4).map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] uppercase font-bold rounded border border-slate-700">{skill}</span>
                          ))}
                        </div>
                        {u.matchReasoning && (
                          <div className="text-sm text-indigo-300 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 italic">
                            "{u.matchReasoning}"
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right space-y-2">
                      {u.resumeUrl && (
                        <button
                          onClick={() => setSelectedResume(selectedResume === u.resumeUrl ? null : u.resumeUrl)}
                          className={`w-full px-3 py-1.5 text-xs font-bold rounded-lg transition-all border shadow-sm active:scale-95 ${selectedResume === u.resumeUrl ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-indigo-300 hover:bg-slate-700 hover:text-white'}`}
                        >
                          {selectedResume === u.resumeUrl ? 'Close Resume' : 'View Resume'}
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/applicant/${u._id}`)}
                        className="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all border border-slate-700 shadow-sm active:scale-95"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center">
            <div className="h-24 w-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-4 ring-slate-800/20">
              <span className="text-4xl opacity-50">👥</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Applicants Yet</h3>
            <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
              Your job posting is live! Once candidates apply, their profiles will appear here for your review.
            </p>
            <Link to="/provider" className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
              Return to Dashboard
            </Link>
          </div>
        )}
      </div>
      
      {/* Resume Viewer Side Panel */}
      {selectedResume && (
        <div className="w-1/2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Resume Viewer</h3>
            <button 
              onClick={() => setSelectedResume(null)}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              ✕ Close
            </button>
          </div>
          <iframe 
            src={selectedResume} 
            className="w-full flex-1 bg-white"
            title="Candidate Resume"
          />
        </div>
      )}
    </div>
  );
}