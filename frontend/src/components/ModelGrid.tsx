import ModelCard from "./ModelCard";

interface ModelGridProps {
  models: any[];
  loading: boolean;
  onUpdate: () => void;
}

export default function ModelGrid({
  models,
  loading,
  onUpdate,
}: ModelGridProps) {
  if (loading)
    return <div className="text-center py-20 text-xl">Loading models...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
      {models.map((model) => (
        <ModelCard key={model.id} model={model} onUpdate={onUpdate} />
      ))}
      {models.length === 0 && (
        <p className="col-span-full text-center text-gray-500 text-xl py-20">
          No models yet. Generate your first one!
        </p>
      )}
    </div>
  );
}