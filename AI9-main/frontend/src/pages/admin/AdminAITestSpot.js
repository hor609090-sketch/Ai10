import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Bot, MessageSquare, Send, RefreshCw, AlertTriangle, 
  Sparkles, Terminal, FileText, ChevronRight, Trash2
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const AdminAITestSpot = () => {
  const { token } = useAuth();
  const [testInfo, setTestInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('client_query');
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchTestInfo();
    fetchLogs();
  }, []);

  const fetchTestInfo = async () => {
    try {
      const response = await axios.get(`${API}/api/v1/admin/system`, config);
      setTestInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch test info:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API}/api/v1/admin/audit-logs?limit=20`, config);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = { role: 'user', content: inputMessage };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setLoading(true);

    try {
      // AI test simulation - placeholder (feature not yet implemented)
      const response = await axios.post(`${API}/api/v1/admin/system`, {
        messages: updatedMessages,
        test_scenario: selectedScenario
      }, config);

      if (response.data.response) {
        setMessages([...updatedMessages, response.data.response]);
      }
      fetchLogs();
    } catch (error) {
      console.error('Failed to simulate:', error);
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: 'Error: Failed to get response. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSamplePrompt = (prompt) => {
    setInputMessage(prompt);
  };

  const clearConversation = () => {
    setMessages([]);
  };

  return (
    <div className="space-y-6" data-testid="ai-test-spot">
      {/* AI Status Banner */}
      {testInfo?.ai_enabled ? (
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="text-emerald-400 font-bold">🤖 LIVE AI CONNECTED - {testInfo?.model || 'GPT-4o'}</h3>
              <p className="text-emerald-300/80 text-sm">
                Real GPT responses. No real payments or automation triggers in this test environment.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-yellow-400 font-bold">TEST MODE ACTIVE</h3>
              <p className="text-yellow-300/80 text-sm">
                This is an isolated test environment. No real AI is invoked. No real payments or automation triggers.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 px-6 py-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AI Test Spot</h2>
                  <p className="text-gray-400 text-sm">Simulate AI conversations</p>
                </div>
              </div>
              <button
                onClick={clearConversation}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                title="Clear conversation"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scenario Selector */}
          <div className="px-6 py-3 bg-gray-800/50 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">Scenario:</span>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500"
                data-testid="scenario-selector"
              >
                {testInfo?.available_scenarios?.map(scenario => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-gray-400 font-medium mb-2">Start Testing</h3>
                <p className="text-gray-500 text-sm max-w-md">
                  Type a message or use sample prompts to test AI responses in an isolated environment.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-800 text-gray-200'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1 text-xs text-emerald-400">
                        <Sparkles className="w-3 h-3" />
                        GPT-4o RESPONSE
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 px-4 py-3 rounded-2xl">
                  <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a test message..."
                className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500"
                data-testid="test-message-input"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !inputMessage.trim()}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition flex items-center gap-2"
                data-testid="send-test-btn"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sample Prompts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              Sample Prompts
            </h3>
            <div className="space-y-2">
              {testInfo?.sample_prompts?.[selectedScenario]?.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSamplePrompt(prompt)}
                  className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition flex items-center gap-2"
                >
                  <ChevronRight className="w-3 h-3 text-purple-400 flex-shrink-0" />
                  <span className="truncate">{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Test Logs */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Recent Test Logs
              </h3>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-gray-400 hover:text-white text-sm"
              >
                {showLogs ? 'Hide' : 'Show'}
              </button>
            </div>
            {showLogs && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No test logs yet</p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="bg-gray-800 p-2 rounded-lg text-xs">
                      <div className="text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-gray-300 truncate">
                        {log.messages?.[0]?.content?.substring(0, 50) || 'Test conversation'}...
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Scenario Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3">Available Scenarios</h3>
            <div className="space-y-2">
              {testInfo?.available_scenarios?.map(scenario => (
                <div
                  key={scenario.id}
                  className={`p-3 rounded-lg border transition cursor-pointer ${
                    selectedScenario === scenario.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedScenario(scenario.id)}
                >
                  <div className="text-white text-sm font-medium">{scenario.name}</div>
                  <div className="text-gray-400 text-xs mt-1">{scenario.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAITestSpot;
