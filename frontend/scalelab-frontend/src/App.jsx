import React, { useState, useMemo } from "react";
import ReactFlow, { Background, Controls, Handle, Position, useEdgesState, useNodesState } from "reactflow";
import axios from "axios";
import { Server, Database, Zap, Activity, Play, Layers, Info } from "lucide-react"; // Added 'Info' icon
import "reactflow/dist/style.css";
import "./App.css";

// --- 1. Updated Custom Node with Info Tooltip ---
const CustomNode = ({ data }) => {
  const isOverloaded = data.status === "Overloaded";
  
  const getIcon = () => {
    const props = { size: 18, className: isOverloaded ? "icon-danger" : "icon-neutral" };
    switch(data.type) {
      case 'database': return <Database {...props} />;
      case 'load_balancer': return <Layers {...props} />;
      case 'cache': return <Zap {...props} />;
      default: return <Server {...props} />;
    }
  };

  return (
    <div className={`node-minimal ${isOverloaded ? "status-danger" : "status-active"}`}>
      {data.type !== "load_balancer" && <Handle type="target" position={Position.Left} className="handle-dot" />}
      
      <div className="node-content">
        <div className="node-top">
          <div className="node-title-box">
            {getIcon()}
            <span className="node-label">{data.label}</span>
          </div>
          
          {/* INFO ICON & TOOLTIP WRAPPER */}
          <div className="info-wrapper">
            <Info size={14} className="info-icon" />
            <div className="tooltip-card">
              <div className="tooltip-header">{data.label}</div>
              <div className="tooltip-body">{data.description}</div>
            </div>
          </div>

        </div>
        
        <div className="node-metrics">
          <div className="metric">
            <span className="metric-label">LATENCY</span>
            <span className="metric-val">{data.latency || 0}ms</span>
          </div>
          <div className="metric">
            <div className={`status-dot ${isOverloaded ? "bg-red" : "bg-green"}`}></div>
          </div>
        </div>
        
        <div className="node-progress-bar">
          <div 
            className="bar-fill" 
            style={{ 
              width: `${Math.min(data.latency || 0, 100)}%`,
              backgroundColor: isOverloaded ? '#ef4444' : '#10b981' 
            }} 
          />
        </div>
      </div>

      {data.type !== "database" && <Handle type="source" position={Position.Right} className="handle-dot" />}
    </div>
  );
};

function App() {
  const [traffic, setTraffic] = useState(8000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState(null);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // --- 2. Updated Data with Descriptions ---
  const initialNodes = [
    { 
      id: "lb1", type: 'custom', position: { x: 100, y: 200 }, 
      data: { 
        label: "Load Balancer", type: "load_balancer", latency: 0, status: "Idle",
        description: "Distributes incoming traffic across multiple servers to prevent overload."
      } 
    },
    { 
      id: "app1", type: 'custom', position: { x: 450, y: 100 }, 
      data: { 
        label: "App Server 01", type: "app_server", latency: 0, status: "Idle",
        description: "Processes core application logic and handles user HTTP requests."
      } 
    },
    { 
      id: "app2", type: 'custom', position: { x: 450, y: 300 }, 
      data: { 
        label: "App Server 02", type: "app_server", latency: 0, status: "Idle",
        description: "A secondary server to handle excess traffic and ensure high availability."
      } 
    },
    { 
      id: "cache1", type: 'custom', position: { x: 800, y: 100 }, 
      data: { 
        label: "Redis Cluster", type: "cache", latency: 0, status: "Idle",
        description: "Stores frequently accessed data in memory for ultra-fast retrieval."
      } 
    },
    { 
      id: "db1", type: 'custom', position: { x: 800, y: 300 }, 
      data: { 
        label: "Primary DB", type: "database", latency: 0, status: "Idle",
        description: "The persistent storage system where all critical user data is saved."
      } 
    }
  ];

  const initialEdges = [
    { id: "e1", source: "lb1", target: "app1", animated: true, style: { stroke: '#333', strokeWidth: 2 } },
    { id: "e2", source: "lb1", target: "app2", animated: true, style: { stroke: '#333', strokeWidth: 2 } },
    { id: "e3", source: "app1", target: "cache1", animated: true, style: { stroke: '#333', strokeWidth: 2 } },
    { id: "e4", source: "app2", target: "cache1", animated: true, style: { stroke: '#333', strokeWidth: 2 } },
    { id: "e5", source: "cache1", target: "db1", animated: true, style: { stroke: '#333', strokeWidth: 2 } }
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // ... (keep the rest of your simulate function exactly the same) ...
  
  const simulate = async () => {
    setIsSimulating(true);
    try {
      const blueprint = { nodes: nodes.map(n => ({ id: n.id, type: n.data.type, capacity: 10000 })) };
      
      const response = await axios.post("http://127.0.0.1:8000/simulate", {
        traffic_rps: traffic,
        read_ratio: 0.95,
        cache_hit_ratio: 0.8,
        blueprint: blueprint
      });

      setResult(response.data);

      setNodes((nds) =>
        nds.map((node) => {
          const backendNode = response.data.nodes.find((n) => n.id === node.id);
          if (!backendNode) return node;
          return {
            ...node,
            data: { ...node.data, latency: backendNode.latency, status: backendNode.status },
          };
        })
      );
      
      // (Your existing edge update logic here)
       setEdges((eds) => 
        eds.map((edge) => {
           const targetNode = response.data.nodes.find(n => n.id === edge.target);
           const isHot = targetNode?.status === "Overloaded";
           return {
             ...edge,
             style: { 
               stroke: isHot ? '#ef4444' : '#444', 
               strokeWidth: isHot ? 3 : 2,
               opacity: isHot ? 1 : 0.5
             },
             animated: true
           }
        })
      );

    } catch (error) {
      console.error(error);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="app-container">
      {/* ... (Keep your existing Branding, Control Bar, and Stats code here) ... */}
      
      <div className="brand-fixed">
        <Activity size={20} className="text-accent" />
        <span className="tracking-wider">SCALELAB</span>
        <span className="badge">PRO</span>
      </div>

       <div className="control-bar">
        <div className="input-group">
          <label>TRAFFIC</label>
          <input 
            type="range" min="1000" max="50000" step="1000" 
            value={traffic} 
            onChange={(e) => setTraffic(Number(e.target.value))} 
          />
          <span className="value-display">{traffic.toLocaleString()} <span className="unit">RPS</span></span>
        </div>
        <div className="sep"></div>
        <button onClick={simulate} disabled={isSimulating}>
          {isSimulating ? <div className="spinner"></div> : <Play size={18} fill="currentColor" />}
          <span>RUN TEST</span>
        </button>
      </div>

      {result && (
        <div className="stats-fixed">
          <div className="stat-item">
            <span className="label">GLOBAL LATENCY</span>
            <span className="val">{result.total_latency.toFixed(2)}ms</span>
          </div>
          <div className="stat-item">
            <span className="label">DB LOAD</span>
            <span className="val">{result.db_traffic.toFixed(0)} rps</span>
          </div>
          <div className="stat-item">
            <span className="label">SYSTEM STATUS</span>
            <span className={`val status-${result.system_status === "Unstable" ? "bad" : "good"}`}>
              {result.system_status}
            </span>
          </div>
        </div>
      )}

      <ReactFlow 
        nodes={nodes} edges={edges} nodeTypes={nodeTypes}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333" gap={30} size={1} variant="dots" />
        <Controls showInteractive={false} className="minimal-controls"/>
      </ReactFlow>
    </div>
  );
}

export default App;