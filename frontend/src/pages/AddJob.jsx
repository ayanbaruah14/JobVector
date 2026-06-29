import { useState } from "react";
import { addJob } from "../api/job.api";
import { useNavigate } from "react-router-dom";

export default function AddJob() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "", company: "", requiredSkills: "",
    minExperience: "", location: "", salary: "",
    jobType: "", description: "", preferredCandidates: ""
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("Please login as a company first");
      navigate("/login");
      return;
    }
    const user = JSON.parse(userStr);

    const payload = {
      ...form,
      companyEmail: user.email,
      companyPassword: user.password,
      requiredSkills: form.requiredSkills.split(",").map(s => s.trim()),
      minExperience: Number(form.minExperience),
      salary: Number(form.salary),
    };

    try {
      await addJob(payload);
      navigate("/provider");
    } catch (err) {
      alert(err.response?.data?.message || "Error posting job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = "w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600";
  const labelStyle = "block mb-1.5 text-sm font-semibold text-slate-400 ml-1";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        { }
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Post a New Opening</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Fill in the details to reach thousands of qualified candidates.
              Be as descriptive as possible in the requirements section for better matching.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-indigo-300">
              <li className="flex items-center">✔ Premium placement</li>
              <li className="flex items-center">✔ Automated AI matching</li>
              <li className="flex items-center">✔ Real-time applicant tracking</li>
            </ul>
          </div>
        </div>

        { }
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            { }
            <div className="md:col-span-2 flex items-center gap-4 mb-2">
              <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-white">Job Details</h3>
            </div>



            <div>
              <label className={labelStyle}>Job Title</label>
              <input name="title" placeholder="Senior Frontend Engineer" className={inputStyle} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelStyle}>Company Name</label>
              <input name="company" placeholder="Acme Corp" className={inputStyle} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelStyle}>Job Type</label>
              <input name="jobType" placeholder="Full-time / Remote" className={inputStyle} onChange={handleChange} required />
            </div>

            { }
            <div className="md:col-span-2 flex items-center gap-4 mt-4 mb-2">
              <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-white">Requirements & Pay</h3>
            </div>

            <div>
              <label className={labelStyle}>Location</label>
              <input name="location" placeholder="Remote / New York" className={inputStyle} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelStyle}>Min Experience (Years)</label>
              <input name="minExperience" type="number" placeholder="3" className={inputStyle} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelStyle}>Salary (Annual ₹)</label>
              <input name="salary" type="number" placeholder="1200000" className={inputStyle} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelStyle}>Required Skills</label>
              <input name="requiredSkills" placeholder="React, Tailwind, AWS" className={inputStyle} onChange={handleChange} required />
            </div>

            <div className="md:col-span-2">
              <label className={labelStyle}>Job Description</label>
              <textarea
                name="description"
                rows="4"
                placeholder="Describe the role, responsibilities, and day-to-day tasks..."
                className={`${inputStyle} resize-none`}
                onChange={handleChange}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelStyle}>Describe what kind of candidates you prefer</label>
              <textarea
                name="preferredCandidates"
                rows="3"
                placeholder="e.g. Someone who has built scalable APIs in Node.js, prefers startup environments, and has strong system design skills..."
                className={`${inputStyle} resize-none`}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Publishing..." : "Publish Job Posting"}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}