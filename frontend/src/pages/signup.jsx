import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignupApiUser, SignupApiCompany, GoogleLoginApiUser, GoogleLoginApiCompany } from "../api/auth";
import { Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    role: "user",
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res;

      if (form.role === "user") {
        res = await SignupApiUser({
          name: form.name,
          email: form.email,
          password: form.password,
        });
      } else {
        res = await SignupApiCompany({
          name: form.name,
          email: form.email,
          password: form.password,
        });
      }

      const userData = form.role === "company" ? res.data.company : res.data.user;
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userId", res.data._id);
      localStorage.setItem("role", form.role);

      navigate(form.role === "company" ? "/provider" : "/create");
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      let res;
      if (form.role === "user") {
        res = await GoogleLoginApiUser({ token: credentialResponse.credential });
      } else {
        res = await GoogleLoginApiCompany({ token: credentialResponse.credential });
      }

      const userData = form.role === "company" ? res.data.company : res.data.user;
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userId", res.data._id);
      localStorage.setItem("role", form.role);

      navigate(form.role === "company" ? "/provider" : "/create");
    } catch (err) {
      alert(err.response?.data?.message || "Google Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600";
  const labelStyle =
    "block mb-1.5 text-sm font-medium text-slate-400 ml-1";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        { }
        <div className="flex bg-slate-900 p-1.5 rounded-2xl mb-8 border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setForm({ ...form, role: "user" })}
            className={`flex-1 py-3 text-sm font-bold rounded-xl ${form.role === "user"
              ? "bg-indigo-600 text-white"
              : "text-slate-500"
              }`}
          >
            Candidate
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, role: "company" })}
            className={`flex-1 py-3 text-sm font-bold rounded-xl ${form.role === "company"
              ? "bg-indigo-600 text-white"
              : "text-slate-500"
              }`}
          >
            Company
          </button>
        </div>

        { }
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <h2 className="text-3xl font-bold text-white mb-2">
            Create Account
          </h2>
          <p className="text-slate-500 mb-6 text-sm">
            {form.role === "user"
              ? "Join as a candidate to find jobs."
              : "Join as a company to post jobs."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelStyle}>
                {form.role === "user" ? "Full Name" : "Company Name"}
              </label>
              <input
                name="name"
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>

            <div>
              <label className={labelStyle}>Email</label>
              <input
                name="email"
                type="email"
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>

            <div>
              <label className={labelStyle}>Password</label>
              <input
                name="password"
                type="password"
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
            <div className="flex items-center justify-center my-4">
              <div className="w-full h-px bg-slate-800"></div>
              <span className="px-4 text-sm text-slate-500">or</span>
              <div className="w-full h-px bg-slate-800"></div>
            </div>
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => alert("Google Signup Failed")}
                theme="filled_black"
                shape="rectangular"
                size="large"
                width="100%"
                text="signup_with"
              />
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
