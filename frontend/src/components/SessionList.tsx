import { formatDistanceToNow } from "date-fns";
import type { Session } from "../lib/api";

interface SessionListProps {
  sessions: Session[];
  projectName: string;
  onSelectSession: (session: Session) => void;
  onCreateSession: () => void;
}

export default function SessionList({ 
  sessions, 
  projectName, 
  onSelectSession, 
  onCreateSession 
}: SessionListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sessions</h2>
          <p className="text-gray-600">Project: {projectName}</p>
        </div>
        <button
          onClick={onCreateSession}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No sessions in this project yet.</p>
          <button
            onClick={onCreateSession}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Session
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const createdDate = new Date(session.created_at);
            const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });
            
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">{session.name}</h3>
                    <p className="text-sm text-gray-500">{session.created_at}</p>
                  </div>
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}