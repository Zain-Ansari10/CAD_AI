import { useState } from 'react'; // Added for toggle state
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon, 
  TrashIcon, 
  Bars3Icon, // Menu Icon
  XMarkIcon   // Close Icon
} from '@heroicons/react/24/outline';
import type { Session } from '../lib/api';

interface SessionSidebarProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function SessionSidebar({
  sessions,
  selectedSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
}: SessionSidebarProps) {
  const [isOpen, setIsOpen] = useState(true); // Toggle State

  return (
    <>
      {/* Toggle Button - Fixed to top left when sidebar is closed */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-md shadow-md hover:bg-gray-50"
        >
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>
      )}

      {/* Sidebar Container */}
      <div className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-0 overflow-hidden border-none'
      }`}>
        
        {/* Header with Close Button */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
          <button
            onClick={onCreateSession}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm whitespace-nowrap"
          >
            <PlusIcon className="h-5 w-5" />
            New Session
          </button>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
              Your Sessions
            </h2>
          </div>
          <div className="space-y-1 px-2">
            {sessions.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-gray-400">No sessions yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    selectedSessionId === session.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <ChatBubbleLeftRightIcon className={`h-5 w-5 flex-shrink-0 ${
                      selectedSessionId === session.id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className="text-sm font-medium truncate">{session.name}</span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 mt-auto bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}</span>
          </div>
        </div>
      </div>
    </>
  );
}