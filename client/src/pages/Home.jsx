import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

const Home = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.data.user);
      } catch (err) {
        navigate("/login");
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");

    if (!prompt.trim()) {
      setError("Please enter a prompt before generating.");
      return;
    }

    setGenerating(true);

    try {
      const response = await api.post("/images/generate", { prompt });
      const { imageUrl, remainingCredits } = response.data.data;

      setGeneratedImage(imageUrl);
      setUser((prev) => (prev ? { ...prev, credits: remainingCredits } : prev));
    } catch (err) {
      const message =
        err.response?.data?.message || "Image generation failed. Please try again.";
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Hi, {user?.name || "there"}
            </h1>
            <p className="text-sm text-slate-500">Turn your ideas into images.</p>
          </div>
          <div className="rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-sm font-medium text-indigo-700">
            {user?.credits ?? 0} credits left
          </div>
        </div>

        <form onSubmit={handleGenerate} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">
            Describe the image you want
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            placeholder="a cyberpunk city at night, neon lights, ultra detailed"
          />

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={generating}
            className="mt-4 w-full sm:w-auto rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? "Generating..." : "Generate image"}
          </button>
        </form>

        {generatedImage && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-medium text-slate-700 mb-3">Your generated image</h2>
            <img
              src={generatedImage}
              alt={prompt}
              className="w-full rounded-xl border border-slate-200"
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;