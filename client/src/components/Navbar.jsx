import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-slate-900">AI Image Generator</span>

        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Home
          </Link>
          <Link
            to="/history"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            History
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;