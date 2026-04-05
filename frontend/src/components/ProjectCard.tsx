import type { Project } from "../lib/api";
import { FolderIcon, EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { useState } from "react";

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onEdit: (project: Project) => void;
  isSelected: boolean;
}

export default function ProjectCard({ project, onSelect, onDelete, onEdit, isSelected }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`relative group h-full flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={() => onSelect(project)}
    >
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`p-3 rounded-lg mb-4 ${isSelected ? 'bg-blue-200' : 'bg-gray-100'} transition-colors`}>
        <FolderIcon className={`h-8 w-8 ${isSelected ? 'text-blue-700' : 'text-gray-500'}`} />
      </div>

      <h3 className="font-semibold text-lg text-gray-900 text-center line-clamp-2 px-2">
        {project.name}
      </h3>
      
      {project.session_count !== undefined && (
        <span className="mt-2 text-xs text-gray-500">
          {project.session_count} {project.session_count === 1 ? 'session' : 'sessions'}
        </span>
      )}
    </div>
  );
}