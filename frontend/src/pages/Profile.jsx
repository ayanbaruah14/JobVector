import { useState, useEffect } from "react";
import { uploadProfileData, getUserProfile } from "../api/user.api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resumeUrl, setResumeUrl] = useState(null);

    const [file, setFile] = useState(null);
    const [form, setForm] = useState({
        name: "", email: "", 
        age: "", experience: "",
        skills: "", totalProjects: "", projectLinks: "",
        preferredRoles: "", preferredLocations: "",
        expectedSalary: "", preferredJobTypes: ""
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                navigate("/login");
                return;
            }
            try {
                const res = await getUserProfile(userId);
                const user = res.data.user;
                if (user) {
                    setForm({
                        name: user.name || "", 
                        email: user.email || "", 
                        age: user.age || "", 
                        experience: user.experience || "",
                        skills: user.skills ? user.skills.join(", ") : "", 
                        totalProjects: user.totalProjects || "", 
                        projectLinks: user.projectLinks ? user.projectLinks.join(", ") : "",
                        preferredRoles: user.preferredRoles ? user.preferredRoles.join(", ") : "", 
                        preferredLocations: user.preferredLocations ? user.preferredLocations.join(", ") : "",
                        expectedSalary: user.expectedSalary || "", 
                        preferredJobTypes: user.preferredJobTypes ? user.preferredJobTypes.join(", ") : "",
                        professionalSummary: user.professionalSummary || ""
                    });
                    if (user.resumeUrl) {
                        setResumeUrl(user.resumeUrl);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const userId = localStorage.getItem("userId");
        if (!userId) {
            alert("User ID not found. Please log in again.");
            setSaving(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("userId", userId);
            
            Object.keys(form).forEach(key => {
                if (key !== "email" && key !== "password") { 
                    formData.append(key, form[key]);
                }
            });
            
            if (file) {
                formData.append("files", file);
            }

            const res = await uploadProfileData(formData);
            
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                user.isProfileComplete = true;
                if (res.data.user) {
                    localStorage.setItem("user", JSON.stringify({ ...user, ...res.data.user }));
                    if (res.data.user.resumeUrl) {
                        setResumeUrl(res.data.user.resumeUrl);
                    }
                }
            }

            alert(res.data.aiSourceUsed
                ? "Profile updated! (Merged manual inputs with AI resume parsing)"
                : "Profile updated successfully!");

            // Stay on the same page but reset file input to show success
            setFile(null);
            document.getElementById('file-upload').value = "";
            
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || err.response?.data?.error || "Error updating profile");
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500";
    const labelStyle = "block mb-2 text-sm font-medium text-slate-300";

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col">
                <Navbar />
                <div className="flex-1 flex justify-center items-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div>
                <Navbar />
            </div>
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 selection:bg-indigo-500/30">
                <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in-up">

                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    {/* Header */}
                    <div className="bg-slate-800/50 p-8 border-b border-slate-700/50">
                        <h2 className="text-3xl font-black text-white tracking-tight">Edit Your Profile</h2>
                        <p className="text-slate-400 mt-2">Update your information to get better AI job recommendations.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">

                        {/* Resume Upload Section */}
                        <div className="bg-slate-800/30 rounded-xl p-6 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                📄 Update Resume
                            </h3>
                            
                            {resumeUrl && (
                                <div className="mb-4">
                                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors font-medium text-sm">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                        View Current Resume
                                    </a>
                                </div>
                            )}

                            <label className="block">
                                <span className="sr-only">Choose profile photo</span>
                                <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-400
                                    file:mr-4 file:py-2.5 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-bold
                                    file:bg-indigo-500/10 file:text-indigo-400
                                    hover:file:bg-indigo-500/20 file:transition-colors file:cursor-pointer
                                "/>
                            </label>
                            <p className="text-xs text-slate-500 mt-2">Uploading a new PDF will automatically update your profile via AI.</p>
                        </div>

                        {/* AI Professional Summary */}
                        {form.professionalSummary && (
                            <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-xl shadow-inner">
                                <h3 className="text-indigo-400 font-bold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <span>✨</span> AI Generated Summary
                                </h3>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    {form.professionalSummary}
                                </p>
                                <p className="text-xs text-indigo-500/70 mt-3 italic">
                                    This summary is automatically regenerated by AI when you update your profile or upload a new resume. It is used to match you with the best jobs!
                                </p>
                            </div>
                        )}

                        {/* Core Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelStyle}>Full Name</label>
                                <input type="text" name="name" value={form.name} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label className={labelStyle}>Age</label>
                                <input type="number" name="age" value={form.age} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>Years of Experience</label>
                                <input type="number" name="experience" value={form.experience} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>Total Projects</label>
                                <input type="number" name="totalProjects" value={form.totalProjects} onChange={handleChange} className={inputStyle} />
                            </div>
                        </div>

                        {/* Skills and Roles */}
                        <div>
                            <label className={labelStyle}>Skills (comma separated)</label>
                            <textarea name="skills" value={form.skills} onChange={handleChange} className={`${inputStyle} h-24 resize-none`} placeholder="React, Node.js, TypeScript..." />
                        </div>
                        <div>
                            <label className={labelStyle}>Preferred Roles (comma separated)</label>
                            <input type="text" name="preferredRoles" value={form.preferredRoles} onChange={handleChange} className={inputStyle} placeholder="Frontend Developer, Full Stack..." />
                        </div>
                        <div>
                            <label className={labelStyle}>Project Links (comma separated)</label>
                            <input type="text" name="projectLinks" value={form.projectLinks} onChange={handleChange} className={inputStyle} placeholder="https://github.com/my-project..." />
                        </div>

                        {/* Preferences */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelStyle}>Preferred Locations (comma separated)</label>
                                <input type="text" name="preferredLocations" value={form.preferredLocations} onChange={handleChange} className={inputStyle} placeholder="New York, Remote..." />
                            </div>
                            <div>
                                <label className={labelStyle}>Preferred Job Types (comma separated)</label>
                                <input type="text" name="preferredJobTypes" value={form.preferredJobTypes} onChange={handleChange} className={inputStyle} placeholder="Full-Time, Contract..." />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelStyle}>Expected Salary (USD)</label>
                                <input type="number" name="expectedSalary" value={form.expectedSalary} onChange={handleChange} className={inputStyle} />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-6 border-t border-slate-800 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`px-8 py-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {saving ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating...
                                    </span>
                                ) : "Save Changes"}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}
