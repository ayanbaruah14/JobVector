import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();


  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => `
    text-sm font-medium transition-all duration-200 px-3 py-2 rounded-md
    ${isActive(path)
      ? "text-indigo-400 bg-indigo-500/10"
      : "text-slate-400 hover:text-white hover:bg-slate-800"
    }
  `;

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          { }
          <div className="flex items-center">
            <Link to="/jobs" className="flex items-center gap-3 group">
              { }
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-500 rounded-xl rotate-0 group-hover:rotate-12 transition-transform duration-300 opacity-20"></div>
                <div className="absolute inset-0 bg-emerald-500 rounded-xl rotate-0 group-hover:-rotate-6 transition-transform duration-300 opacity-20 delay-75"></div>

                { }
                <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300 border border-indigo-500/30">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white transform group-hover:scale-110 transition-transform">
                    <circle cx="12" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
                    <circle cx="6" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
                    <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 9V12M12 12L7.5 15.5M12 12L16.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col -space-y-1">
                <span className="text-white font-bold text-xl tracking-tight hidden sm:block">
                  Trivalent
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase hidden sm:block">
                  Hiring Platform
                </span>
              </div>
            </Link>
          </div>

          { }
          <div className="flex items-center space-x-1 md:space-x-4">
            <Link to="/jobs" className={linkStyle("/jobs")}>
              Jobs
            </Link>
            <Link to="/recommend" className={linkStyle("/recommend")}>
              Recommended
            </Link>
            <Link to="/applications" className={linkStyle("/applications")}>
              Applications
            </Link>
            <Link to="/profile" className={linkStyle("/profile")}>
              Profile
            </Link>

            <div className="h-6 w-px bg-slate-800 mx-2 hidden sm:block"></div>

            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="ml-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold rounded-lg transition-all border border-slate-700 active:scale-95"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}