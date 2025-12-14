import { useState } from "react";
import { generateModel } from "../lib/api";
import toast from "react-hot-toast";

export default function PromptInput({ onNewModel }: { onNewModel: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      await generateModel(prompt);
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
          placeholder="Describe your 3D model... (e.g. 'a 30mm cube with a hole', 'M3 bolt 20mm long')"
          className="flex-1 px-2 py-5 text-lg border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="px-6 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>
    </form>
  );
}