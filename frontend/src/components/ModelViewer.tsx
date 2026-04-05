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
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

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
  const { getToken } = useAuth();
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [stlBlobUrl, setStlBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchModelAndStl = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          toast.error("Authentication required to view model.");
          setLoading(false);
          return;
        }

        // Fetch model metadata
        const res = await getModelById(id, token);
        setModel(res.data);

        // Fetch STL blob
        const stlUrl = `${import.meta.env.VITE_BACKEND_URL}/cad/${id}/download_stl`;
        const stlResponse = await axios.get(stlUrl, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        });
        const blob = new Blob([stlResponse.data], { type: 'application/sla' });
        const url = URL.createObjectURL(blob);
        setStlBlobUrl(url);

        // Cleanup function for when the component unmounts
        return () => {
          if (url) URL.revokeObjectURL(url);
        };
      } catch (error) {
        console.error("Failed to load model or STL:", error);
        toast.error("Failed to load model data.");
      } finally {
        setLoading(false);
      }
    };

    fetchModelAndStl();
  }, [id, getToken]);

  const handleDownload = async () => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("You must be logged in to download models.");
        return;
      }
  
      const stlUrl = `${import.meta.env.VITE_BACKEND_URL}/cad/${id}/download_stl`;
  
      const response = await axios.get(stlUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
  
      const blob = new Blob([response.data], { type: "application/sla" });
      const url = URL.createObjectURL(blob);
  
      const a = document.createElement("a");
      a.href = url;
      a.download = `${model?.prompt || "model"}.stl`;
      document.body.appendChild(a);
      a.click();
  
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  
      toast.success("Download started");
    } catch (error) {
      console.error(error);
      toast.error("Download failed");
    }
  };
  

  if (loading) return <div className="text-center py-20 text-xl">Loading model...</div>;
  if (!model) return <div className="text-center py-20 text-xl">Model not found</div>;

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="p-4 flex items-center gap-4 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
        <Link
          to="/"
          className="shrink-0 py-2 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition whitespace-nowrap flex items-center gap-2"
        >
          <span>&larr;</span> Back to Gallery
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-800 truncate" title={model.prompt}>
            Viewing: {model.prompt}
          </h1>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden bg-gray-100">
        <ErrorBoundary fallback={<div className="text-center py-20 text-xl">Failed to render model</div>}>
          <div className="absolute inset-0 h-full w-full">
            {stlBlobUrl && (
              <button
                className="absolute top-4 right-4 z-20 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-all duration-300 ease-in-out cursor-pointer"
                onClick={handleDownload}
                title="Download STL file"
              >
                Download STL
              </button>
            )}
            {stlBlobUrl ? (
              <Canvas>
                <ambientLight intensity={0.5} />
                <Stage environment="city" intensity={0.6} adjustCamera={true}>
                  <STLViewer url={stlBlobUrl} />
                </Stage>
                <OrbitControls makeDefault />
                <PerspectiveCamera makeDefault position={[50, 50, 50]} />
              </Canvas>
            ) : (
              <div className="text-center py-20 text-xl">Loading 3D view...</div>
            )}
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}