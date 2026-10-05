import React, { useState } from 'react';
import { useFlowContext } from "@core/context/FlowContext";
import { Clock, ChevronDown, ChevronUp, RotateCw } from "lucide-react";

const HistoryPanel = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { history, isDarkMode,resetCanvas } = useFlowContext();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div
      className={`fixed bottom-4 left-18 ${
        isDarkMode ? "bg-gray-900/95" : "bg-white/95"
      } backdrop-blur-sm border ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      } rounded-xl shadow-2xl transition-all duration-300 z-50`}>
      <div className="p-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span
            className={`text-sm font-medium ${
              isDarkMode ? "text-gray-200" : "text-gray-800"
            }`}>
            History
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={resetCanvas}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
            title="Reset Canvas">
            <RotateCw className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
            title="Toggle Collapse">
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-2 max-h-[240px] overflow-y-auto w-[230px]">
          {history.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              No history yet
            </div>
          ) : (
            <div className="space-y-2">
              {[...history].reverse().map((entry, index) => (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className={`p-2 rounded-lg ${
                    isDarkMode ? "bg-gray-800" : "bg-gray-100"
                  } ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <div className="text-xs text-gray-400">
                    {formatTime(entry.timestamp)}
                  </div>
                  <div className="text-sm">{entry.action}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;