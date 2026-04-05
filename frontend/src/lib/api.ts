import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
});

export interface Model {
    id: string;
    prompt: string;
    generated_code: string;
    stl_url: string;
    timestamp: string;
}

export interface Session {
    id: string;
    name: string;
    created_at: string;
    project_id?: string;
}

export interface CreateSessionResponse {
    id: string;
    name: string;
    created_at: string;
    project_id?: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    session_count?: number;
}

export interface CreateProjectResponse {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

const createHeaders = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const generateModel = (prompt: string, sessionId: string, token: string) =>
    api.post<{ id: string; stl_url: string; message: string }>(
        "/cad/generate",
        {
            prompt,
            sessionId: sessionId,
        },
        createHeaders(token)
    );

export const getModels = (sessionId: string, token: string) =>
    api.get<Model[]>(`/cad/session/${sessionId}`, createHeaders(token));

export const getModelById = (id: string, token: string) =>
    api.get<Model>(`/cad/${id}`, createHeaders(token));

//PUT to /cad/{id}
export const updateModel = (id: string, prompt: string, token: string) =>
    api.put(`/cad/${id}`, { prompt }, createHeaders(token));

export const deleteModel = (id: string, token: string) =>
    api.delete(`/cad/${id}`, createHeaders(token));

export const createSession = (name: string, token: string) =>
    api.post<CreateSessionResponse>("/sessions/", { name }, createHeaders(token));

export const getSessions = (token: string) =>
    api.get<Session[]>("/sessions/", createHeaders(token));

export const deleteSession = (sessionId: string, token: string) =>
    api.delete(`/sessions/${sessionId}`, createHeaders(token));

export const createSessionInProject = (name: string, projectId: string, token: string) =>
    api.post<CreateSessionResponse>("/sessions/in-project", { name, project_id: projectId }, createHeaders(token));

export const getProjectSessions = (projectId: string, token: string) =>
    api.get<Session[]>(`/sessions/project/${projectId}`, createHeaders(token));

export const createProject = (name: string, token: string, description?: string) =>
    api.post<CreateProjectResponse>("/projects/", { name, description }, createHeaders(token));

export const getProjects = (token: string) =>
    api.get<Project[]>("/projects/", createHeaders(token));

export const getProject = (projectId: string, token: string) =>
    api.get<Project>(`/projects/${projectId}`, createHeaders(token));

export const updateProject = (projectId: string, token: string, name?: string, description?: string) =>
    api.put(`/projects/${projectId}`, { name, description }, createHeaders(token));

export const deleteProject = (projectId: string, token: string) =>
    api.delete(`/projects/${projectId}`, createHeaders(token));
