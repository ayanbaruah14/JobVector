export default function JobCard({ job, onApply, onPrep }) {
  return (
    <div className="group relative bg-slate-900 border border-slate-800 p-6 rounded-2xl transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">

      { }
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
            {job.title}
          </h3>
          <p className="text-indigo-500 font-medium text-sm mt-1">{job.company}</p>
        </div>
        <div className="text-right">
          <span className="text-emerald-400 font-bold text-lg">₹{job.salary.toLocaleString()}</span>
          <p className="text-slate-500 text-xs uppercase tracking-wider">Per Annum</p>
        </div>
      </div>

      { }
      <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6">
        <div className="flex items-center text-slate-400 text-sm">
          <span className="mr-2 text-slate-500">📍</span>
          {job.location}
        </div>
        <div className="flex items-center text-slate-400 text-sm">
          <span className="mr-2 text-slate-500">💼</span>
          {job.minExperience}+ Years Exp.
        </div>
      </div>

      { }
      <div className="flex flex-wrap gap-2 mb-6">
        {job.requiredSkills.map((skill, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>

      { }
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-500 font-light">Posted 2 days ago</span>

        <div className="flex gap-2">
          {onPrep && (
            <button
              onClick={() => onPrep(job._id)}
              className="px-4 py-2 bg-indigo-900/30 text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold rounded-lg transition-all border border-indigo-500/30"
              title="Get personalized interview prep"
            >
              🤖 AI Prep
            </button>
          )}
          {onApply && (
            <button
              onClick={() => onApply(job._id)}
              className="px-6 py-2 bg-white text-slate-950 hover:bg-indigo-500 hover:text-white font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}