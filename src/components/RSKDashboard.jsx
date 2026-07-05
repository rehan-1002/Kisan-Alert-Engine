import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Database, 
  AlertTriangle, 
  ExternalLink, 
  Loader2, 
  X,
  Volume2,
  Droplets,
  Thermometer,
  ShieldCheck,
  Search,
  MessageSquare,
  Image as ImageIcon,
  Sprout
} from "lucide-react";
import { db } from "../config/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc 
} from "firebase/firestore";

export default function RSKDashboard() {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selected case for Modal detail review
  const [selectedCase, setSelectedCase] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Counter of resolved cases in this session (persisted locally)
  const [resolvedCount, setResolvedCount] = useState(() => {
    return parseInt(localStorage.getItem("rsk_resolved_count") || "0", 10);
  });

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Setup real-time listener to Firestore
    try {
      const q = query(
        collection(db, "farmer_history"),
        where("status", "==", "Pending RSK Review")
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const loadedCases = [];
        querySnapshot.forEach((doc) => {
          loadedCases.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Client-side sort by timestamp descending (newest first)
        // Bypasses Firestore index requirement
        loadedCases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setCases(loadedCases);
        setIsLoading(false);
      }, (err) => {
        console.error("Firestore listener error:", err);
        setError("Unable to connect to Firestore. Verify security rules / internet.");
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setError("Failed to construct query pipeline.");
      setIsLoading(false);
    }
  }, []);

  const handleResolve = async (caseId) => {
    setIsResolving(true);
    try {
      const docRef = doc(db, "farmer_history", caseId);
      await updateDoc(docRef, {
        status: "Resolved",
        resolved_at: new Date().toISOString()
      });
      
      // Update session counts
      setResolvedCount((prev) => {
        const nextVal = prev + 1;
        localStorage.setItem("rsk_resolved_count", nextVal.toString());
        return nextVal;
      });

      // Close modal if resolved case was selected
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase(null);
      }
    } catch (err) {
      console.error("Error resolving case:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsResolving(false);
    }
  };

  // Text-To-Speech Playback for Expert Audit
  const speakText = (text, lang) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      
      const cleanText = text
        .replace(/[\#\*\-\•\_\`]/g, "")
        .replace(/(हिन्दी|मराठी|English)\:/gi, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => v.lang.startsWith(lang));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech synthesis not supported in this browser.");
    }
  };

  const getLangFromText = (text) => {
    const isDevanagari = /[\u0900-\u097F]/.test(text);
    if (!isDevanagari) return "en-IN";
    
    const lower = text.toLowerCase();
    if (lower.includes("मराठी") || lower.includes("पिके") || lower.includes("शिफारस") || lower.includes("जमीन")) {
      return "mr-IN";
    }
    return "hi-IN";
  };

  // Render modal content parser
  const renderDetailMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1.5"></div>;

      if (trimmed.startsWith("###")) {
        const val = trimmed.replace("###", "").trim();
        return (
          <h4 key={idx} className="text-sm font-extrabold text-brand-300 mt-4 mb-2 flex items-center justify-between border-b border-brand-800/40 pb-1">
            <span>{val}</span>
            <button 
              onClick={() => speakText(val, getLangFromText(val))}
              className="p-1 rounded-md bg-brand-900 text-brand-400 hover:text-white"
            >
              <Volume2 size={12} />
            </button>
          </h4>
        );
      }

      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const val = trimmed.substring(1).trim();
        const parts = val.split("**");
        const rendered = parts.map((p, pIdx) => {
          if (pIdx % 2 === 1) return <strong key={pIdx} className="text-accent-gold font-semibold">{p}</strong>;
          return p;
        });
        return (
          <li key={idx} className="ml-3 list-disc text-gray-300 text-xs py-0.5 flex justify-between items-start gap-2">
            <span>{rendered}</span>
            <button 
              onClick={() => speakText(val, getLangFromText(val))}
              className="p-0.5 rounded bg-brand-950 text-brand-500 hover:text-white flex-shrink-0"
            >
              <Volume2 size={10} />
            </button>
          </li>
        );
      }

      const parts = trimmed.split("**");
      const rendered = parts.map((p, pIdx) => {
        if (pIdx % 2 === 1) return <strong key={pIdx} className="text-accent-gold font-semibold">{p}</strong>;
        return p;
      });
      return (
        <p key={idx} className="text-gray-300 text-xs py-0.5 flex justify-between items-center gap-2">
          <span>{rendered}</span>
          <button 
            onClick={() => speakText(trimmed, getLangFromText(trimmed))}
            className="p-0.5 rounded bg-brand-950 text-brand-500 hover:text-white flex-shrink-0"
          >
            <Volume2 size={10} />
          </button>
        </p>
      );
    });
  };

  // Filter cases based on search queries (Farmer ID or Advice text)
  const filteredCases = cases.filter((c) => {
    const queryLower = searchQuery.toLowerCase();
    return (
      c.farmer_id.toLowerCase().includes(queryLower) ||
      (c.query_type || "").toLowerCase().includes(queryLower) ||
      c.ai_diagnosis.toLowerCase().includes(queryLower)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="glass-panel-glow rounded-3xl p-6 mb-8 border border-brand-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-brand-500/5 p-20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="text-brand-400" size={26} />
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Rythu Seva Kendra (RSK)</h1>
            </div>
            <p className="text-gray-400 text-sm font-semibold">Expert Decision Support & Broadcast Console</p>
          </div>
          <div className="flex items-center gap-2 bg-brand-950/80 px-4 py-2 rounded-2xl border border-brand-900/60 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-mono font-extrabold text-brand-300">Live DB Stream Connected</span>
          </div>
        </div>
      </div>

      {/* Numerical Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Metric 1 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="block text-xs uppercase text-gray-500 font-bold tracking-wider">Awaiting Review</span>
            <span className="block text-3xl font-extrabold text-white mt-1 font-mono">{cases.length}</span>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
            <Clock size={24} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="block text-xs uppercase text-gray-500 font-bold tracking-wider">Resolved in Session</span>
            <span className="block text-3xl font-extrabold text-white mt-1 font-mono">{resolvedCount}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-brand-600">
          <div>
            <span className="block text-xs uppercase text-gray-500 font-bold tracking-wider">Total Active Collection</span>
            <span className="block text-3xl font-extrabold text-white mt-1 font-mono">{cases.length + resolvedCount}</span>
          </div>
          <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
            <Database size={24} />
          </div>
        </div>
      </div>

      {/* Main Table section */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-brand-500/10">
        
        {/* Search header container */}
        <div className="p-5 border-b border-brand-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-950/20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={18} />
            Pending Alerts Review Inbox
          </h2>
          <div className="relative w-full sm:w-72">
            <input 
              type="text" 
              placeholder="Search Farmer ID or query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-950/80 border border-brand-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono shadow-inner"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
          </div>
        </div>

        {/* Loading and empty states handler */}
        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center gap-2 justify-center">
            <Loader2 className="animate-spin text-brand-500" size={40} />
            <p className="text-sm font-bold text-white">Streaming Firestore cases...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <AlertTriangle className="text-red-500 mx-auto mb-3" size={40} />
            <p className="font-bold text-white text-base">Connection Lost</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">{error}</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-brand-950 flex items-center justify-center mx-auto mb-4 border border-brand-800">
              <CheckCircle className="text-brand-400" size={32} />
            </div>
            <p className="text-lg font-extrabold text-white">All Alerts Verified</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
              No pending farmer advisories require verification. New entries will stream in automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-950/50 border-b border-brand-900/60 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Farmer ID</th>
                  <th className="py-4 px-6">Date & Time</th>
                  <th className="py-4 px-6">Coordinates</th>
                  <th className="py-4 px-6">Query Mode</th>
                  <th className="py-4 px-6">Advisory Snapshot</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/20">
                {filteredCases.map((c) => {
                  const dateStr = new Date(c.timestamp).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <tr 
                      key={c.id} 
                      className="hover:bg-brand-900/10 transition group text-xs text-gray-200"
                    >
                      {/* ID */}
                      <td className="py-4 px-6 font-mono font-bold text-accent-gold">{c.farmer_id}</td>
                      
                      {/* Time */}
                      <td className="py-4 px-6 text-gray-400">{dateStr}</td>
                      
                      {/* Coordinates */}
                      <td className="py-4 px-6 font-mono text-[10px]">
                        <span className="inline-flex items-center gap-1 bg-brand-950 px-2 py-0.5 rounded border border-brand-900 text-gray-400">
                          <MapPin size={8} /> {c.latitude}, {c.longitude}
                        </span>
                      </td>

                      {/* Mode */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] border ${
                            c.query_type && c.query_type.includes("Voice")
                              ? "bg-purple-950/40 border-purple-500/20 text-purple-300"
                              : c.query_type && c.query_type.includes("Telemetry")
                              ? "bg-blue-950/40 border-blue-500/20 text-blue-300"
                              : "bg-emerald-950/40 border-emerald-500/20 text-emerald-300"
                          }`}>
                            {c.query_type && c.query_type.includes("Voice") ? (
                              <>
                                <MessageSquare size={10} /> Voice
                              </>
                            ) : c.query_type && c.query_type.includes("Telemetry") ? (
                              <>
                                <Database size={10} /> Weather
                              </>
                            ) : (
                              <>
                                <Sprout size={10} /> Text/Image
                              </>
                            )}
                          </span>
                          
                          {c.snapshot_base64 && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/60 mt-0.5">
                              <ImageIcon size={8} /> Snapshot
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Snippet */}
                      <td className="py-4 px-6 max-w-xs">
                        <p className="truncate text-gray-400" title={c.ai_diagnosis}>
                          {c.ai_diagnosis.replace(/[\#\*\_]/g, "")}
                        </p>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setSelectedCase(c)}
                            className="bg-brand-900/60 hover:bg-brand-700 text-brand-300 hover:text-white px-2.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-1"
                            title="Inspect Details"
                          >
                            <ExternalLink size={12} /> Inspect
                          </button>
                          
                          <button 
                            onClick={() => handleResolve(c.id)}
                            disabled={isResolving}
                            className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-800 text-white px-2.5 py-1.5 rounded-lg font-bold transition shadow-sm flex items-center gap-1"
                          >
                            {isResolving ? (
                              <Loader2 className="animate-spin" size={12} />
                            ) : (
                              "Resolve"
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection Overlay/Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel-glow w-full max-w-2xl rounded-3xl overflow-hidden border border-brand-500/30 max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-brand-900/40 flex items-center justify-between bg-brand-950/40">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-400 tracking-widest font-mono">Case Inspector</span>
                <h3 className="text-lg font-extrabold text-white font-mono mt-0.5">
                  ID: {selectedCase.farmer_id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                className="p-1.5 rounded-full bg-brand-900/40 hover:bg-red-950 hover:text-red-400 text-gray-400 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Telemetry/GPS parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-brand-950/40 p-4 rounded-2xl border border-brand-900/50">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-gray-500">Query Mode</span>
                  <span className="block text-xs font-bold text-accent-amber mt-0.5">{selectedCase.query_type || "Telemetry"}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-gray-500">GPS Location</span>
                  <span className="block text-xs font-mono font-semibold text-white mt-0.5">
                    {selectedCase.latitude}, {selectedCase.longitude}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-gray-500">Soil Temp</span>
                  <span className="block text-xs font-mono font-semibold text-white mt-0.5 flex items-center gap-1">
                    <Thermometer size={10} className="text-brand-400" /> {selectedCase.soil_temp ? `${selectedCase.soil_temp}°C` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-gray-500">Soil Moisture</span>
                  <span className="block text-xs font-mono font-semibold text-white mt-0.5 flex items-center gap-1">
                    <Droplets size={10} className="text-brand-400" /> {selectedCase.soil_moisture ? `${selectedCase.soil_moisture}` : "N/A"}
                  </span>
                </div>
              </div>

              {/* Snapshot image display */}
              {selectedCase.snapshot_base64 && (
                <div className="bg-brand-950/40 p-4 rounded-2xl border border-brand-900/50">
                  <span className="block text-xs uppercase font-bold text-brand-400 mb-2.5 tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={14} /> Crop Snapshot
                  </span>
                  <div className="rounded-xl overflow-hidden border border-brand-800 bg-black">
                    <img
                      src={selectedCase.snapshot_base64}
                      alt="Crop Snapshot Submitted by Farmer"
                      className="w-full max-h-60 object-contain mx-auto"
                    />
                  </div>
                </div>
              )}

              {/* Original user query text notes */}
              {selectedCase.user_query_text && (
                <div className="bg-brand-950/40 p-4 rounded-2xl border border-brand-900/50">
                  <span className="block text-[9px] uppercase font-bold text-gray-500 mb-1">Farmer Text Notes</span>
                  <p className="italic text-gray-200 bg-brand-950/80 p-2.5 rounded-xl border border-brand-900 font-mono">
                    "{selectedCase.user_query_text}"
                  </p>
                </div>
              )}

              {/* Advisory details */}
              <div>
                <span className="block text-xs uppercase font-bold text-brand-400 mb-2.5 tracking-wider">AI Advisory Bulletin / निदान</span>
                <div className="bg-brand-950/80 border border-brand-900 p-5 rounded-2xl max-h-80 overflow-y-auto shadow-inner text-sm space-y-2">
                  {renderDetailMarkdown(selectedCase.ai_diagnosis)}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-brand-900/40 flex justify-end gap-3 bg-brand-950/40">
              <button 
                onClick={() => setSelectedCase(null)}
                className="bg-brand-950 hover:bg-brand-900 text-gray-400 hover:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition border border-brand-850"
              >
                Close
              </button>
              <button 
                onClick={() => handleResolve(selectedCase.id)}
                disabled={isResolving}
                className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-800 text-white px-5 py-2.5 rounded-2xl text-xs font-extrabold transition shadow-lg shadow-brand-500/10 flex items-center gap-1.5"
              >
                {isResolving ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Resolving Case
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} /> Resolve & Approve Advice
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
