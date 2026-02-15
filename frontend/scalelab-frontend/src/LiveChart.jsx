import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const LiveChart = ({ data }) => {
  // Safety check: If data is missing or empty, render nothing
  if (!data || !Array.isArray(data)) return null;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <span className="chart-title">REAL-TIME LATENCY</span>
        <div className="live-indicator">
          <span className="blink-dot"></span> LIVE
        </div>
      </div>
      
      {/* FIX: We removed ResponsiveContainer to prevent the crash.
         We are using fixed dimensions (width={250}) which is safer.
      */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <AreaChart 
          width={250} 
          height={100} 
          data={data}
        >
          <defs>
            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis hide domain={[0, 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '4px' }}
            itemStyle={{ color: '#00f0ff', fontFamily: 'monospace', fontSize: '12px' }}
            labelStyle={{ display: 'none' }}
            formatter={(value) => [`${value} ms`, 'Latency']}
            cursor={{ stroke: '#333', strokeWidth: 1 }}
          />
          <Area 
            type="monotone" 
            dataKey="latency" 
            stroke="#00f0ff" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorLatency)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </div>
    </div>
  );
};

export default LiveChart;