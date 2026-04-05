import { useState, useRef, useEffect } from "react";
import { generateModel } from "../lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import type { Model } from "../lib/api";

interface ChatWindowProps {
  sessionId: string | null;
  models: Model[];
  onNewModel: () => void;
  onSelectModel?: (model: Model) => void;
}

interface Message {
  type: "user" | "assistant";
  content: string;
  modelId?: string;
  timestamp: Date;
}

export default function ChatWindow({
  sessionId,
  models,
  onNewModel,
  onSelectModel,
}: ChatWindowProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const { getToken } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convert models to conversation pairs (user prompt + assistant response)
  const conversationMessages: Message[] = [];
  models.forEach((model) => {
    // User message (the prompt)
    conversationMessages.push({
      type: "user" as const,
      content: model.prompt,
      modelId: model.id,
      timestamp: new Date(model.timestamp),
    });
    // Assistant message (confirmation)
    conversationMessages.push({
      type: "assistant" as const,
      content: `Generated model: ${model.prompt}.`,
      modelId: model.id,
      timestamp: new Date(model.timestamp),
    });
  });

  // Add initial welcome message
  let allMessages: Message[] = [
    {
      type: "assistant",
      content: "Hello! I can help you create 3D CAD models. Describe what you want to build.",
      timestamp: new Date(),
    },
    ...conversationMessages,
  ];

  // Add pending user prompt if exists
  if (pendingPrompt) {
    allMessages.push({
      type: "user",
      content: pendingPrompt,
      timestamp: new Date(),
    });
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [models.length, pendingPrompt, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !sessionId) return;

    const userMessage = prompt;
    setPendingPrompt(userMessage);
    setPrompt("");
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        toast.error("You must be logged in to generate models.");
        setPendingPrompt(null);
        setLoading(false);
        return;
      }
      await generateModel(userMessage, sessionId, token);
      toast.success("Model generated!");
      setPendingPrompt(null);
      onNewModel();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to generate");
      setPendingPrompt(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-800">AI Assistant</h2>
        <p className="text-sm text-gray-500 mt-1">Powered by CAD AI</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {allMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.type === "user" ? "justify-end group" : "justify-start"
            }`}
          >
            <div
              className={`relative max-w-[80%] rounded-lg px-4 py-3 flex items-center gap-2 ${
                message.type === "user"
                  ? "bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-colors"
                  : "bg-white text-gray-800 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              } ${message.modelId ? "" : ""}`}
              onClick={() => {
                if (message.modelId && onSelectModel) {
                  const model = models.find((m) => m.id === message.modelId);
                  if (model) onSelectModel(model);
                }
              }}
            >
              {message.type === "user" && (
                <button
                  className="absolute -left-8 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  aria-label="Delete message"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">Generating model...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              !sessionId
                ? "Setting up session... Please wait"
                : "Describe your 3D model..."
            }
            className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={loading || !sessionId}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim() || !sessionId}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "→"}
          </button>
        </form>
      </div>
    </div>
  );
}

