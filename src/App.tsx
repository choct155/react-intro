import React, { useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { DISTRIBUTIONS, Distribution, computePoints } from "./distributions";
import "./App.css";

// --- Param Slider ---
type ParamSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
};

function ParamSlider({ label, value, min, max, step, onChange }: ParamSliderProps) {
  return (
    <div className="param-row">
      <div className="param-header">
        <span className="param-label">{label}</span>
        <span className="param-value">{value.toFixed(step < 0.1 ? 3 : step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="param-slider"
      />
      <div className="param-range">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// --- Distribution Selector ---
type SelectorProps = {
  selected: string;
  onSelect: (name: string) => void;
};

const CONTINUOUS = DISTRIBUTIONS.filter((d) => d.kind === "continuous");
const DISCRETE = DISTRIBUTIONS.filter((d) => d.kind === "discrete");

function DistributionSelector({ selected, onSelect }: SelectorProps) {
  return (
    <div className="selector-section">
      <div className="selector-group">
        <div className="selector-group-label">Continuous</div>
        <div className="selector-chips">
          {CONTINUOUS.map((d) => (
            <button
              key={d.name}
              className={`chip ${selected === d.name ? "chip-active" : ""}`}
              onClick={() => onSelect(d.name)}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>
      <div className="selector-group">
        <div className="selector-group-label">Discrete</div>
        <div className="selector-chips">
          {DISCRETE.map((d) => (
            <button
              key={d.name}
              className={`chip ${selected === d.name ? "chip-active" : ""}`}
              onClick={() => onSelect(d.name)}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Custom Tooltip ---
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const { x, y } = payload[0].payload;
  return (
    <div className="tooltip-box">
      <div>x = {typeof x === "number" ? x.toFixed(3) : x}</div>
      <div>p = {typeof y === "number" ? y.toFixed(5) : y}</div>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [selectedName, setSelectedName] = useState<string>("Beta");
  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [showSelector, setShowSelector] = useState(false);

  const dist: Distribution = DISTRIBUTIONS.find((d) => d.name === selectedName)!;

  // Initialize params when distribution changes
  const getParams = useCallback(
    (d: Distribution): number[] =>
      d.params.map((p) => paramValues[`${d.name}__${p.name}`] ?? p.default),
    [paramValues]
  );

  const params = getParams(dist);

  const handleParamChange = (paramName: string, value: number) => {
    setParamValues((prev) => ({ ...prev, [`${dist.name}__${paramName}`]: value }));
  };

  const handleSelectDist = (name: string) => {
    setSelectedName(name);
    setShowSelector(false);
  };

  const points = useMemo(() => {
    try {
      return computePoints(dist, params);
    } catch {
      return [];
    }
  }, [dist, params]);

  // Stats
  const stats = useMemo(() => {
    if (points.length === 0) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const maxY = Math.max(...ys);
    const modeX = xs[ys.indexOf(maxY)];
    return { maxY, modeX };
  }, [points]);

  const paramLabel = dist.params
    .map((p, i) => {
      const v = params[i];
      return `${p.name}=${v % 1 === 0 ? v : v.toFixed(2)}`;
    })
    .join(", ");

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
          <span className="header-dist-name">{dist.name}</span>
          <span className="header-params">({paramLabel})</span>
        </div>
        <button className="header-change-btn" onClick={() => setShowSelector((v) => !v)}>
          {showSelector ? "Done" : "Change"}
        </button>
      </header>

      {showSelector && (
        <DistributionSelector selected={selectedName} onSelect={handleSelectDist} />
      )}

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={260}>
          {dist.kind === "continuous" ? (
            <AreaChart data={points} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPdf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="x"
                type="number"
                domain={["auto", "auto"]}
                tickFormatter={(v) => parseFloat(v.toFixed(2)).toString()}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              {stats && (
                <ReferenceLine
                  x={stats.modeX}
                  stroke="#f59e0b"
                  strokeDasharray="4 2"
                  label={{ value: "mode", position: "top", fontSize: 10, fill: "#f59e0b" }}
                />
              )}
              <Area
                type="monotone"
                dataKey="y"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorPdf)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <BarChart data={points} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="x" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="y"
                fill="#6366f1"
                opacity={0.85}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
        <div className="chart-ylabel">
          {dist.kind === "discrete" ? "P(X = x)" : "f(x)"}
        </div>
      </div>

      <div className="description-box">
        <span className="dist-kind-badge">{dist.kind}</span>
        {dist.description}
      </div>

      <div className="params-section">
        <div className="params-title">Parameters</div>
        {dist.params.map((p, i) => (
          <ParamSlider
            key={p.name}
            label={p.label}
            value={params[i]}
            min={p.min}
            max={p.max}
            step={p.step}
            onChange={(v) => handleParamChange(p.name, v)}
          />
        ))}
      </div>
    </div>
  );
}
