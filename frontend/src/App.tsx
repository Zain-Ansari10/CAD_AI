import { Toaster } from "react-hot-toast";
import PromptInput from "./components/PromptInput";
import ModelGrid from "./components/ModelGrid";
import { useEffect, useState } from "react";
import { getModels } from "./lib/api";
import toast from "react-hot-toast";

export default function App() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModels = async () => {
    try {
      const res = await getModels();
      if (Array.isArray(res.data)) {
        setModels(res.data);
      } else {
        setModels([]);
      }
    } catch {
      toast.error("Failed to load models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <header className="py-10 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CAD AI
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Describe anything → Get a 3D model instantly
          </p>
        </header>

        <main className="px-6 pb-20">
          <PromptInput onNewModel={fetchModels} />
          <ModelGrid models={models} loading={loading} onUpdate={fetchModels} />
        </main>
      </div>

      <Toaster position="bottom-center" />
    </>
  );
}