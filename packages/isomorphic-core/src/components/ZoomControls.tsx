import React from 'react';
import { Panel, useReactFlow } from 'reactflow';
import { ZoomIn, ZoomOut, Maximize, Home } from 'lucide-react';

const ZoomControls = () => {
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow();

  const buttonClass = "bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-md shadow-lg border border-gray-700 transition-colors";
  
  return (
    <Panel position="top-left" className="flex space-x-2 ml-16 mt-4">
      <button
        className={buttonClass}
        onClick={() => zoomIn()}
        title="Zoom in"
      >
        <ZoomIn size={18} />
      </button>
      <button
        className={buttonClass}
        onClick={() => zoomOut()}
        title="Zoom out"
      >
        <ZoomOut size={18} />
      </button>
      <button
        className={buttonClass}
        onClick={() => fitView({ duration: 500 })}
        title="Fit view"
      >
        <Maximize size={18} />
      </button>
      <button
        className={buttonClass}
        onClick={() => {
          setCenter(0, 0, { duration: 800 });
        }}
        title="Center view"
      >
        <Home size={18} />
      </button>
    </Panel>
  );
};

export default ZoomControls;