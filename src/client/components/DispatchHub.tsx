import React, { useEffect, useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  Sliders,
  TrendingDown,
  Truck,
  Plane,
  Coins,
  ChevronRight,
  ListFilter,
  Eye,
  Info,
  Calendar,
  Sparkles,
  Save,
  Trash2,
  FolderOpen,
  Map,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  DollarSign,
  Leaf,
  Terminal,
  MessageSquare,
  ShieldAlert,
  SlidersHorizontal,
  Flame,
  FileText
} from "lucide-react";
import type {
  Station,
  SimulationResult,
  ReasoningReport,
  RouteSimulationResult,
  Package,
  ProductType,
  WeatherType
} from "../../shared/dispatchTypes";
import { simulateDispatch } from "../../domain/dispatchEngine";

// Helper to format minutes from 08:00 AM to a nice string
function formatMinutesToTime(min: number): string {
  const baseHour = 8;
  const totalMinutes = baseHour * 60 + min;
  const hour24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = Math.floor(totalMinutes % 60);
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

const PRODUCT_LABELS: Record<ProductType, string> = {
  EXPRESS_PO: "Priority Overnight",
  MEDICAL_SO: "Healthcare Express",
  EXPRESS_SO: "Standard Overnight",
  GROUND_COMMERCIAL: "Ground Commercial",
  HOME_DELIVERY: "Home Delivery",
  ECONOMY_GROUND: "Economy Ground"
};

const PRODUCT_DEADLINES: Record<ProductType, number> = {
  EXPRESS_PO: 240, 
  MEDICAL_SO: 420, 
  EXPRESS_SO: 500, 
  GROUND_COMMERCIAL: 600, 
  HOME_DELIVERY: 600,
  ECONOMY_GROUND: 600
};

interface SavedPlan {
  id: string;
  name: string;
  stationId: string;
  dispatchTimeMin: number;
  selectiveRouteHoldsCount: number;
  optimizerMode: string;
  weather: WeatherType;
  penalty: number;
  onTimeRate: number;
  customEtas: Record<string, number>;
  selectiveRouteHolds: Record<string, number>;
}

interface TerminalLog {
  id: string;
  time: string;
  type: "system" | "autopilot" | "deploy";
  text: string;
}

interface DebateMessage {
  sender: "Gemini 2.5 Flash" | "GLM 5.2 (OS)" | "Corporate Midwit Manager";
  text: string;
  round: number;
  auraImpact: number;
  auraCaption: string;
}

export default function DispatchHub() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState("MEM-A");
  const [dispatchTimeMin, setDispatchTimeMin] = useState(60); 
  const [selectiveRouteHolds, setSelectiveRouteHolds] = useState<Record<string, number>>({});
  const [customEtas, setCustomEtas] = useState<Record<string, number>>({});
  const [optimizerMode, setOptimizerMode] = useState<"MIN_PENALTY" | "MAX_ON_TIME" | "EXPRESS_ONLY">("MIN_PENALTY");
  const [weather, setWeather] = useState<WeatherType>("CLEAR");
  const [inspectedRouteId, setInspectedRouteId] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);

  // Saved Plans state
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [planNameInput, setPlanNameInput] = useState("");

  const [aiReports, setAiReports] = useState<ReasoningReport[]>([]);
  const [selectedModel, setSelectedModel] = useState("GLM 5.2");
  
  // Live Simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [simTime, setSimTime] = useState(0); 
  
  // Autopilot Solver & Terminal state
  const [isAutopilotSolving, setIsAutopilotSolving] = useState(false);
  const [autopilotToast, setAutopilotToast] = useState<{ message: string; savings: number } | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);

  // LLM Debate & Aura state
  const [isDebating, setIsDebating] = useState(false);
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([]);
  const [activeDebateRound, setActiveDebateRound] = useState(0);
  const [midwitAura, setMidwitAura] = useState(100);
  const [auraLossLog, setAuraLossLog] = useState<string[]>([]);

  // Custom JS Heuristic Compiler state
  const [compiledHeuristic, setCompiledHeuristic] = useState<((stops: any[]) => any[]) | null>(null);
  const [heuristicCode, setHeuristicCode] = useState(
    `// Write your custom stops prioritization heuristic!\n// 'stops' is an array of objects: { stopNum, pkgs, maxWeight, pkgCount, minDeadline }\n// Return the sorted stops array.\n\n// Default Heuristic: Sort by maxWeight descending (priority overnight first)\nreturn stops.sort((a, b) => b.maxWeight - a.maxWeight);`
  );
  const [compilerError, setCompilerError] = useState<string | null>(null);
  const [compilerSuccess, setCompilerSuccess] = useState(false);

  // Satirical Slideshow modal state
  const [showPptModal, setShowPptModal] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Fetch stations on mount
  useEffect(() => {
    fetch("/api/dispatch/stations")
      .then((res) => res.json())
      .then((data) => {
        setStations(data.stations);
        if (data.stations.length > 0) {
          setSelectedStationId(data.stations[0].id);
        }
      })
      .catch((err) => console.error("Error loading stations", err));
  }, []);

  const currentStation = useMemo(() => {
    return stations.find((s) => s.id === selectedStationId) ?? null;
  }, [stations, selectedStationId]);

  // Execute simulation locally on client for 0ms network latency and code injection support
  const simResult = useMemo(() => {
    if (!selectedStationId) return null;
    try {
      return simulateDispatch(
        selectedStationId,
        dispatchTimeMin,
        selectiveRouteHolds,
        customEtas,
        optimizerMode,
        weather,
        compiledHeuristic || undefined
      );
    } catch (err) {
      console.error("Local simulation run failed", err);
      return null;
    }
  }, [selectedStationId, dispatchTimeMin, selectiveRouteHolds, customEtas, optimizerMode, weather, compiledHeuristic]);

  // Reset inputs when station changes
  useEffect(() => {
    if (currentStation) {
      setDispatchTimeMin(currentStation.normalStartMin);
      setSelectiveRouteHolds({});
      setCustomEtas({});
      setWeather("CLEAR");
      setInspectedRouteId(null);
      setHoveredRouteId(null);
      setIsPlaying(false);
      setSimTime(0);
      setAutopilotToast(null);
      setMidwitAura(100);
      setAuraLossLog([]);
      setCompiledHeuristic(null);
      setCompilerSuccess(false);
      setCompilerError(null);
      setTerminalLogs([
        {
          id: "1",
          time: new Date().toLocaleTimeString(),
          type: "system",
          text: `Initialized Sort Edge telemetry on Node ${selectedStationId}. Standing by.`
        }
      ]);
      setDebateMessages([]);
      setActiveDebateRound(0);
      setIsDebating(false);
    }
  }, [selectedStationId, currentStation]);

  // Fetch AI reasoning whenever simulation changes
  useEffect(() => {
    if (!selectedStationId) return;
    fetch("/api/dispatch/ai-reasoning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationId: selectedStationId,
        dispatchTimeMin,
        selectiveRouteHolds,
        customEtas,
        optimizerMode,
        weather
      })
    })
      .then((res) => res.json())
      .then((data: { reports: ReasoningReport[] }) => {
        setAiReports(data.reports);
      })
      .catch((err) => console.error("AI reasoning load failed", err));
  }, [selectedStationId, dispatchTimeMin, selectiveRouteHolds, customEtas, optimizerMode, weather]);

  // Timer loop for visual simulator
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSimTime((prev) => {
          const maxTime = currentStation?.rtbMin ?? 600;
          if (prev >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return prev + 5; 
        });
      }, 80);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStation]);

  const activeReport = useMemo(() => {
    return aiReports.find((r) => r.modelName.includes(selectedModel)) ?? null;
  }, [aiReports, selectedModel]);

  // Generate SVG Chart Data points
  const chartPoints = useMemo(() => {
    if (!currentStation) return [];
    const points = [];
    const minHold = 30;
    const maxHold = 180;
    
    let weatherEtaDelay = 0;
    let weatherRateMultiplier = 1.0;
    if (weather === "RAIN") {
      weatherEtaDelay = 15;
      weatherRateMultiplier = 0.9;
    } else if (weather === "SNOW") {
      weatherEtaDelay = 30;
      weatherRateMultiplier = 0.8;
    } else if (weather === "THUNDERSTORM") {
      weatherEtaDelay = 45;
      weatherRateMultiplier = 0.7;
    }

    const getConveyanceEta = (id: string, defaultEta: number) => {
      return (customEtas[id] !== undefined ? customEtas[id] : defaultEta) + weatherEtaDelay;
    };

    for (let t = minHold; t <= maxHold; t += 5) {
      let lbPenalty = 0;
      let capPenalty = 0;

      if (selectedStationId === "MEM-A") {
        const fx88 = getConveyanceEta("FX-88", 75);
        const tr124 = getConveyanceEta("TR-124", 100);
        const ra03 = getConveyanceEta("RA-03", 135);

        if (t < fx88 + 15) lbPenalty += 100 * 10 + 80 * 8; 
        if (t < tr124 + 15) lbPenalty += 50 * 16 + 20 * 32; 
        if (t < ra03 + 15) lbPenalty += 10 * 80 + 5 * 120; 

        const holdDiff = Math.max(0, t - 60);
        capPenalty += Math.round(Math.pow(holdDiff / 10, 1.9) * 12 * (2.0 - weatherRateMultiplier));
      } else {
        const fx202 = getConveyanceEta("FX-202", 45);
        const tr505 = getConveyanceEta("TR-505", 75);

        if (t < fx202 + 15) lbPenalty += 100 * 8 + 80 * 4; 
        if (t < tr505 + 15) lbPenalty += 50 * 8 + 20 * 16; 

        const holdDiff = Math.max(0, t - 30);
        capPenalty += Math.round(Math.pow(holdDiff / 10, 2.1) * 15 * (2.0 - weatherRateMultiplier));
      }

      points.push({
        x: t,
        lb: lbPenalty,
        cap: capPenalty,
        total: lbPenalty + capPenalty
      });
    }
    return points;
  }, [selectedStationId, currentStation, customEtas, weather]);

  const maxVal = useMemo(() => {
    if (chartPoints.length === 0) return 100;
    return Math.max(...chartPoints.map((p) => Math.max(p.lb, p.cap, p.total)));
  }, [chartPoints]);

  const optimalHoldTime = useMemo(() => {
    if (chartPoints.length === 0) return 60;
    let minT = 60;
    let minP = Infinity;
    chartPoints.forEach((p) => {
      if (p.total < minP) {
        minP = p.total;
        minT = p.x;
      }
    });
    return minT;
  }, [chartPoints]);

  const getConveyanceStatus = (id: string, defaultEta: number) => {
    let weatherEtaDelay = 0;
    if (weather === "RAIN") weatherEtaDelay = 15;
    else if (weather === "SNOW") weatherEtaDelay = 30;
    else if (weather === "THUNDERSTORM") weatherEtaDelay = 45;

    const rawEta = customEtas[id] !== undefined ? customEtas[id] : defaultEta;
    const eta = rawEta + weatherEtaDelay;
    const readyTime = eta + 15;
    const isLoaded = dispatchTimeMin >= readyTime;
    return {
      rawEta,
      eta,
      readyTime,
      isLoaded,
      label: isLoaded ? "Processed & Loaded" : `Left Behind (needs ${formatMinutesToTime(readyTime)})`
    };
  };

  const handleRouteHoldToggle = (routeId: string) => {
    if (!currentStation) return;
    setSelectiveRouteHolds((prev) => {
      const copy = { ...prev };
      if (copy[routeId]) {
        delete copy[routeId];
      } else {
        const flightEta = selectedStationId === "MEM-A" 
          ? (customEtas["FX-88"] !== undefined ? customEtas["FX-88"] : 75)
          : (customEtas["FX-202"] !== undefined ? customEtas["FX-202"] : 45);
        
        let weatherDelay = 0;
        if (weather === "RAIN") weatherDelay = 15;
        else if (weather === "SNOW") weatherDelay = 30;
        else if (weather === "THUNDERSTORM") weatherDelay = 45;

        copy[routeId] = flightEta + weatherDelay + 15;
      }
      return copy;
    });
  };

  const handleEtaChange = (id: string, val: number) => {
    setCustomEtas((prev) => ({
      ...prev,
      [id]: val
    }));
  };

  const resetAllHolds = () => {
    setSelectiveRouteHolds({});
    setCustomEtas({});
    setWeather("CLEAR");
    setInspectedRouteId(null);
    setHoveredRouteId(null);
    setOptimizerMode("MIN_PENALTY");
    setAutopilotToast(null);
    setTerminalLogs([]);
    setDebateMessages([]);
    setActiveDebateRound(0);
    setMidwitAura(100);
    setAuraLossLog([]);
    setCompiledHeuristic(null);
    setCompilerSuccess(false);
    setCompilerError(null);
    if (currentStation) {
      setDispatchTimeMin(currentStation.normalStartMin);
    }
  };

  // Compile custom JavaScript heuristic sorting logic locally
  const compileCustomHeuristic = () => {
    try {
      setCompilerError(null);
      setCompilerSuccess(false);

      const compiledFn = new Function("stops", heuristicCode) as (stops: any[]) => any[];

      // Dry run compilation with mock stops to verify it compiles and runs without crash
      const mockStops = [
        { stopNum: 1, pkgs: [], maxWeight: 100, pkgCount: 1, minDeadline: 240 },
        { stopNum: 2, pkgs: [], maxWeight: 50, pkgCount: 2, minDeadline: 500 }
      ];
      
      const testRun = compiledFn(mockStops);
      if (!Array.isArray(testRun)) {
        throw new Error("Heuristic must return an array of sorted stops.");
      }

      setCompiledHeuristic(() => compiledFn);
      setCompilerSuccess(true);

      if (heuristicCode.includes("random")) {
        setMidwitAura((prev) => Math.max(-10000, prev - 8000));
        setAuraLossLog((prev) => [...prev, "Compiled Random/Midwit heuristic: -8,000 Aura 💀"]);
      } else {
        setTerminalLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            time: new Date().toLocaleTimeString(),
            type: "autopilot",
            text: "⚙️ Custom sorting heuristic compiled successfully and injected into simulator."
          }
        ]);
      }
    } catch (err) {
      setCompilerError(err instanceof Error ? err.message : "Compilation failed");
    }
  };

  // Autopilot Solver trigger with live terminal console output
  const engageAutopilot = () => {
    setIsAutopilotSolving(true);
    setAutopilotToast(null);
    setTerminalLogs([]);

    const logSteps = [
      { time: 100, type: "system", text: "📡 Pinging MEM-A regional sort coordinator..." },
      { time: 200, type: "system", text: "🧮 Initializing Operations Research heuristic solver..." },
      { time: 350, type: "autopilot", text: `🔍 Evaluating 6,561 release configurations under weather [${weather}] and optimizer [${optimizerMode}]...` },
      { time: 480, type: "autopilot", text: "🎯 Optimal dispatch time & selective hold mappings discovered (Cost minimized)." },
      { time: 580, type: "deploy", text: "⚡ Deploying release commands to onboard driver route sheet terminals..." }
    ];

    logSteps.forEach((step) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            time: new Date().toLocaleTimeString(),
            type: step.type as any,
            text: step.text
          }
        ]);
      }, step.time);
    });

    setTimeout(() => {
      fetch("/api/dispatch/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: selectedStationId,
          customEtas,
          optimizerMode,
          weather
        })
      })
        .then((res) => res.json())
        .then((data: { dispatchTimeMin: number; selectiveRouteHolds: Record<string, number>; savingsUsd: number }) => {
          setDispatchTimeMin(data.dispatchTimeMin);
          setSelectiveRouteHolds(data.selectiveRouteHolds);
          setIsAutopilotSolving(false);
          
          setTerminalLogs((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              time: new Date().toLocaleTimeString(),
              type: "deploy",
              text: `✅ Configuration deployed successfully. Release releaseTime: ${formatMinutesToTime(data.dispatchTimeMin)}. Total holds: ${Object.keys(data.selectiveRouteHolds).length} routes.`
            }
          ]);

          if (data.savingsUsd > 0) {
            setAutopilotToast({
              message: `AI Autopilot locked in optimal plan. Release at ${formatMinutesToTime(data.dispatchTimeMin)} with ${Object.keys(data.selectiveRouteHolds).length} route-level holds.`,
              savings: data.savingsUsd
            });
          } else {
            setAutopilotToast({
              message: `AI Autopilot: Baseline start is already optimal for this scenario.`,
              savings: 0
            });
          }
        })
        .catch((err) => {
          console.error("Autopilot solving failed", err);
          setIsAutopilotSolving(false);
        });
    }, 600);
  };

  // Live Bureaucracy Debate triggers with real-time Aura deductions
  const triggerDebateArena = () => {
    if (isDebating) return;
    setIsDebating(true);
    setDebateMessages([]);
    setMidwitAura(100);
    setAuraLossLog([]);
    setActiveDebateRound(1);

    const rounds = [
      {
        delay: 400,
        sender: "Corporate Midwit Manager",
        text: "🚨 Hold on guys. We cannot just release standard routes selectively without a Steering Committee alignment call. I propose we organize a cross-functional alignment session next Tuesday to build a RACI matrix and check if this complies with our multi-year agile roadmap.",
        round: 1,
        auraImpact: 0,
        auraCaption: "Proposed a Steering Committee: -50 Aura"
      },
      {
        delay: 2000,
        sender: "Gemini 2.5 Flash",
        text: "📊 Analysis: Standing idle wages are $32.50/hr per vehicle. Station-wide holds are financially inefficient, costing $1,450 in extra labor. Deploying selective route holds instantly protects SLA scores while containing costs to $120. Steering committee alignment incurs a 5-day delay ($14,200 loss).",
        round: 1,
        auraImpact: -50,
        auraCaption: "Math shut down alignment logic: -1,500 Aura"
      },
      {
        delay: 4000,
        sender: "GLM 5.2 (OS)",
        text: "⚡ Local Heuristic Solver output: Optimal release plan computed in 4.2ms. Holds applied on high-priority Express routes only. Driver telemetry updated. Midwit input flagged as high-risk overhead and routed to background archive to protect sorting metrics.",
        round: 1,
        auraImpact: -450,
        auraCaption: "Solver bypassed stakeholder consensus: -5,000 Aura"
      },
      {
        delay: 6000,
        sender: "Corporate Midwit Manager",
        text: "🤯 Wait, did you push this configuration straight to production?! Has HR approved this workload shift? What about our quarterly OKRs? I suggest we schedule a weekly 30-minute sync to discuss risk frameworks and draft a PowerPoint deck for the directors.",
        round: 2,
        auraImpact: 0,
        auraCaption: "Suggested a PowerPoint deck sync: -1,000 Aura"
      },
      {
        delay: 8000,
        sender: "GLM 5.2 (OS)",
        text: "🤖 Deploy completed. Standard routes dispatched. Priority routes held for late flight arrival. Realized net savings: $1,680. Carbon footprint minimized. Steering committee meeting declined automatically by solver bot.",
        round: 2,
        auraImpact: -500,
        auraCaption: "Autopilot solver automatically declined the sync call: -9,999 Aura 💀"
      }
    ];

    rounds.forEach((msg) => {
      setTimeout(() => {
        setDebateMessages((prev) => [...prev, { 
          sender: msg.sender as any, 
          text: msg.text, 
          round: msg.round,
          auraImpact: msg.auraImpact,
          auraCaption: msg.auraCaption
        }]);
        setActiveDebateRound(msg.round);

        if (msg.auraImpact < 0) {
          setMidwitAura((prev) => Math.max(-10000, prev + msg.auraImpact * 18));
          setAuraLossLog((prev) => [...prev, msg.auraCaption]);
        }

        if (msg.round === 2 && msg.sender.includes("GLM")) {
          setIsDebating(false);
        }
      }, msg.delay);
    });
  };

  // Plan comparison functions
  const savePlanDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simResult) return;
    const name = planNameInput.trim() || `Plan Draft #${savedPlans.length + 1}`;
    const newPlan: SavedPlan = {
      id: Math.random().toString(36).substring(4, 9).toUpperCase(),
      name,
      stationId: selectedStationId,
      dispatchTimeMin,
      selectiveRouteHoldsCount: Object.keys(selectiveRouteHolds).length,
      optimizerMode,
      weather,
      penalty: simResult.totalPenalty,
      onTimeRate: simResult.onTimeRate,
      customEtas: { ...customEtas },
      selectiveRouteHolds: { ...selectiveRouteHolds }
    };
    setSavedPlans((prev) => [...prev, newPlan]);
    setPlanNameInput("");
  };

  const loadPlanDraft = (plan: SavedPlan) => {
    setSelectedStationId(plan.stationId);
    setDispatchTimeMin(plan.dispatchTimeMin);
    setSelectiveRouteHolds(plan.selectiveRouteHolds);
    setCustomEtas(plan.customEtas);
    setOptimizerMode(plan.optimizerMode as any);
    if (plan.weather) setWeather(plan.weather);
  };

  const deletePlanDraft = (id: string) => {
    setSavedPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const inspectedRouteResult = useMemo(() => {
    if (!inspectedRouteId || !simResult) return null;
    return simResult.routes.find((r) => r.routeId === inspectedRouteId) ?? null;
  }, [inspectedRouteId, simResult]);

  // Satirical PowerPoint Slide Deck contents
  const pptSlides = [
    {
      title: "Holistic Synergy & Steering Governance",
      subtitle: "Bypassing Autopilot Solvers for Cross-Functional Risk Minimization",
      points: [
        "Objective: Minimize accountability by maximizing stakeholder alignment.",
        "Operational Risk: High-frequency local solver code executes in 4.2ms without direct committee oversight.",
        "Strategic Pivot: Delay all sort decisions until next Fiscal Year to allow comprehensive steering review."
      ],
      diagram: "RACI MATRIX (12 Members Consulted, 0 Accountable)"
    },
    {
      title: "RACI Fleet Release Matrix",
      subtitle: "Aligning Roles and Responsibilities for Simple Sorting Releases",
      table: [
        { role: "Project Sponsor", action: "Consulted", impact: "No Decision Authority" },
        { role: "Agile Scrum Master", action: "Consulted", impact: "Maintains Jira Tickets" },
        { role: "Onboard Fleet Driver", action: "Informed", impact: "Executes Held Releases" },
        { role: "Steering Committee", action: "Accountable (18 members)", impact: "Requires 100% Consensus" }
      ],
      diagram: "Total Alignment Time: 45 Days"
    },
    {
      title: "Proposed 12-Month Pilot Roadmap",
      subtitle: "Validating Labor Overhead via Low-Impact Multi-Quarter Trials",
      points: [
        "Q1-Q2: Weekly alignment meetings to agree on weather definition parameters.",
        "Q3: PowerPoint deck formatting alignments (color themes, logo placements).",
        "Q4: Steering committee sign-off on running a 1-day pilot run in Q4 2027.",
        "Postponement Plan: Re-evaluate solver in FY28 if budget is approved."
      ],
      diagram: "Strategic Target: Zero Fleet Movement"
    },
    {
      title: "Cost Analysis: Alignment vs Heuristic Code",
      subtitle: "Auditing Decision Overhead Expenses",
      table: [
        { item: "weekly 12-person Sync", cost: "$1,200 / hour", result: "0 Actions Taken" },
        { item: "PowerPoint Deck revisions", cost: "$4,500", result: "12 Slides Created" },
        { item: "Autopilot Local Solver", cost: "$0.0006 (4ms)", result: "Optimal Plan Deployed" }
      ],
      diagram: "Autopilot Saved $1,680/day; Corporate Sync Lost $5,700/week"
    },
    {
      title: "Key Takeaways & Core Beliefs",
      subtitle: "Guiding Principles for Fleet Management",
      points: [
        "1. Never use a local code file when a weekly alignment meeting can be scheduled.",
        "2. RACI matrices must be structured so that no individual is ever responsible.",
        "3. An optimal dispatch decision deployed instantly is a threat to governance.",
        "4. Aura loss is temporary; steering committee minutes are forever."
      ],
      diagram: "Governing Slogan: 'Align Early, Align Often, Delay Constantly'"
    }
  ];

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % pptSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + pptSlides.length) % pptSlides.length);
  };

  const runsPerYearScale = 1200 * 180 * 365; 
  const geminiCostPerYear = runsPerYearScale * 0.0125;
  const glmCostPerYear = runsPerYearScale * 0.0027;
  const savingsPerYear = geminiCostPerYear - glmCostPerYear;

  const mapRoutes = useMemo(() => {
    if (selectedStationId === "MEM-A") {
      return [
        { id: "101", d: "M 150 110 C 130 90, 100 120, 90 140", color: "#4f46e5", label: "Downtown Loop" },
        { id: "102", d: "M 150 110 C 160 70, 200 60, 240 70", color: "#06b6d4", label: "Suburbs North" },
        { id: "103", d: "M 150 110 C 200 120, 230 150, 260 180", color: "#f59e0b", label: "Industrial East" },
        { id: "104", d: "M 150 110 C 110 80, 80 70, 50 90", color: "#ec4899", label: "West Heights" },
        { id: "105", d: "M 150 110 C 120 150, 100 180, 70 210", color: "#10b981", label: "Airport Corridor" },
        { id: "106", d: "M 150 110 C 180 140, 200 180, 210 210", color: "#8b5cf6", label: "South Valley" },
        { id: "107", d: "M 150 110 C 180 90, 210 110, 230 130", color: "#3b82f6", label: "Metro Center" },
        { id: "108", d: "M 150 110 C 90 100, 60 130, 40 160", color: "#6366f1", label: "East Foothills" }
      ];
    } else {
      return [
        { id: "201", d: "M 150 110 C 120 70, 80 80, 60 100", color: "#4f46e5", label: "Cherry Creek" },
        { id: "202", d: "M 150 110 C 180 60, 230 70, 250 110", color: "#06b6d4", label: "Boulder Express" },
        { id: "203", d: "M 150 110 C 180 140, 220 160, 240 190", color: "#f59e0b", label: "Golden Foothills" },
        { id: "204", d: "M 150 110 C 100 130, 80 160, 60 180", color: "#ec4899", label: "Aurora West" }
      ];
    }
  }, [selectedStationId]);

  return (
    <div className="dispatch-container">
      {/* Autopilot solver toast */}
      {autopilotToast && (
        <div className="autopilot-toast animate-slideDown">
          <div className="toast-content">
            <CheckCircle size={16} className="text-success" />
            <div>
              <strong>{autopilotToast.message}</strong>
              {autopilotToast.savings > 0 && (
                <span className="toast-savings">
                  Net Savings realized: <strong>+${autopilotToast.savings.toLocaleString()} USD</strong>
                </span>
              )}
            </div>
          </div>
          <button className="close-toast-btn" onClick={() => setAutopilotToast(null)}>×</button>
        </div>
      )}

      {/* Satirical PowerPoint Slide Deck Modal */}
      {showPptModal && (
        <div className="ppt-modal-overlay">
          <div className="ppt-modal-box">
            <div className="ppt-modal-header">
              <span className="ppt-tag">Steering Committee Slide Deck</span>
              <button className="close-ppt-btn" onClick={() => setShowPptModal(false)}>×</button>
            </div>
            
            <div className="ppt-slide-body">
              <div className="slide-content">
                <h2>{pptSlides[currentSlideIndex].title}</h2>
                <p className="slide-subtitle">{pptSlides[currentSlideIndex].subtitle}</p>
                
                {/* Points list if present */}
                {pptSlides[currentSlideIndex].points && (
                  <ul className="slide-points">
                    {pptSlides[currentSlideIndex].points.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                )}

                {/* Table if present */}
                {pptSlides[currentSlideIndex].table && (
                  <table className="slide-table">
                    <thead>
                      <tr>
                        <th>Role/Item</th>
                        <th>Responsibility/Cost</th>
                        <th>Deliverable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pptSlides[currentSlideIndex].table.map((row, i) => (
                        <tr key={i}>
                          <td><strong>{(row as any).role || (row as any).item}</strong></td>
                          <td>{(row as any).action || (row as any).cost}</td>
                          <td>{(row as any).impact || (row as any).result}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="slide-diagram-box">
                  {pptSlides[currentSlideIndex].diagram}
                </div>
              </div>
            </div>

            <div className="ppt-modal-footer">
              <button onClick={handlePrevSlide} className="slide-nav-btn">Previous</button>
              <span>Slide {currentSlideIndex + 1} of {pptSlides.length}</span>
              <button onClick={handleNextSlide} className="slide-nav-btn">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Upper Navigation & Station Selector */}
      <header className="dispatch-header">
        <div>
          <p className="eyebrow">Sort Manager Decision Room</p>
          <h2>Fleet Dispatch Optimizer</h2>
        </div>
        <div className="station-selectors-container">
          <div className="weather-selector-group">
            <button
              className={weather === "CLEAR" ? "weather-btn active" : "weather-btn"}
              onClick={() => setWeather("CLEAR")}
              title="Clear Weather"
            >
              <Sun size={15} />
            </button>
            <button
              className={weather === "RAIN" ? "weather-btn active" : "weather-btn"}
              onClick={() => setWeather("RAIN")}
              title="Rainy Conditions (-10% speed, +15m ETA)"
            >
              <CloudRain size={15} />
            </button>
            <button
              className={weather === "SNOW" ? "weather-btn active" : "weather-btn"}
              onClick={() => setWeather("SNOW")}
              title="Snow / Ice (-20% speed, +30m ETA)"
            >
              <CloudSnow size={15} />
            </button>
            <button
              className={weather === "THUNDERSTORM" ? "weather-btn active" : "weather-btn"}
              onClick={() => setWeather("THUNDERSTORM")}
              title="Severe Storms (-30% speed, +45m ETA)"
            >
              <CloudLightning size={15} />
            </button>
          </div>
          
          <div className="station-selector-group">
            {stations.map((st) => (
              <button
                key={st.id}
                className={selectedStationId === st.id ? "station-btn active" : "station-btn"}
                onClick={() => setSelectedStationId(st.id)}
              >
                {st.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Driver Prioritization Optimizer Segmented Button group */}
      <section className="dispatch-section optimizer-mode-card">
        <div className="heading-wrapper">
          <ListFilter size={18} />
          <p className="section-label font-bold">Driver Prioritization Strategy</p>
        </div>
        <div className="segmented optimizer-segmented-bar">
          <button
            className={optimizerMode === "MIN_PENALTY" ? "active" : ""}
            onClick={() => setOptimizerMode("MIN_PENALTY")}
          >
            Minimize Penalty Points (Service Weighted)
          </button>
          <button
            className={optimizerMode === "MAX_ON_TIME" ? "active" : ""}
            onClick={() => setOptimizerMode("MAX_ON_TIME")}
          >
            Maximize On-Time Stops (Stops Volume-first)
          </button>
          <button
            className={optimizerMode === "EXPRESS_ONLY" ? "active" : ""}
            onClick={() => setOptimizerMode("EXPRESS_ONLY")}
          >
            Express Priority Only (PO/Medical Protected)
          </button>
        </div>
        <p className="optimizer-explanation">
          {optimizerMode === "MIN_PENALTY" && "✔️ Sorts stops by value: Express PO (100) and Medical SO (80) delivered first. Ground/Economy fail if time runs out."}
          {optimizerMode === "MAX_ON_TIME" && "✔️ Sorts stops by package count: completes dense residential / multi-package stops first, delivering the maximum number of packages."}
          {optimizerMode === "EXPRESS_ONLY" && "✔️ Protects high-priority Express at all costs: stops without Express PO/Medical are pushed to the end, regardless of stops density."}
        </p>
      </section>

      {/* Main KPI metrics bar */}
      {simResult && (
        <section className="dispatch-kpi-grid">
          <div className="kpi-card">
            <span>Total Packages</span>
            <strong>{simResult.totalVolume}</strong>
            <small>Preload + Late Conveyance</small>
          </div>
          <div className="kpi-card error-themed">
            <span>Left Behind</span>
            <strong className={simResult.leftBehindCount > 0 ? "text-error" : ""}>
              {simResult.leftBehindCount}
            </strong>
            <small>Missed dispatch window</small>
          </div>
          <div className="kpi-card warning-themed">
            <span>Capacity Failures</span>
            <strong className={simResult.capacityFailedCount > 0 ? "text-warn" : ""}>
              {simResult.capacityFailedCount}
            </strong>
            <small>Driver ran out of time</small>
          </div>
          <div className="kpi-card orange-themed">
            <span>Commitment Late</span>
            <strong className={simResult.commitFailuresCount > 0 ? "text-warn" : ""}>
              {simResult.commitFailuresCount}
            </strong>
            <small>SLA Commitment failures</small>
          </div>
          <div className="kpi-card success-themed">
            <span>Service Protected</span>
            <strong className="text-success">{simResult.onTimeRate}%</strong>
            <small>On-time completion rate</small>
          </div>
          <div className="kpi-card score-themed">
            <span>Service Penalty Score</span>
            <strong className={simResult.totalPenalty > 400 ? "text-error" : "text-success"}>
              {simResult.totalPenalty}
            </strong>
            <small>Lower score is better</small>
          </div>
        </section>
      )}

      {/* Control Panels & Visualization */}
      <div className="dispatch-main-layout">
        
        {/* Left Side: General controls, sliders, and chart */}
        <div className="dispatch-controls-col">
          
          {/* Weather Warning Banner */}
          {weather !== "CLEAR" && (
            <div className="weather-warning-banner animate-pulse">
              <AlertTriangle size={16} />
              <span>
                {weather === "RAIN" && "☔ Moderate Rain delay active: -10% delivery speed, all plane/truck ETAs shifted +15m."}
                {weather === "SNOW" && "❄️ Severe Snow/Ice delay active: -20% delivery speed, all plane/truck ETAs shifted +30m."}
                {weather === "THUNDERSTORM" && "⚡ Thunderstorm warning: Flight delays +45m, ground speeds reduced by 30%."}
              </span>
            </div>
          )}

          <section className="dispatch-section">
            <div className="section-head-bar">
              <div className="heading-wrapper">
                <Sliders size={18} />
                <h3>Station Hold Time</h3>
              </div>
              <div className="header-actions-row">
                <button 
                  className={`autopilot-btn ${isAutopilotSolving ? "solving animate-pulse" : ""}`}
                  onClick={engageAutopilot}
                  disabled={isAutopilotSolving}
                >
                  <Sparkles size={13} />
                  {isAutopilotSolving ? "Solving Config..." : "Engage AI Solver Autopilot"}
                </button>
                <button className="text-btn" onClick={resetAllHolds}>
                  Reset
                </button>
              </div>
            </div>
            
            <div className="slider-wrapper">
              <div className="slider-labels">
                <span>08:30 AM</span>
                <span className="current-time-marker">
                  {formatMinutesToTime(dispatchTimeMin)}
                </span>
                <span>11:00 AM</span>
              </div>
              <input
                type="range"
                min="30"
                max="180"
                step="5"
                value={dispatchTimeMin}
                onChange={(e) => setDispatchTimeMin(Number(e.target.value))}
                className="dispatch-slider-bar"
              />
              <p className="slider-hint">
                Slide to adjust general dispatch time. Holding vehicles reduces on-road capacity by 15 stops/hour per vehicle.
              </p>
            </div>

            {/* Conveyance timeline list with dynamic ETA sliders */}
            {currentStation && (
              <div className="conveyance-timeline-box">
                <div className="heading-wrapper" style={{ marginBottom: 8 }}>
                  <Calendar size={15} />
                  <p className="section-label font-bold">Incoming Conveyances ETA Editor</p>
                </div>
                <div className="conveyance-list">
                  {currentStation.conveyances.map((c) => {
                    const status = getConveyanceStatus(c.id, c.etaMin);
                    return (
                      <div key={c.id} className={`conveyance-row-expanded ${status.isLoaded ? "loaded" : "left-behind"}`}>
                        <div className="conveyance-row-header">
                          <div className="conveyance-meta">
                            {c.type === "FLIGHT" ? <Plane size={16} /> : <Truck size={16} />}
                            <div>
                              <strong>{c.name}</strong>
                              <span>ETA: {formatMinutesToTime(status.eta)} (Sort ready: {formatMinutesToTime(status.readyTime)})</span>
                            </div>
                          </div>
                          <span className={`conveyance-status-pill ${status.isLoaded ? "loaded" : "left-behind"}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="conveyance-eta-slider-wrapper">
                          <label htmlFor={`eta-slider-${c.id}`} className="eta-slider-label">Adjust ETA: {formatMinutesToTime(status.eta)}</label>
                          <input
                            id={`eta-slider-${c.id}`}
                            type="range"
                            min={c.etaMin - 40}
                            max={c.etaMin + 60}
                            step="5"
                            value={status.rawEta}
                            onChange={(e) => handleEtaChange(c.id, Number(e.target.value))}
                            className="eta-slider-range"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Real-time Heuristic Code Compiler Sandbox */}
          <section className="dispatch-section compiler-sandbox-section">
            <div className="section-head-bar">
              <div className="heading-wrapper">
                <Terminal size={17} />
                <h3>Custom Heuristic Compiler Sandbox</h3>
              </div>
              <div className="compiler-template-picker">
                <select 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "opt") {
                      setHeuristicCode(`// Frontier Optimum: Sort by maximum weight (prioritizes Express PO / Medical)\nreturn stops.sort((a, b) => b.maxWeight - a.maxWeight);`);
                    } else if (val === "vol") {
                      setHeuristicCode(`// Volume density: Sort by stop package count (prioritizes dense residential)\nreturn stops.sort((a, b) => b.pkgCount - a.pkgCount);`);
                    } else if (val === "midwit") {
                      setHeuristicCode(`// Midwit alignment: Postpone prioritization to Steering Committee\n// Randomizes stops sequence while waiting for alignment synccalls\nreturn stops.sort(() => Math.random() - 0.5);`);
                    }
                  }}
                  className="template-select"
                >
                  <option value="opt">Template: Frontier Optimum (Min Penalty)</option>
                  <option value="vol">Template: Volume Density (Max Stops)</option>
                  <option value="midwit">Template: Midwit Randomizer (Alignment-first)</option>
                </select>
              </div>
            </div>

            <p className="routes-intro">
              Write live Javascript sorting algorithms to re-order the delivery schedule. Click **Compile & Hot-Reload** to execute the script in real-time on all routes.
            </p>

            <div className="code-editor-container">
              <textarea
                value={heuristicCode}
                onChange={(e) => setHeuristicCode(e.target.value)}
                className="code-editor-textarea"
                rows={8}
                spellCheck="false"
              />
            </div>

            <div className="compiler-actions-row">
              <button onClick={compileCustomHeuristic} className="compile-action-btn">
                <RefreshCw size={13} className="compiler-spin" />
                Compile & Hot-Reload Heuristic
              </button>
              
              {compilerSuccess && (
                <span className="compiler-badge success">
                  ● Ready: Code compiled & injected.
                </span>
              )}
              {compilerError && (
                <span className="compiler-badge error" title={compilerError}>
                  ● Compile Error: Check code syntax.
                </span>
              )}
            </div>

            {compilerError && (
              <pre className="compiler-error-trace">
                {compilerError}
              </pre>
            )}
          </section>

          {/* Autopilot Live Terminal Output Console */}
          {terminalLogs.length > 0 && (
            <section className="dispatch-section terminal-console-section">
              <div className="heading-wrapper">
                <Terminal size={17} />
                <span className="section-label font-bold text-gray">Sort Autopilot Terminal Console</span>
              </div>
              <div className="terminal-logs-window">
                {terminalLogs.map((log) => (
                  <div key={log.id} className={`terminal-log-line ${log.type}`}>
                    <span className="log-timestamp">[{log.time}]</span>
                    <span className="log-message"> {log.text}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Real-time Financial & Environmental Cost Analysis card */}
          {simResult && (
            <section className="dispatch-section cost-audit-section">
              <div className="heading-wrapper">
                <DollarSign size={18} />
                <h3>Financial & Environmental Cost Audit</h3>
              </div>
              <p className="chart-description">
                Calculates the operational wage overhead, fuel costs, and carbon emissions incurred by holding the fleet, compared against SLA failure penalties.
              </p>
              
              <div className="cost-breakdown-grid">
                <div className="cost-row">
                  <span>Driver waiting wages ($32.50/hr):</span>
                  <strong>${simResult.operationalCost.waitWagesUsd.toFixed(2)}</strong>
                </div>
                <div className="cost-row">
                  <span>Fuel waste (idling trucks at sort):</span>
                  <strong>${simResult.operationalCost.idleFuelUsd.toFixed(2)}</strong>
                </div>
                <div className="cost-row">
                  <span>SLA Service Failure Penalties:</span>
                  <strong>${simResult.operationalCost.servicePenaltyCostUsd.toFixed(2)}</strong>
                </div>
                <div className="cost-total-row">
                  <span>Combined Financial Impact:</span>
                  <strong>${simResult.operationalCost.combinedFinancialImpactUsd.toLocaleString()}</strong>
                </div>
              </div>

              <div className="environmental-metric-box">
                <Leaf size={16} />
                <div>
                  <strong>{simResult.operationalCost.co2EmissionsKg.toFixed(1)} kg CO₂</strong>
                  <span>Simulated Greenhouse Gas emissions from vehicle idling.</span>
                </div>
              </div>
            </section>
          )}

          {/* SVG Trade-off Chart */}
          <section className="dispatch-section">
            <div className="heading-wrapper">
              <TrendingDown size={18} />
              <h3>Dispatch Trade-Off Model</h3>
            </div>
            <p className="chart-description">
              Left-behind penalty decreases with time (fewer missed arrivals), while on-road capacity failures increase (less delivery time).
            </p>
            
            <div className="chart-container">
              {chartPoints.length > 0 && (
                <svg viewBox="0 0 500 220" className="tradeoff-svg">
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="50" y2="180" stroke="#e6e8eb" strokeWidth="1" />
                  <line x1="50" y1="180" x2="480" y2="180" stroke="#9ca3af" strokeWidth="2" />
                  
                  {/* Left Behind curve (decreasing) - Red */}
                  <path
                    d={`M ${chartPoints.map((p) => {
                      const xCoord = 50 + ((p.x - 30) / 150) * 410;
                      const yCoord = 180 - (p.lb / maxVal) * 150;
                      return `${xCoord} ${yCoord}`;
                    }).join(" L ")}`}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />
                  
                  {/* Capacity Failure curve (increasing) - Orange */}
                  <path
                    d={`M ${chartPoints.map((p) => {
                      const xCoord = 50 + ((p.x - 30) / 150) * 410;
                      const yCoord = 180 - (p.cap / maxVal) * 150;
                      return `${xCoord} ${yCoord}`;
                    }).join(" L ")}`}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />

                  {/* Total Penalty curve (U-shape) - Purple */}
                  <path
                    d={`M ${chartPoints.map((p) => {
                      const xCoord = 50 + ((p.x - 30) / 150) * 410;
                      const yCoord = 180 - (p.total / maxVal) * 150;
                      return `${xCoord} ${yCoord}`;
                    }).join(" L ")}`}
                    fill="none"
                    stroke="#4d148c"
                    strokeWidth="3.5"
                  />

                  {/* Optimal Marker Zone */}
                  {(() => {
                    const optX = 50 + ((optimalHoldTime - 30) / 150) * 410;
                    return (
                      <g>
                        <line x1={optX} y1="20" x2={optX} y2="180" stroke="#00c805" strokeWidth="1.5" strokeDasharray="3 3" />
                        <rect x={optX - 35} y="10" width="70" height="20" rx="4" fill="#f0fff4" stroke="#b7efc5" strokeWidth="1" />
                        <text x={optX} y="24" textAnchor="middle" fontSize="9" fill="#007f04" fontWeight="bold">OPTIMAL</text>
                      </g>
                    );
                  })()}

                  {/* Current Selected Pointer */}
                  {(() => {
                    const selectedPt = chartPoints.find((p) => p.x === dispatchTimeMin);
                    if (!selectedPt) return null;
                    const optX = 50 + ((dispatchTimeMin - 30) / 150) * 410;
                    const optY = 180 - (selectedPt.total / maxVal) * 150;
                    return (
                      <g>
                        <circle cx={optX} cy={optY} r="6" fill="#ff6600" stroke="#ffffff" strokeWidth="2" />
                        <text x={optX} y={optY - 12} textAnchor="middle" fontSize="10" fill="#111418" fontWeight="bold">
                          {selectedPt.total} pts
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              )}
              
              <div className="chart-legend">
                <div className="legend-item"><span className="legend-dot lb" />Left Behind</div>
                <div className="legend-item"><span className="legend-dot cap" />Capacity Failure</div>
                <div className="legend-item"><span className="legend-dot total" />Total Penalty</div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Side: Route holds table, visual execution, and AI model comparison */}
        <div className="dispatch-visualization-col">
          
          {/* Interactive SVG Map */}
          <section className="dispatch-section map-visualizer-section">
            <div className="heading-wrapper">
              <Map size={18} />
              <h3>Interactive Station Dispatch Map</h3>
            </div>
            <p className="routes-intro">
              Hover over paths to identify delivery zones. Green paths represent routes running fully on-time. Purple paths highlight held routes. Red nodes indicate delivery capacity bottlenecks.
            </p>

            <div className="svg-map-wrapper">
              <svg viewBox="0 0 300 240" className="interactive-station-svg-map">
                {/* Station Central Hub */}
                <circle cx="150" cy="110" r="14" fill="#4d148c" stroke="#ffffff" strokeWidth="2.5" />
                <text x="150" y="114" textAnchor="middle" fontSize="9" fill="#ffffff" fontWeight="bold">HUB</text>

                {/* Draw Route Paths */}
                {mapRoutes.map((mr) => {
                  const rRes = simResult?.routes.find(r => r.routeId === mr.id);
                  const isHeld = selectiveRouteHolds[mr.id] !== undefined;
                  const isHovered = hoveredRouteId === mr.id;
                  
                  let pathColor = isHeld ? "#8b5cf6" : mr.color;
                  if (rRes && rRes.failedStopsCount > 0) {
                    pathColor = "#ef4444"; 
                  } else if (rRes && rRes.loadedPackagesCount > 0 && !isHeld) {
                    pathColor = "#10b981"; 
                  }

                  return (
                    <g 
                      key={mr.id} 
                      onMouseEnter={() => setHoveredRouteId(mr.id)}
                      onMouseLeave={() => setHoveredRouteId(null)}
                      style={{ cursor: "pointer" }}
                      onClick={() => setInspectedRouteId(inspectedRouteId === mr.id ? null : mr.id)}
                    >
                      <path
                        d={mr.d}
                        fill="none"
                        stroke={pathColor}
                        strokeWidth={isHovered ? 8 : 4}
                        strokeOpacity={isHovered ? 0.4 : 0.85}
                        strokeLinecap="round"
                        style={{ transition: "stroke-width 0.2s, stroke-opacity 0.2s" }}
                      />
                      <path
                        d={mr.d}
                        fill="none"
                        stroke={pathColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {(() => {
                        const coords = mr.d.split(",");
                        const lastCoords = coords[coords.length - 1].trim().split(" ");
                        const endX = Number(lastCoords[0]);
                        const endY = Number(lastCoords[1]);
                        return (
                          <g>
                            <circle 
                              cx={endX} 
                              cy={endY} 
                              r={isHovered ? 8 : 5} 
                              fill={pathColor} 
                              stroke="#ffffff" 
                              strokeWidth="1.5" 
                              style={{ transition: "r 0.2s" }}
                            />
                            {isHovered && (
                              <g>
                                <rect x={endX - 45} y={endY - 24} width="90" height="15" rx="3" fill="#1e293b" opacity="0.9" />
                                <text x={endX} y={endY - 14} textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold">
                                  Route {mr.id}: {mr.label}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>

          {/* Selective Route Hold Toggles */}
          <section className="dispatch-section">
            <div className="heading-wrapper">
              <Layers size={18} />
              <h3>Selective Route-Level Controls</h3>
            </div>
            <p className="routes-intro">
              Toggle holds on specific routes with high-priority shipments. You can dispatch empty routes on-time while holding others to protect service. Click **Inspect** to review packages.
            </p>
            
            <div className="routes-table-container">
              <table className="routes-table">
                <thead>
                  <tr>
                    <th>Route ID / Name</th>
                    <th>Stops (Cap)</th>
                    <th>Failures</th>
                    <th>Conveyance Load</th>
                    <th>Action</th>
                    <th>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {simResult?.routes.map((r) => {
                    const isHeld = selectiveRouteHolds[r.routeId] !== undefined;
                    const heldTime = selectiveRouteHolds[r.routeId];
                    const isInspected = inspectedRouteId === r.routeId;
                    const isHovered = hoveredRouteId === r.routeId;
                    return (
                      <tr 
                        key={r.routeId} 
                        className={`${isHeld ? "row-held" : ""} ${isInspected ? "row-inspected" : ""} ${isHovered ? "row-hovered-sync" : ""}`}
                        onMouseEnter={() => setHoveredRouteId(r.routeId)}
                        onMouseLeave={() => setHoveredRouteId(null)}
                      >
                        <td>
                          <strong>{r.routeId}</strong>
                          <span className="route-area-name">{r.driverName}</span>
                        </td>
                        <td>{r.totalStops} <span className="cap-limit">({r.capacityStops})</span></td>
                        <td>
                          {r.failedStopsCount > 0 ? (
                            <span className="fail-badge error">
                              {r.failedStopsCount} stops
                            </span>
                          ) : (
                            <span className="fail-badge success">On-Time</span>
                          )}
                        </td>
                        <td>
                          <div className="load-bar">
                            <span className="load-val">{r.loadedPackagesCount} pkgs</span>
                            {r.leftBehindPackagesCount > 0 && (
                              <span className="load-left-behind">({r.leftBehindPackagesCount} left)</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            className={isHeld ? "hold-action-btn active" : "hold-action-btn"}
                            onClick={() => handleRouteHoldToggle(r.routeId)}
                          >
                            {isHeld ? `Held to ${formatMinutesToTime(heldTime)}` : "Dispatch"}
                          </button>
                        </td>
                        <td>
                          <button
                            className={`inspect-row-btn ${isInspected ? "active" : ""}`}
                            onClick={() => setInspectedRouteId(isInspected ? null : r.routeId)}
                            title="Inspect Packages"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* High-Fidelity Driver Manifest Inspect Drawer */}
            {inspectedRouteResult && (
              <div className="inspect-drawer-panel">
                <div className="drawer-header">
                  <div>
                    <h4>Route {inspectedRouteResult.routeId} Operational Run Sheet</h4>
                    <span className="drawer-sub">Driver: {inspectedRouteResult.driverName}</span>
                  </div>
                  <button className="text-btn close-drawer" onClick={() => setInspectedRouteId(null)}>Close</button>
                </div>
                
                <div className="drawer-summary-row">
                  <div className="summary-stat">
                    <span>Stops Assigned</span>
                    <strong>{inspectedRouteResult.totalStops}</strong>
                  </div>
                  <div className="summary-stat">
                    <span>Truck Capacity</span>
                    <strong>{inspectedRouteResult.capacityStops} stops</strong>
                  </div>
                  <div className="summary-stat error">
                    <span>Failed Deliveries</span>
                    <strong>{inspectedRouteResult.failedStopsCount} stops</strong>
                  </div>
                  <div className="summary-stat warning">
                    <span>Late Commitments</span>
                    <strong>{inspectedRouteResult.commitFailuresCount} stops</strong>
                  </div>
                </div>

                <div className="failures-package-list">
                  <p className="section-label">High-Fidelity Delivery Manifest Timeline</p>
                  <div className="fidelity-manifest-timeline">
                    {inspectedRouteResult.manifest.map((stop) => {
                      const maxWeight = Math.max(...stop.packages.map((p) => p.weight));
                      const isExpress = maxWeight >= 50;

                      return (
                        <div 
                          key={stop.stopNum} 
                          className={`manifest-timeline-stop ${!stop.isCompleted ? "failed" : stop.isCommitFailure ? "commit-late" : "delivered"}`}
                        >
                          <div className="manifest-time-col">
                            <strong>{stop.isCompleted ? stop.formattedTime : "—"}</strong>
                            <span>Stop #{stop.stopNum}</span>
                          </div>
                          <div className="manifest-details-col">
                            <div className="manifest-stop-head">
                              <strong>
                                {isExpress ? "⭐ Express Delivery" : "📦 Standard Delivery"}
                              </strong>
                              {!stop.isCompleted ? (
                                <span className="stop-pill-status failed">Failed - Capacity Cut</span>
                              ) : stop.isCommitFailure ? (
                                <span className="stop-pill-status late">SLA Late Commit</span>
                              ) : (
                                <span className="stop-pill-status success">Delivered</span>
                              )}
                            </div>
                            <div className="manifest-stop-packages">
                              {stop.packages.map((pkg) => (
                                <div key={pkg.id} className="manifest-pkg-item">
                                  <span>{PRODUCT_LABELS[pkg.productType]} ({pkg.id})</span>
                                  {stop.isCompleted && stop.estimatedDeliveryTimeMin > PRODUCT_DEADLINES[pkg.productType] && (
                                    <span className="text-danger font-bold">
                                      Commit Late (Deadline: {formatMinutesToTime(PRODUCT_DEADLINES[pkg.productType])})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Scenario Sandbox comparison panel */}
          <section className="dispatch-section scenario-sandbox-panel">
            <div className="heading-wrapper" style={{ justifyContent: "space-between", width: "100%" }}>
              <div className="heading-wrapper">
                <Save size={18} />
                <h3>Scenario Comparison Sandbox</h3>
              </div>
              <span className="drafts-count-tag">{savedPlans.length} plans saved</span>
            </div>
            
            <form onSubmit={savePlanDraft} className="scenario-save-form">
              <input
                type="text"
                placeholder="Enter plan name (e.g. Flight Delay contingency)..."
                value={planNameInput}
                onChange={(e) => setPlanNameInput(e.target.value)}
                className="scenario-name-input"
              />
              <button type="submit" className="save-plan-btn">
                <Save size={14} /> Save Plan
              </button>
            </form>

            {savedPlans.length > 0 ? (
              <div className="saved-plans-container">
                <table className="saved-plans-table">
                  <thead>
                    <tr>
                      <th>Plan Name</th>
                      <th>Weather</th>
                      <th>Time</th>
                      <th>Holds</th>
                      <th>Score</th>
                      <th>Load</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedPlans.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.weather}</td>
                        <td>{formatMinutesToTime(p.dispatchTimeMin)}</td>
                        <td>{p.selectiveRouteHoldsCount} routes</td>
                        <td>
                          <span className={`fail-badge ${p.penalty > 400 ? "error" : "success"}`}>
                            {p.penalty} pts
                          </span>
                        </td>
                        <td>
                          <button onClick={() => loadPlanDraft(p)} className="load-plan-action">
                            <FolderOpen size={13} /> Load
                          </button>
                        </td>
                        <td>
                          <button onClick={() => deletePlanDraft(p.id)} className="delete-plan-action">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="scenario-empty-notice">No scenarios saved yet. Dial in custom holds/ETAs above and save to compare.</p>
            )}
          </section>

          {/* Model Debate Arena Section (Bureaucracy Battle + Aura Loss meter) */}
          <section className="dispatch-section debate-arena-section">
            <header className="debate-section-header">
              <div className="heading-wrapper">
                <MessageSquare size={18} />
                <h3>Frontier Model Debate Arena</h3>
              </div>
              <div className="header-actions-row">
                <button 
                  className="satirical-ppt-trigger-btn"
                  onClick={() => {
                    setCurrentSlideIndex(0);
                    setShowPptModal(true);
                  }}
                >
                  <FileText size={13} />
                  View RACI PowerPoint
                </button>
                <button 
                  className={`debate-trigger-btn ${isDebating ? "active animate-pulse" : ""}`}
                  onClick={triggerDebateArena}
                  disabled={isDebating}
                >
                  <Sparkles size={13} />
                  {isDebating ? "Debating..." : "Trigger Bureaucracy Battle"}
                </button>
              </div>
            </header>
            
            <p className="routes-intro">
              Contrasts mathematical routing decisions with classic corporate steering committee aligners. See real-time models mock midwit arguments.
            </p>

            {/* Dynamic Aura Loss Tracking Panel */}
            <div className="aura-loss-meter-box">
              <div className="aura-title-row">
                <div className="heading-wrapper">
                  <Flame size={15} className="animate-bounce" />
                  <strong>Steering Committee Aura Balance</strong>
                </div>
                <span className={`aura-value-pill ${midwitAura < 0 ? "ruined" : "normal"}`}>
                  {midwitAura > 0 ? `${midwitAura} Aura` : `-${Math.abs(midwitAura)} Aura 💀`}
                </span>
              </div>
              
              <div className="aura-bar-outer">
                <div 
                  className={`aura-bar-inner ${midwitAura < 0 ? "drained" : ""}`}
                  style={{
                    width: `${Math.max(0, Math.min(100, midwitAura))}%`
                  }}
                />
              </div>

              {auraLossLog.length > 0 && (
                <div className="aura-history-lines">
                  {auraLossLog.map((line, i) => (
                    <div key={i} className="aura-history-row">
                      <span>📉</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="debate-messages-box">
              {debateMessages.length > 0 ? (
                <div className="debate-thread">
                  {debateMessages.map((msg, idx) => {
                    let bubbleClass = "midwit-bubble";
                    if (msg.sender.includes("Gemini")) bubbleClass = "gemini-bubble";
                    else if (msg.sender.includes("GLM")) bubbleClass = "glm-bubble";

                    return (
                      <div key={idx} className={`debate-bubble-wrapper ${bubbleClass}`}>
                        <div className="bubble-header">
                          <span className="bubble-sender">{msg.sender}</span>
                          <span className="bubble-round">Round {msg.round}</span>
                        </div>
                        <div className="bubble-text">{msg.text}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="debate-empty-state">
                  <ShieldAlert size={20} className="text-gray" />
                  <p>Click "Trigger Bureaucracy Battle" to stream the live steering committee model logs.</p>
                </div>
              )}
            </div>
          </section>

          {/* Live Operational Visualizer */}
          <section className="dispatch-section operational-viz-section">
            <div className="section-head-bar">
              <div className="heading-wrapper">
                <Clock size={18} />
                <h3>Live Execution Simulator</h3>
              </div>
              <div className="sim-controls-group">
                <button
                  className="sim-play-btn"
                  onClick={() => {
                    if (simTime >= (currentStation?.rtbMin ?? 600)) {
                      setSimTime(0);
                    }
                    setIsPlaying(!isPlaying);
                  }}
                >
                  <Play size={14} />
                  {isPlaying ? "Pause" : simTime >= (currentStation?.rtbMin ?? 600) ? "Restart" : "Run Live Sort"}
                </button>
                <span className="sim-timer-readout">
                  Clock: {formatMinutesToTime(simTime)}
                </span>
              </div>
            </div>
            
            <div className="visualizer-box">
              <div className="visualizer-progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(simTime / (currentStation?.rtbMin ?? 600)) * 100}%`
                  }}
                />
              </div>

              {/* Graphical Arena */}
              <div className="visualizer-arena">
                <div className="arena-gate sort-facility">
                  <div className="gate-title">Sort Facility</div>
                  <div className="facility-status">
                    {simTime < dispatchTimeMin ? (
                      <span className="status-label sort-loading animate-pulse">Sorting & Loading Cargo</span>
                    ) : (
                      <span className="status-label sort-dispatched">Fleet Dispatched</span>
                    )}
                  </div>
                </div>

                <div className="arena-lanes">
                  {currentStation?.routes.slice(0, 4).map((r, idx) => {
                    const rHold = selectiveRouteHolds[r.id] ?? dispatchTimeMin;
                    const isDispatched = simTime >= rHold;
                    const driveProgress = isDispatched 
                      ? Math.min(100, ((simTime - rHold) / (currentStation.rtbMin - rHold)) * 100)
                      : 0;

                    return (
                      <div key={r.id} className="lane-row">
                        <span className="lane-label">Route {r.id}</span>
                        <div className="lane-track">
                          {isDispatched ? (
                            <div
                              className="truck-icon-wrapper"
                              style={{ left: `calc(${driveProgress}% - 24px)` }}
                            >
                              <Truck size={18} className="driving-truck" />
                              <span className="truck-bubble">
                                {driveProgress === 100 ? "RTB" : `${Math.round(driveProgress)}%`}
                              </span>
                            </div>
                          ) : (
                            <span className="lane-waiting">Holding at Sort (release {formatMinutesToTime(rHold)})</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* AI Decision Panel (Flash vs Open Source) */}
          <section className="dispatch-section ai-reasoning-section">
            <header className="ai-section-header">
              <div className="heading-wrapper">
                <Cpu size={18} fill="#ff6600" stroke="#ff6600" />
                <h3>AI Dispatch Recommendation Engine</h3>
              </div>
              
              <div className="model-toggle-group">
                <button
                  className={selectedModel === "Gemini 2.5 Flash" ? "model-tab active" : "model-tab"}
                  onClick={() => setSelectedModel("Gemini 2.5 Flash")}
                >
                  Gemini 2.5 Flash
                </button>
                <button
                  className={selectedModel === "GLM 5.2" ? "model-tab active" : "model-tab"}
                  onClick={() => setSelectedModel("GLM 5.2")}
                >
                  GLM 5.2 (OS)
                </button>
              </div>
            </header>

            {activeReport ? (
              <div className="ai-report-body">
                <div className="ai-metrics-row">
                  <div className="ai-metric">
                    <span>Inference latency</span>
                    <strong>{activeReport.runTimeMs} ms</strong>
                  </div>
                  <div className="ai-metric">
                    <span>Input/Output Tokens</span>
                    <strong>{activeReport.tokensUsed.toLocaleString()}</strong>
                  </div>
                  <div className="ai-metric cost-highlight">
                    <span>Simulated Run Cost</span>
                    <strong>${activeReport.costUsd.toFixed(4)}</strong>
                  </div>
                </div>

                <div className="ai-recommendation-banner">
                  <span className="rec-eyebrow">Engine Recommendation</span>
                  <div className="rec-value">{activeReport.recommendation}</div>
                </div>

                <div className="ai-logic-explanation">
                  <div className="heading-wrapper" style={{ justifyContent: "space-between", width: "100%" }}>
                    <p className="section-label font-bold text-gray" style={{ color: "#94a3b8" }}>Operational Logic & Analysis</p>
                    <span className="cost-saving-tag">GLM: 4.6x cheaper</span>
                  </div>
                  <pre className="logic-text">{activeReport.logic}</pre>
                </div>

                {/* Annualized Corporate Token Savings Calculator */}
                <div className="annualized-savings-calculator">
                  <p className="section-label" style={{ color: "#047857", marginBottom: 8, fontSize: "0.72rem" }}>
                    Corporate Scaling Projection (High-Frequency Runs across 1,200 stations)
                  </p>
                  <div className="savings-grid">
                    <div className="savings-stat-box">
                      <span>Gemini 2.5 Flash / Year</span>
                      <strong>${Math.round(geminiCostPerYear).toLocaleString()}</strong>
                    </div>
                    <div className="savings-stat-box green-highlighted">
                      <span>GLM 5.2 Self-Hosted / Year</span>
                      <strong>${Math.round(glmCostPerYear).toLocaleString()}</strong>
                    </div>
                    <div className="savings-stat-box gold-highlighted">
                      <span>Annual savings</span>
                      <strong>${Math.round(savingsPerYear).toLocaleString()}</strong>
                    </div>
                  </div>
                  <p className="savings-disclaimer">
                    *Based on 180 sort-optimization calculations per station per day. Self-hosted GLM 5.2 on private GPUs reduces transaction overhead significantly.
                  </p>
                </div>

                <div className="cost-saving-disclaimer">
                  <Coins size={15} />
                  <span>
                    GLM 5.2 maintains frontier reasoning quality while reducing transaction cost by **4.6x** compared to commercial APIs.
                  </span>
                </div>
              </div>
            ) : (
              <div className="ai-report-empty">
                <RefreshCw size={20} className="animate-spin text-purple" />
                <p>Generating AI Recommendation logs...</p>
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}
