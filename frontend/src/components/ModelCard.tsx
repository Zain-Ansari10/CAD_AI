import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Center } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/Addons.js";
import { deleteModel, updateModel } from "../lib/api";
import toast from "react-hot-toast";
import React, { useState } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { Link } from "react-router-dom";

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

export default function ModelCard({
  model,
  onUpdate,
}: {
  model: any;
  onUpdate: () => void;
}) {
  const stlUrl = import.meta.env.VITE_BACKEND_URL + model.stl_url;
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(model.prompt);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this model?")) return;
    try {
      await deleteModel(model.id);
      toast.success("Deleted");
      onUpdate();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedPrompt.trim()) {
      return toast.error("Prompt cannot be empty");
    }
    setIsUpdating(true);
    try {
      await updateModel(model.id, editedPrompt);
      toast.success("Model updated!");
      setIsEditing(false);
      onUpdate();
    } catch {
      toast.error("Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      <div className="h-64 bg-gray-100 relative group">
        <ErrorBoundary fallback={<div className="flex items-center justify-center h-full text-red-500">Failed to load model</div>}>
          <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading 3D model...</div>}>
            <Canvas>
              <ambientLight intensity={0.8} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <STLViewer url={stlUrl} />
              <PerspectiveCamera makeDefault position={[50, 50, 50]} fov={30} />
              <OrbitControls makeDefault />
            </Canvas>
          </React.Suspense>
        </ErrorBoundary>
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            aria-label="Edit Model"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            aria-label="Delete Model"
          >
            Trash
          </button>
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm text-gray-500 mb-2">
          {new Date(model.timestamp).toLocaleString()}
        </p>
        <p className="font-medium text-gray-800 line-clamp-2 h-12">{model.prompt}</p>

        <div className="mt-4 flex gap-3">
          <a
            href={stlUrl}
            download
            className="flex-1 text-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Download STL
          </a>
          <Link
            to={`/models/${model.id}`}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            View
          </Link>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Edit Prompt</h2>
            <form onSubmit={handleUpdate}>
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="w-full h-40 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isUpdating}
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}