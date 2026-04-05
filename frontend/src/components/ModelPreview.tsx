import { Canvas, useLoader } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Stage,
  Center,
} from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/Addons.js";
import ErrorBoundary from "./ErrorBoundary";
import { useEffect, useState } from "react";
import type { Model } from "../lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

function STLViewer({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  return (
    <Center>
      <mesh geometry={geometry} scale={1}>
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
    </Center>
  );
}

interface ModelPreviewProps {
  model: Model | null;
}

export default function ModelPreview({ model }: ModelPreviewProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stlBlobUrl, setStlBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchStl = async () => {
      if (!model) {
        setStlBlobUrl(null);
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

        // Fetch STL blob
        const stlUrl = `${import.meta.env.VITE_BACKEND_URL}/cad/${model.id}/download_stl`;
        const stlResponse = await axios.get(stlUrl, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        });
        const blob = new Blob([stlResponse.data], { type: "application/sla" });
        const url = URL.createObjectURL(blob);
        setStlBlobUrl(url);

        // Cleanup function
        return () => {
          if (url) URL.revokeObjectURL(url);
        };
      } catch (error) {
        console.error("Failed to load STL:", error);
        toast.error("Failed to load model.");
        setStlBlobUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStl();
  }, [model, getToken]);

  const handleDownload = async () => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("You must be logged in to download models.");
        return;
      }
  
      const stlUrl = `${import.meta.env.VITE_BACKEND_URL}/cad/${model?.id}/download_stl`;
  
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

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Preview Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-800">3D Viewer</h2>
        {model && (
          <p className="text-sm text-gray-500 mt-1 truncate" title={model.prompt}>
            {model.prompt}
          </p>
          
        )}
        <button onClick={handleDownload}className="flex-1 text-center py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          .stl
        </button>
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 relative bg-gray-900">
        {!model ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">No model selected</p>
              <p className="text-sm">Generate a model to see it here</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Loading 3D model...</p>
          </div>
        ) : stlBlobUrl ? (
          <ErrorBoundary
            fallback={
              <div className="flex items-center justify-center h-full text-red-400">
                Failed to render model
              </div>
            }
          >
            <Canvas>
              <ambientLight intensity={0.5} />
              <Stage environment="city" intensity={0.6} adjustCamera={true}>
                <STLViewer url={stlBlobUrl} />
              </Stage>
              <OrbitControls makeDefault />
              <PerspectiveCamera makeDefault position={[50, 50, 50]} />
            </Canvas>
          </ErrorBoundary>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Failed to load model</p>
          </div>
        )}
      </div>
    </div>
  );
}

