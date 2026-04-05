import { Toaster } from "react-hot-toast";
import ChatWindow from "./components/ChatWindow";
import ModelPreview from "./components/ModelPreview";
import ProjectDashboard from "./components/ProjectDashboard";
import SessionSidebar from "./components/SessionSidebar";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getModels, getSessions, getProjectSessions, createSession, createSessionInProject, deleteSession, type Session, type Model } from "./lib/api";
import toast from "react-hot-toast";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";
import { ChevronDownIcon, FolderIcon } from '@heroicons/react/20/solid';

export default function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'projects' | 'session'>('session');
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const routeProjectId = projectId ?? null;

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully!");
  };

  const handleCreateSession = useCallback(async (name?: string) => {
    // If name is a string, use it. If it's something else (like an event), or missing, prompt for it.
    const sessionName = (typeof name === 'string' ? name : null) || prompt("Enter new session name:");
    if (!sessionName) return;

    try {
      const token = await getToken();
      if (!token) return;

      const res = routeProjectId
        ? await createSessionInProject(sessionName, routeProjectId, token)
        : await createSession(sessionName, token);

      toast.success(`Session '${sessionName}' created!`);

      // After creating, re-fetch sessions in the current scope (project vs all).
      const sessionsRes = routeProjectId
        ? await getProjectSessions(routeProjectId, token)
        : await getSessions(token);

      setSessions(sessionsRes.data || []);
      setSelectedSessionId(res.data.id); // Set the newly created session as selected
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("Failed to create session.");
    }
  }, [getToken, routeProjectId]);

  const fetchSessions = useCallback(async () => {
    if (!isLoaded) {
      setSessionLoading(false);
      return;
    }
    if (!getToken) {
      setSessionLoading(false);
      return;
    }
    setSessionLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        console.warn("No token available");
        setSessionLoading(false);
        return;
      }
      const res = routeProjectId
        ? await getProjectSessions(routeProjectId, token)
        : await getSessions(token);

      const nextSessions = res.data || [];
      setSessions(nextSessions);
      setSelectedSessionId((prev) => {
        if (prev && nextSessions.some((s) => s.id === prev)) return prev;
        return nextSessions.length > 0 ? nextSessions[0].id : null;
      });
    } catch (error: any) {
      console.error("Failed to fetch sessions:", error);
      toast.error(error.response?.data?.detail || "Failed to load sessions.");
    } finally {
      setSessionLoading(false);
    }
  }, [isLoaded, getToken, routeProjectId]);


  const handleDeleteSession = async (sessionIdToDelete: string) => {
    if (!confirm("Are you sure you want to delete this session and all its models?")) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteSession(sessionIdToDelete, token);
      toast.success("Session deleted!");
      await fetchSessions();
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error("Failed to delete session.");
    }
  };

  const fetchModels = async (sessionId: string | null) => {
    if (!sessionId) {
      setModels([]); // Clear models if no session is selected
      setSelectedModel(null);
      return;
    }
    try {
      setModels([]);
      setSelectedModel(null);
      const token = await getToken();
      if (!token) return;
      const res = await getModels(sessionId, token);
      const nextModels = res.data || [];
      setModels(nextModels);
      setSelectedModel(nextModels.length > 0 ? nextModels[nextModels.length - 1] : null);
    } catch {
      toast.error("Failed to load models");
      setModels([]); // Clear models on error
      setSelectedModel(null);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchSessions();
    }
  }, [isLoaded, fetchSessions]); // Depend on isLoaded and fetchSessions

  useEffect(() => {
    fetchModels(selectedSessionId);
  }, [selectedSessionId, getToken]); // Depend on selectedSessionId and getToken

  useEffect(() => {
    if (routeProjectId) {
      setCurrentView("session");
    }
  }, [routeProjectId]);

  return (
    <>
      <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
        {user && (currentView === 'session' || routeProjectId) && (
          <SessionSidebar
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
            onCreateSession={handleCreateSession}
            onDeleteSession={handleDeleteSession}
          />
        )}
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="relative py-6 px-6 flex items-center justify-between border-b border-gray-100 bg-white/50 backdrop-blur-sm">
            <div>
              <h1 className="text-3xl flex-1 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CAD AI
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {user && (currentView === 'session' || routeProjectId) && (
                <button
                  onClick={() => {
                    navigate("/");
                    setCurrentView('projects');
                    setSelectedSessionId(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2 font-medium text-sm"
                >
                  <FolderIcon className="h-4 w-4 text-gray-400" />
                  Projects
                </button>
              )}

              {user && (
                <div className="flex items-center gap-2 group cursor-pointer relative">
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName || "User"} 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  />
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center focus:outline-none"
                  >
                    <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-50 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigate("/");
                          setCurrentView('projects');
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FolderIcon className="h-4 w-4 text-gray-400" />
                        My Projects
                      </button>
                      <div className="border-t border-gray-50 my-1"></div>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            {!isLoaded || !user ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xl text-gray-600">Loading...</p>
              </div>
            ) : currentView === 'projects' && !routeProjectId ? (
              <div className="max-w-[1800px] mx-auto">
                <ProjectDashboard />
              </div>
            ) : sessionLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xl text-gray-600">Loading sessions...</p>
              </div>
            ) : !selectedSessionId ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-xl text-red-600 mb-4">No active session. Please create one.</p>
                <button
                  onClick={() => handleCreateSession("Default Session")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Create Default Session
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 h-full max-w-[1800px] mx-auto">
                {/* Left Column: Chat Window */}
                <div className="w-full lg:w-1/2 flex flex-col min-h-0">
                  <ChatWindow
                    sessionId={selectedSessionId}
                    models={models}
                    onNewModel={() => selectedSessionId && fetchModels(selectedSessionId)}
                    onSelectModel={setSelectedModel}
                  />
                </div>

                {/* Right Column: Model Preview */}
                <div className="w-full lg:w-1/2 flex flex-col min-h-0">
                  <ModelPreview model={selectedModel} />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Toaster position="bottom-center" />
    </>
  );
}