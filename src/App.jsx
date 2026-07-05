import React, { useState } from "react";
import FarmerDashboard from "./components/FarmerDashboard";
import RSKDashboard from "./components/RSKDashboard";
import { Sprout, ShieldCheck, User } from "lucide-react";

const appTranslations = {
  English: {
    brand: "Kisan Alert Engine",
    farmerTab: "Farmer Portal",
    rskTab: "RSK Panel",
    footerText: "© 2026 Kisan Alert Engine. Multilingual Agricultural Intelligence Network.",
    terms: "Terms of service",
    privacy: "Privacy policies"
  },
  Hindi: {
    brand: "किसान अलर्ट इंजन",
    farmerTab: "किसान पोर्टल",
    rskTab: "आरएसके पैनल",
    footerText: "© 2026 किसान अलर्ट इंजन। बहुभाषी कृषि खुफिया नेटवर्क।",
    terms: "सेवा की शर्तें",
    privacy: "गोपनीयता नीतियां"
  },
  Marathi: {
    brand: "किसान अलर्ट इंजिन",
    farmerTab: "शेतकरी पोर्टल",
    rskTab: "आरएसके पॅनेल",
    footerText: "© 2026 किसान अलर्ट इंजिन. बहुभाषिक कृषी माहिती नेटवर्क.",
    terms: "सेवा अटी",
    privacy: "गोपनीयता धोरणे"
  },
  Tamil: {
    brand: "கிசான் அலர்ட் என்ஜின்",
    farmerTab: "விவசாயி தளம்",
    rskTab: "விவசாய மையம் (RSK)",
    footerText: "© 2026 கிசான் அலர்ட் என்ஜின். பன்மொழி விவசாய நுண்ணறிவு வலையமைப்பு.",
    terms: "சேவை விதிமுறைகள்",
    privacy: "தனியுரிமைக் கொள்கைகள்"
  },
  Telugu: {
    brand: "కిసాన్ అలర్ట్ ఇంజన్",
    farmerTab: "రైతు పోర్టల్",
    rskTab: "వ్యవసాయ కేంద్రం (RSK)",
    footerText: "© 2026 కిసాన్ అలర్ట్ ఇంజన్. బహుభాషా వ్యవసాయ సమాచార వ్యవస్థ.",
    terms: "సేవా నిబంధనలు",
    privacy: "గోప్యతా విధానాలు"
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState("farmer"); 
  const [selectedLang, setSelectedLang] = useState("English"); 

  const t = appTranslations[selectedLang] || appTranslations["English"];

  return (
    <div className="min-h-screen flex flex-col">
      {}
      <header className="sticky top-0 z-40 bg-dark-bg/85 backdrop-blur-md border-b border-brand-900/30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {}
            <div className="flex items-center gap-2">
              <div className="bg-brand-500/10 p-2 rounded-xl border border-brand-500/25 shadow-glow-green">
                <Sprout className="text-brand-400" size={22} />
              </div>
              <div>
                <span className="text-white font-extrabold text-lg tracking-tight">{t.brand}</span>
              </div>
            </div>

            {}
            <nav className="flex items-center gap-1.5 bg-brand-950/60 p-1.5 rounded-2xl border border-brand-900/50">
              {}
              <button
                type="button"
                onClick={() => setCurrentView("farmer")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 ${
                  currentView === "farmer"
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                    : "text-gray-400 hover:text-white hover:bg-brand-900/40"
                }`}
              >
                <User size={14} />
                <span>{t.farmerTab}</span>
              </button>

              {}
              <button
                type="button"
                onClick={() => setCurrentView("rsk")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 ${
                  currentView === "rsk"
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                    : "text-gray-400 hover:text-white hover:bg-brand-900/40"
                }`}
              >
                <ShieldCheck size={14} />
                <span>{t.rskTab}</span>
              </button>
            </nav>

          </div>
        </div>
      </header>

      {}
      <main className="flex-1 bg-transparent">
        {currentView === "farmer" ? (
          <FarmerDashboard selectedLang={selectedLang} setSelectedLang={setSelectedLang} />
        ) : (
          <RSKDashboard />
        )}
      </main>

      {}
      <footer className="bg-brand-950/20 border-t border-brand-900/20 py-6 text-center text-xs text-gray-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>{t.footerText}</p>
          <div className="flex gap-4">
            <span className="hover:text-brand-400 transition cursor-help">{t.terms}</span>
            <span>•</span>
            <span className="hover:text-brand-400 transition cursor-help">{t.privacy}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}