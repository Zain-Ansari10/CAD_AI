import { Canvas, useLoader } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Stage,
  Center,
} from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/Addons.js";
import { Link, useParams } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";
import { useEffect, useState } from "react";
import { getModelById, type Model } from "../lib/api";
import toast from "react-hot-toast";

function STLViewer({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  return (
    <Center>
      <mesh geometry={geometry} scale={1}>
        <meshStandardMaterial color="orange" />
      </mesh>
    </Center>
  );
}

export default function ModelViewer() {
  const { id } = useParams();
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getModelById(id)
      .then((res) => setModel(res.data))
      .catch(() => toast.error("Failed to load model"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-xl">Loading...</div>;
  if (!model) return <div className="text-center py-20 text-xl">Model not found</div>;

  // Fetch STL from API endpoint
  const stlUrl = `${import.meta.env.VITE_BACKEND_URL}/cad/${model.id}/download_stl?t=${new Date(model.timestamp).getTime()}`;

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="p-4 flex items-center gap-4 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
        <Link
          to="/"
          // Added 'shrink-0' to prevent crushing
          // Added 'whitespace-nowrap' to keep text on one line
          className="shrink-0 py-2 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition whitespace-nowrap flex items-center gap-2"
        >
          <span>&larr;</span> Back to Gallery
        </Link>
        
        {/* Added 'min-w-0' and 'truncate' to handle long prompts */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-800 truncate" title={model.prompt}>
            Viewing: {model.prompt}
          </h1>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden bg-gray-100">
        <ErrorBoundary fallback={<div className="text-center py-20 text-xl">Failed to load model</div>}>
          <div className="absolute inset-0 h-full w-full">
            <Canvas>
              <ambientLight intensity={0.5} />
              <Stage environment="city" intensity={0.6} adjustCamera={true}>
                <STLViewer url={stlUrl} />
              </Stage>
              <OrbitControls makeDefault />
              <PerspectiveCamera makeDefault position={[50, 50, 50]} />
            </Canvas>
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}