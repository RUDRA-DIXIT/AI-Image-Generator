import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const History = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/images/history");
        setImages(response.data.data.images);
      } catch (err) {
        setError("Could not load your image history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Your history</h1>
        <p className="text-sm text-slate-500 mb-8">Every image you've generated, newest first.</p>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-sm text-slate-500">
              You haven't generated any images yet.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div
              key={image._id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <img
                src={image.imageUrl}
                alt={image.prompt}
                className="w-full aspect-square object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-slate-800 line-clamp-2">{image.prompt}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(image.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default History;