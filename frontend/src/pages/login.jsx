import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginApiUser, LoginApiCompany, GoogleLoginApiUser, GoogleLoginApiCompany } from "../api/auth";
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    const role = localStorage.getItem("role");

    if (user) {
      if (role === "company") {
        navigate("/provider");
      } else {
        navigate("/jobs");
      }
    }
  }, [navigate]);

  const [form, setForm] = useState({
    role: "user",
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
        res = await LoginApiUser({
          email: form.email,
          password: form.password,
        });
      } else {
        res = await LoginApiCompany({
          email: form.email,
          password: form.password,
        });
      }


      const userData = form.role === "company" ? res.data.company : res.data.user;


      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userId", res.data._id);
      localStorage.setItem("role", form.role);


      if (form.role === "company") {
        navigate("/provider");
      } else {
        if (userData.isProfileComplete) {
          navigate("/jobs");
        } else {
          navigate("/create");
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
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

      if (form.role === "company") {
        navigate("/provider");
      } else {
        if (userData.isProfileComplete) {
          navigate("/jobs");
        } else {
          navigate("/create");
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Google Login failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600";
  const labelStyle =
    "block mb-2 text-sm font-medium text-slate-400 ml-1";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        { }
        <div className="flex bg-slate-900 p-1.5 rounded-2xl mb-8 border border-slate-800 shadow-xl">
          <button
            type="button"
            onClick={() => setForm({ ...form, role: "user" })}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${form.role === "user"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-500 hover:text-slate-300"
              }`}
          >
            Candidate
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, role: "company" })}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${form.role === "company"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-slate-500 hover:text-slate-300"
              }`}
          >
            Company
          </button>
        </div>

        { }
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl relative">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              Login as a{" "}
              <span className="text-indigo-400 font-semibold uppercase">
                {form.role}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={labelStyle}>Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
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
                placeholder="••••••••"
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                "Login"
              )}
            </button>
            <div className="flex items-center justify-center my-4">
              <div className="w-full h-px bg-slate-800"></div>
              <span className="px-4 text-sm text-slate-500">or</span>
              <div className="w-full h-px bg-slate-800"></div>
            </div>
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => alert("Google Login Failed")}
                theme="filled_black"
                shape="rectangular"
                size="large"
                width="100%"
              />
            </div>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-500">
              New to the platform?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
