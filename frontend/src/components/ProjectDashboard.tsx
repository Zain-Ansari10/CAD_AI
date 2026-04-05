import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type Project, getProjects, createProject, updateProject, deleteProject } from "../lib/api";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import ProjectList from "./ProjectList";
import ProjectForm from "./ProjectForm";

export default function ProjectDashboard() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormLoading, setProjectFormLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const token = await getToken();
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await getProjects(token);
      setProjects(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const handleSelectProject = useCallback((project: Project) => {
    setSelectedProject(project);
    navigate(`/projects/${project.id}`);
  }, [navigate]);

  const handleCreateProject = useCallback(async (name: string, description?: string) => {
    setProjectFormLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      
      await createProject(name, token, description);
      toast.success("Project created successfully!");
      setShowProjectForm(false);
      await fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create project");
    } finally {
      setProjectFormLoading(false);
    }
  }, [getToken, fetchProjects]);

  const handleEditProject = useCallback(async (name: string, description?: string) => {
    if (!editingProject) return;
    
    setProjectFormLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      
      await updateProject(editingProject.id, token, name, description);
      toast.success("Project updated successfully!");
      setEditingProject(null);
      setShowProjectForm(false);
      await fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update project");
    } finally {
      setProjectFormLoading(false);
    }
  }, [editingProject, getToken, fetchProjects]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project and all its sessions? This action cannot be undone.")) {
      return;
    }
    
    try {
      const token = await getToken();
      if (!token) return;
      
      await deleteProject(projectId, token);
      toast.success("Project deleted successfully!");
      
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      
      await fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete project");
    }
  }, [getToken, selectedProject, fetchProjects]);

  // Sessions UI is handled elsewhere (project-specific session sidebar).

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Projects Column */}
      <div className="flex-1">
        <ProjectList
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={handleSelectProject}
          onCreateProject={() => setShowProjectForm(true)}
          onEditProject={(project) => {
            setEditingProject(project);
            setShowProjectForm(true);
          }}
          onDeleteProject={handleDeleteProject}
          loading={loading}
        />
      </div>

      {/* Sessions Column (intentionally hidden) */}
      {/*
      <div className="flex-1">
        {selectedProject ? (
          <SessionList
            sessions={projectSessions}
            projectName={selectedProject.name}
            onSelectSession={onSelectSession}
            onCreateSession={handleCreateSession}
          />
        ) : (
          <div className="bg-white rounded-lg p-6 text-center h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Project</h3>
            <p className="text-gray-600">Choose a project to view and manage its sessions.</p>
          </div>
        )}
      </div>
      */}

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          onSubmit={editingProject ? handleEditProject : handleCreateProject}
          onCancel={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
          initialData={editingProject ? {
            name: editingProject.name,
            description: editingProject.description
          } : undefined}
          loading={projectFormLoading}
        />
      )}
    </div>
  );
}