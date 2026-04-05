import { useState } from "react";
import { generateModel } from "../lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";

export default function PromptInput({
  onNewModel,
  sessionId,
}: {
  onNewModel: () => void;
  sessionId: string | null;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !sessionId) return;

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("You must be logged in to generate models.");
        return;
      }
      await generateModel(prompt, sessionId, token);
      toast.success("Model generated!");
      setPrompt("");
      onNewModel();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto mb-12">
      <div className="flex gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            !sessionId 
              ? "Setting up session... Please wait" 
              : "Describe your 3D model... (e.g. 'a 30mm cube with a hole', 'M3 bolt 20mm long')"
          }
          className="flex-1 px-2 py-5 text-lg border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={loading || !sessionId}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim() || !sessionId}
          className="px-6 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>
      {!sessionId && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Waiting for session to be ready...
        </p>
      )}
    </form>
  );
}