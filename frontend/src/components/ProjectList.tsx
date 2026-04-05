import { type Project } from "../lib/api";
import ProjectCard from "./ProjectCard";
import { PlusIcon } from "@heroicons/react/20/solid";

interface ProjectListProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  loading: boolean;
}

export default function ProjectList({ 
  projects, 
  selectedProject, 
  onSelectProject, 
  onCreateProject, 
  onEditProject, 
  onDeleteProject,
  loading 
}: ProjectListProps) {
  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-600">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      <div className="flex flex-wrap justify-center gap-8">
        {/* Create New Project Card */}
        <button
          onClick={onCreateProject}
          className="flex flex-col items-center justify-center w-72 h-48 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group bg-white/50 backdrop-blur-sm"
        >
          <div className="p-3 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors mb-4">
            <PlusIcon className="h-8 w-8 text-gray-500 group-hover:text-blue-600" />
          </div>
          <span className="text-lg font-medium text-gray-700 group-hover:text-blue-700">
            Create a new Project
          </span>
        </button>

        {/* Project Cards */}
        {projects.map((project) => (
          <div key={project.id} className="w-72 h-48">
            <ProjectCard
              project={project}
              onSelect={onSelectProject}
              onDelete={onDeleteProject}
              onEdit={onEditProject}
              isSelected={selectedProject?.id === project.id}
            />
          </div>
        ))}
      </div>

      {projects.length === 0 && !loading && (
        <div className="text-center mt-16">
          <p className="text-gray-500 text-lg">You don't have any projects yet. Click the card above to get started!</p>
        </div>
      )}
    </div>
  );
}