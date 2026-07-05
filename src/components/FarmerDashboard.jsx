import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Sun, 
  Volume2, 
  Loader2, 
  AlertCircle, 
  Compass, 
  Sprout, 
  CheckCircle,
  HelpCircle,
  VolumeX,
  Pause,
  Play,
  Image as ImageIcon,
  Trash2,
  Camera,
  Globe
} from "lucide-react";
import { db } from "../config/firebase";
import { collection, addDoc } from "firebase/firestore";
import { fetchSoilTelemetry } from "../services/weatherService";
import { generateCropAdvisory, diagnoseVoiceQuery, generateCropAdvisoryStream, diagnoseVoiceQueryStream } from "../services/aiService";

const t = {
  English: {
    subtitle: "Multilingual agricultural advisory system powered by AI",
    farmerId: "Farmer Identity",
    chooseLang: "Choose Language",
    locationTracking: "Location Tracking (GPS)",
    acquiring: "Acquiring coordinates...",
    locFailed: "Location Acquisition Failed",
    retryGps: "Retry Live GPS Tracking",
    gpsRequired: "Live GPS Coordinates Required",
    grantPerm: "Grant Permissions & Track GPS",
    detectedCoords: "Current Live Coordinates",
    refreshLoc: "Refresh Location",
    soilTelemetry: "Open-Meteo Soil Telemetry",
    soilMoisture: "Soil Moisture",
    soilTemp: "Soil Temp",
    maxTemp: "Max Temp",
    waitingTelemetry: "Waiting for coordinates to retrieve telemetry...",
    diagnosticHeader: "Crop & Soil Diagnostic Query",
    diagnosticSub: "Upload a snapshot of your crop disease/soil, record a voice description, or write concerns below to receive AI diagnosis.",
    cropSnapshot: "1. Crop Snapshot",
    snapPhoto: "Snap Photo / Upload File",
    cameraSupport: "Supports camera on mobile",
    removePhoto: "Remove Photo",
    spokenQuery: "2. Spoken Query",
    recordAudioSub: "Tap button to record audio query in your spoken dialect.",
    recording: "Recording",
    tapToSubmit: "Tap red mic to finish and submit",
    typeDetails: "Type details (Optional)",
    textareaPlaceholder: "Explain the issue manually (e.g. leaves look withered, soil is dry)...",
    getAdvisoryBtn: "Get AI Diagnostic Advisory",
    analyzing: "Analyzing snapshot & text...",
    diagnosingHealth: "Diagnosing Plant & Soil Health...",
    geminiProcessing: "Gemini model processing multimodal data. Please wait...",
    aiDiagnosisTitle: "AI Plant Diagnosis",
    advisoryTalkback: "Advisory Talkback",
    listenAdvice: "Listen to Advice",
    speaking: "Speaking...",
    paused: "Speech Paused",
    resume: "Resume",
    pause: "Pause",
    stop: "Stop",
    soilAnalysisHeader: "AI Soil Analysis & Crop Advisories",
    analyzingChemistry: "Analyzing Climate & Soil Chemistry...",
    generatingBulletin: "Generating advisory bulletin in selected language...",
    noAdvisoryTitle: "No Advisory Data Generated",
    noAdvisorySub: "Location coordinates are required in the left panel to trigger the weather/soil telemetry analysis engine.",
    saveSuccess: "Advice Saved to Cloud",
    saveSuccessSub: "Awaiting Rythu Seva Kendra expert verification."
  },
  Hindi: {
    subtitle: "एआई द्वारा संचालित बहुभाषी कृषि सलाह प्रणाली",
    farmerId: "किसान पहचान",
    chooseLang: "भाषा चुनें",
    locationTracking: "स्थान ट्रैकिंग (जीपीएस)",
    acquiring: "निर्देशांक प्राप्त कर रहे हैं...",
    locFailed: "स्थान प्राप्त करना विफल रहा",
    retryGps: "पुनः लाइव जीपीएस ट्रैकिंग का प्रयास करें",
    gpsRequired: "लाइव जीपीएस निर्देशांक आवश्यक हैं",
    grantPerm: "अनुमति दें और जीपीएस ट्रैक करें",
    detectedCoords: "वर्तमान लाइव निर्देशांक",
    refreshLoc: "स्थान रीफ्रेश करें",
    soilTelemetry: "ओपन-मेटीयो मृदा टेलीमेट्री",
    soilMoisture: "मिट्टी की नमी",
    soilTemp: "मिट्टी का तापमान",
    maxTemp: "अधिकतम तापमान",
    waitingTelemetry: "टेलीमेट्री प्राप्त करने के लिए निर्देशांक की प्रतीक्षा कर रहे हैं...",
    diagnosticHeader: "फसल और मिट्टी निदान प्रश्न",
    diagnosticSub: "फसल रोग/मिट्टी की तस्वीर अपलोड करें, आवाज में विवरण रिकॉर्ड करें, या निदान पाने के लिए नीचे अपनी चिंता लिखें।",
    cropSnapshot: "1. फसल की तस्वीर",
    snapPhoto: "तस्वीर लें / फाइल अपलोड करें",
    cameraSupport: "मोबाइल पर कैमरे का समर्थन करता है",
    removePhoto: "तस्वीर हटाएं",
    spokenQuery: "2. बोलकर प्रश्न पूछें",
    recordAudioSub: "अपनी बोली जाने वाली भाषा में प्रश्न रिकॉर्ड करने के लिए बटन दबाएं।",
    recording: "रिकॉर्डिंग चालू है",
    tapToSubmit: "समाप्त करने और भेजने के लिए लाल माइक दबाएं",
    typeDetails: "विवरण लिखें (वैकल्पिक)",
    textareaPlaceholder: "मैन्युअल रूप से समस्या समझाएं (जैसे: पत्तियां पीली हो रही हैं, मिट्टी सूखी है)...",
    getAdvisoryBtn: "एआई निदान सलाह प्राप्त करें",
    analyzing: "तस्वीर और पाठ का विश्लेषण कर रहे हैं...",
    diagnosingHealth: "पौधों और मिट्टी के स्वास्थ्य का निदान...",
    geminiProcessing: "जेमिनी मॉडल मल्टीमॉडल डेटा का विश्लेषण कर रहा है। कृपया प्रतीक्षा करें...",
    aiDiagnosisTitle: "एआई फसल निदान",
    advisoryTalkback: "सलाह वाचन (टॉकबैक)",
    listenAdvice: "सलाह सुनें",
    speaking: "बोल रहे हैं...",
    paused: "आवाज रुकी हुई है",
    resume: "जारी रखें",
    pause: "रोकें",
    stop: "बंद करें",
    soilAnalysisHeader: "एआई मृदा विश्लेषण और फसल सलाह",
    analyzingChemistry: "जलवायु और मृदा रसायन विज्ञान का विश्लेषण...",
    generatingBulletin: "चयनित भाषा में सलाह बुलेटिन तैयार कर रहे हैं...",
    noAdvisoryTitle: "कोई सलाह बुलेटिन उत्पन्न नहीं हुआ",
    noAdvisorySub: "मौसम/मृदा विश्लेषण इंजन को शुरू करने के लिए बाएं पैनल में स्थान निर्देशांक आवश्यक हैं।",
    saveSuccess: "सलाह क्लाउड में सुरक्षित",
    saveSuccessSub: "कृषि केंद्र विशेषज्ञ सत्यापन की प्रतीक्षा है।"
  },
  Marathi: {
    subtitle: "कृत्रिम बुद्धिमत्ता (AI) आधारित बहुभाषिक कृषी सल्ला प्रणाली",
    farmerId: "शेतकरी ओळख",
    chooseLang: "भाषा निवडा",
    locationTracking: "स्थान ट्रॅकिंग (GPS)",
    acquiring: "स्थान शोधत आहे...",
    locFailed: "स्थान शोधणे अयशस्वी",
    retryGps: "पुन्हा थेट जीपीएस ट्रॅकिंगचा प्रयत्न करा",
    gpsRequired: "थेट जीपीएस स्थान आवश्यक आहे",
    grantPerm: "परवानगी द्या आणि जीपीएस सुरू करा",
    detectedCoords: "सध्याचे थेट स्थान निर्देशांक",
    refreshLoc: "स्थान रीफ्रेश करा",
    soilTelemetry: "ओपन-मेटिओ जमीन माहिती",
    soilMoisture: "जमिनीतील ओलावा",
    soilTemp: "जमिनीचे तापमान",
    maxTemp: "कमाल तापमान",
    waitingTelemetry: "जमीन माहिती मिळवण्यासाठी स्थान शोधाची वाट पाहत आहे...",
    diagnosticHeader: "पिक आणि माती रोग निदान",
    diagnosticSub: "तुमच्या पिकाच्या रोगाचा/मातीचा फोटो अपलोड करा, ऑडिओ वर्णन रेकॉर्ड करा किंवा खाली समस्या लिहून निदान मिळवा।",
    cropSnapshot: "१. पिकाचे छायाचित्र (फोटो)",
    snapPhoto: "फोटो घ्या / फाईल अपलोड करा",
    cameraSupport: "मोबाईल कॅमेरा वापरता येईल",
    removePhoto: "फोटो काढा",
    spokenQuery: "२. बोलून प्रश्न विचारा",
    recordAudioSub: "तुमच्या बोलीभाषेत ऑडिओ प्रश्न रेकॉर्ड करण्यासाठी बटण दाबा।",
    recording: "रेकॉर्डिंग सुरू आहे",
    tapToSubmit: "रेकॉर्डिंग थांबवण्यासाठी आणि पाठवण्यासाठी लाल माईक दाबा",
    typeDetails: "समस्या सविस्तर लिहा (पर्यायी)",
    textareaPlaceholder: "समस्या स्वतः लिहून स्पष्ट करा (उदा. पाने वाळत आहेत, जमीन कोरडी आहे)...",
    getAdvisoryBtn: "AI रोग निदान मिळवा",
    analyzing: "फोटो आणि मजकुराचे विश्लेषण करत आहे...",
    diagnosingHealth: "पिके आणि मातीचे आरोग्य तपासत आहे...",
    geminiProcessing: "जेमिनी मॉडेल माहितीचे विश्लेषण करत आहे, कृपया प्रतीक्षा करा...",
    aiDiagnosisTitle: "AI पिक निदान",
    advisoryTalkback: "सल्ला ऐकणे",
    listenAdvice: "सल्ला ऐका",
    speaking: "वाचन सुरू आहे...",
    paused: "वाचन थांबले आहे",
    resume: "पुन्हा सुरू करा",
    pause: "थांबवा",
    stop: "बंद करा",
    soilAnalysisHeader: "AI मृदा विश्लेषण आणि पिक सल्ला",
    analyzingChemistry: "हवामान आणि जमिनीचे रासायनिक विश्लेषण करत आहे...",
    generatingBulletin: "निवडलेल्या भाषेत सल्ला बुलेटिन तयार करत आहे...",
    noAdvisoryTitle: "सल्ला बुलेटिन उपलब्ध नाही",
    noAdvisorySub: "हवामान/माती विश्लेषण इंजिन सुरू करण्यासाठी डाव्या बाजूला स्थान निर्देशांक असणे आवश्यक आहे।",
    saveSuccess: "सल्ला क्लाउडमध्ये जतन केला",
    saveSuccessSub: "कृषी केंद्र तज्ज्ञ पडताळणीची प्रतीक्षा आहे।"
  },
  Tamil: {
    subtitle: "செயற்கை நுண்ணறிவுடன் கூடிய பலமொழி விவசாய ஆலோசனை முறை",
    farmerId: "விவசாயி அடையாள எண்",
    chooseLang: "மொழியைத் தேர்ந்தெடுக்கவும்",
    locationTracking: "இருப்பிட கண்காணிப்பு (GPS)",
    acquiring: "இருப்பிடத்தைக் கண்டறிகிறது...",
    locFailed: "இருப்பிடத்தைக் கண்டறிவது தோல்வியடைந்தது",
    retryGps: "ஜிபிஎஸ் தேடலை மீண்டும் முயற்சிக்கவும்",
    gpsRequired: "நேரடி ஜிபிஎஸ் இருப்பிடம் தேவை",
    grantPerm: "அனுமதி வழங்கி ஜிபிஎஸ் கண்டறியவும்",
    detectedCoords: "தற்போதைய நேரடி இருப்பிட அளவுகள்",
    refreshLoc: "இருப்பிடத்தை புதுப்பிக்கவும்",
    soilTelemetry: "ஓபன்-மீட்டியோ மண் அளவீடுகள்",
    soilMoisture: "மண்ணின் ஈரப்பதம்",
    soilTemp: "மண்ணின் வெப்பநிலை",
    maxTemp: "அதிகபட்ச வெப்பநிலை",
    waitingTelemetry: "மண் அளவீடுகளைப் பெற இருப்பிடத்திற்காக காத்திருக்கிறது...",
    diagnosticHeader: "பயிர் & மண் நோய் கண்டறிதல் கேள்வி",
    diagnosticSub: "உங்கள் பயிர் நோய்/மண்ணின் புகைப்படத்தைப் பதிவேற்றவும், குரல் மூலம் விவரிக்கவும், அல்லது கீழே எழுதி நோய் கண்டறிதலைப் பெறவும்.",
    cropSnapshot: "1. பயிர் புகைப்படம்",
    snapPhoto: "புகைப்படம் எடுக்கவும் / பதிவேற்றவும்",
    cameraSupport: "கைபேசி கேமராவை ஆதரிக்கிறது",
    removePhoto: "புகைப்படத்தை நீக்கவும்",
    spokenQuery: "2. குரல் மூலம் கேள்வி",
    recordAudioSub: "உங்கள் மொழியில் குரல் கேள்வியைப் பதிவு செய்ய பொத்தானை அழுத்தவும்.",
    recording: "பதிவாகிறது",
    tapToSubmit: "முடிக்க மற்றும் அனுப்ப சிவப்பு மைக்கை அழுத்தவும்",
    typeDetails: "விவரங்களை உள்ளிடவும் (விருப்பத்தேர்வு)",
    textareaPlaceholder: "பிரச்சனையை விரிவாக எழுதவும் (எ.கா. இலைகள் மஞ்சள் நிறமாக மாறுகின்றன, மண் உலர்ந்துள்ளது)...",
    getAdvisoryBtn: "ஏஐ நோய் கண்டறிதலைப் பெறுக",
    analyzing: "புகைப்படம் மற்றும் உரை பகுப்பாய்வு செய்யப்படுகிறது...",
    diagnosingHealth: "பயிர் & மண்ணின் ஆரோக்கியத்தை ஆராய்கிறது...",
    geminiProcessing: "ஜெமினி மாடல் தகவலை ஆராய்கிறது. தயவுசெய்து காத்திருக்கவும்...",
    aiDiagnosisTitle: "ஏஐ பயிர் கண்டறிதல்",
    advisoryTalkback: "ஆலோசனை ஒலி வடிவம்",
    listenAdvice: "ஆலோசனையைக் கேள்",
    speaking: "ஒலிக்கிறது...",
    paused: "ஒலி நிறுத்தப்பட்டது",
    resume: "தொடரவும்",
    pause: "நிறுத்து",
    stop: "முடக்கு",
    soilAnalysisHeader: "ஏஐ மண் பகுப்பாய்வு & பயிர் ஆலோசனைகள்",
    analyzingChemistry: "காலநிலை மற்றும் மண்ணின் வேதியியலை பகுப்பாய்வு செய்கிறது...",
    generatingBulletin: "தேர்ந்தெடுக்கப்பட்ட மொழியில் ஆலோசனையை உருவாக்குகிறது...",
    noAdvisoryTitle: "ஆலோசனைகள் எதுவும் உருவாக்கப்படவில்லை",
    noAdvisorySub: "மண் மற்றும் காலநிலை பகுப்பாய்வைத் தொடங்க இடதுபுறப் பலகத்தில் இருப்பிடம் தேவை.",
    saveSuccess: "ஆலோசனை சேமிக்கப்பட்டது",
    saveSuccessSub: "விவசாய மைய நிபுணர் சரிபார்ப்புக்காக காத்திருக்கிறது."
  },
  Telugu: {
    subtitle: "ఏఐ ఆధారిత బహుభాషా వ్యవసాయ సలహా వ్యవస్థ",
    farmerId: "రైతు గుర్తింపు",
    chooseLang: "భాషను ఎంచుకోండి",
    locationTracking: "స్థాన గుర్తింపు (GPS)",
    acquiring: "స్థానాన్ని గుర్తిస్తోంది...",
    locFailed: "స్థాన గుర్తింపు విఫలమైంది",
    retryGps: "జీపీఎస్ ట్రాకింగ్ మళ్లీ ప్రయత్నించండి",
    gpsRequired: "లైవ్ జీపీఎస్ కోఆర్డినేట్స్ అవసరం",
    grantPerm: "అనుమతి ఇచ్చి జీపీఎస్ ఆన్ చేయండి",
    detectedCoords: "ప్రస్తుత లైవ్ కోఆర్డినేట్స్",
    refreshLoc: "స్థానాన్ని రిఫ్రెష్ చేయండి",
    soilTelemetry: "ఓపెన్-మెటియో సాయిల్ టెలిమెట్రీ",
    soilMoisture: "నేల తేమ",
    soilTemp: "నేల ఉష్ణోగ్రత",
    maxTemp: "గరిష్ట ఉష్ణోగ్రత",
    waitingTelemetry: "టెలిమెట్రీ డేటా కోసం వేచి ఉంది...",
    diagnosticHeader: "పంట & నేల వ్యాధి గుర్తింపు ప్రశ్న",
    diagnosticSub: "మీ పంట వ్యాధి/నేల ఫోటోను అప్‌లోడ్ చేయండి, వాయిస్ ద్వారా వివరించండి లేదా సలహా కోసం కింద రాయండి.",
    cropSnapshot: "1. పంట ఫోటో",
    snapPhoto: "ఫోటో తీయండి / అప్‌లోడ్ చేయండి",
    cameraSupport: "మొబైల్ కెమెరా సదుపాయం కలదు",
    removePhoto: "ఫోటోను తీసివేయండి",
    spokenQuery: "2. వాయిస్ ద్వారా ప్రశ్న",
    recordAudioSub: "మీ సొంత భాషలో వాయిస్ రికార్డ్ చేయడానికి బటన్ నొక్కండి.",
    recording: "రికార్డ్ అవుతోంది",
    tapToSubmit: "పూర్తి చేసి పంపడానికి ఎరుపు మైక్ నొక్కండి",
    typeDetails: "వివరాలు టైప్ చేయండి (ఐచ్ఛికం)",
    textareaPlaceholder: "సమస్యను టైప్ చేయండి (ఉదాహరణకు: ఆకులు పసుపు రంగులోకి మారుతున్నాయి, నేల ఎండిపోయింది)...",
    getAdvisoryBtn: "ఏఐ పంట సలహా పొందండి",
    analyzing: "ఫోటో మరియు టెక్స్ట్ విశ్లేషిస్తోంది...",
    diagnosingHealth: "పంట & నేల ఆరోగ్యాన్ని గుర్తిస్తోంది...",
    geminiProcessing: "జెమిని మోడల్ సమాచారాన్ని విశ్లేషిస్తోంది. దయచేసి వేచి ఉండండి...",
    aiDiagnosisTitle: "ఏఐ పంట నిర్ధారణ",
    advisoryTalkback: "సలహా వినడం",
    listenAdvice: "సలహా వినండి",
    speaking: "చదువుతోంది...",
    paused: "ఆపబడింది",
    resume: "మళ్లీ ప్రారంభించు",
    pause: "ఆపు",
    stop: "ముగించు",
    soilAnalysisHeader: "ఏఐ సాయిల్ అనాలిసిస్ & పంట సలహాలు",
    analyzingChemistry: "వాతావరణం మరియు నేల రసాయన విశ్లేషణ జరుగుతోంది...",
    generatingBulletin: "ఎంచుకున్న భాషలో సలహాను తయారు చేస్తోంది...",
    noAdvisoryTitle: "ఎటువంటి సలహా జెనరేట్ కాలేదు",
    noAdvisorySub: "నేల మరియు వాతావరణ విశ్లేషణను ప్రారంభించడానికి ఎడమ ప్యానెల్‌లో స్థాన గుర్తింపు అవసరం.",
    saveSuccess: "సలహా క్లౌడ్‌లో సేవ్ చేయబడింది",
    saveSuccessSub: "వ్యవసాయ కేంద్ర నిపుణుల ధృవీకరణ కోసం వేచి ఉంది."
  }
};

export default function FarmerDashboard({ selectedLang, setSelectedLang }) {
  
  const [farmerId, setFarmerId] = useState(() => {
    let id = localStorage.getItem("kisan_farmer_id");
    if (!id) {
      id = "KISAN_FARMER_" + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem("kisan_farmer_id", id);
    }
    return id;
  });

  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [locMethod, setLocMethod] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const translations = t[selectedLang] || t["English"];

  const [soilData, setSoilData] = useState(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);
  const [telemetryError, setTelemetryError] = useState(null);
  const [cropAdvisory, setCropAdvisory] = useState("");
  const [isGeneratingAdvisory, setIsGeneratingAdvisory] = useState(false);

  const [userTextQuery, setUserTextQuery] = useState("");
  const [snapshotBase64, setSnapshotBase64] = useState("");
  const [snapshotMimeType, setSnapshotMimeType] = useState("");
  const [snapshotFileName, setSnapshotFileName] = useState("");
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceAdvisory, setVoiceAdvisory] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState(null);

  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [isPausedSpeech, setIsPausedSpeech] = useState(false);
  const [currentSpeechSource, setCurrentSpeechSource] = useState(null);

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const audioRef = useRef(null);
  const currentSpeechIndexRef = useRef(0);
  const speechChunksRef = useRef([]);
  const ttsAccumulatorRef = useRef("");
  const ttsActiveStreamSourceRef = useRef(null);
  const ttsPlayingRef = useRef(false);

  useEffect(() => {
    requestLocation();
    
    const cachedVoiceAdvisory = localStorage.getItem("kisan_cached_voice_advisory");
    if (cachedVoiceAdvisory) {
      setVoiceAdvisory(cachedVoiceAdvisory);
      setChatMessages([
        {
          id: "cached-user",
          role: "user",
          text: "Previous Crop Health Assessment",
          timestamp: new Date()
        },
        {
          id: "cached-ai",
          role: "model",
          text: cachedVoiceAdvisory,
          timestamp: new Date()
        }
      ]);
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
    
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingSeconds(0);
    }
  }, [isRecording]);

  const requestLocation = () => {
    setIsLocating(true);
    setGeoError(null);
    setLocMethod(translations.acquiring);
    
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by browser. Trying Network IP fallback...");
      fetchIPLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lng = position.coords.longitude.toFixed(4);
        setCoords({ lat, lng });
        setLocMethod("GPS (High Accuracy)");
        setIsLocating(false);
        loadTelemetryAndAdvisory(lat, lng);
      },
      (error) => {
        console.warn("High accuracy GPS failed. Trying standard GPS...", error);
        setLocMethod("GPS (Standard Accuracy)...");
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude.toFixed(4);
            const lng = position.coords.longitude.toFixed(4);
            setCoords({ lat, lng });
            setLocMethod("GPS (Standard Accuracy)");
            setIsLocating(false);
            loadTelemetryAndAdvisory(lat, lng);
          },
          (error) => {
            console.warn("Standard GPS failed. Trying IP Geolocation fallback...", error);
            fetchIPLocation();
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const fetchIPLocation = async () => {
    setLocMethod("IP Geolocation...");
    try {
      const response = await fetch("https://ipapi.co/json/");
      if (!response.ok) throw new Error("IP Geolocation request failed");
      const data = await response.json();
      if (data.latitude && data.longitude) {
        const lat = parseFloat(data.latitude).toFixed(4);
        const lng = parseFloat(data.longitude).toFixed(4);
        setCoords({ lat, lng });
        setLocMethod("IP Geolocation");
        loadTelemetryAndAdvisory(lat, lng);
      } else {
        throw new Error("Missing coordinates in IP payload");
      }
    } catch (err) {
      console.error(err);
      setGeoError(translations.locFailed);
      setLocMethod("Detection Failed");
    } finally {
      setIsLocating(false);
    }
  };

  const loadTelemetryAndAdvisory = async (lat, lng) => {
    setIsLoadingTelemetry(true);
    setTelemetryError(null);
    setSoilData(null);
    setCropAdvisory("");

    const roundedLat = parseFloat(lat).toFixed(3);
    const roundedLng = parseFloat(lng).toFixed(3);
    const cacheKey = `kisan_telemetry_${roundedLat}_${roundedLng}_${selectedLang}`;
    
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { soil } = JSON.parse(cached);
        setSoilData(soil);
        setIsLoadingTelemetry(false);
        setIsGeneratingAdvisory(false);
        return;
      } catch (e) {
        console.warn("Error parsing cache, fetching fresh...", e);
      }
    }
    
    try {
      const data = await fetchSoilTelemetry(lat, lng);
      if (data.error) {
        throw new Error(data.message);
      }
      setSoilData(data);
      
      const toCache = { soil: data };
      localStorage.setItem(cacheKey, JSON.stringify(toCache));
      
    } catch (err) {
      console.error(err);
      setTelemetryError(err.message || "Failed to download soil telemetry.");
    } finally {
      setIsLoadingTelemetry(false);
      setIsGeneratingAdvisory(false);
    }
  };

  const triggerSaveBanner = () => {
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 4000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSnapshotFileName(file.name);
    setIsCompressingImage(true);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setSnapshotBase64(dataUrl);
        setSnapshotMimeType("image/jpeg");
        setIsCompressingImage(false);
      };
      img.onerror = () => {
        setIsCompressingImage(false);
        setVoiceError("Unable to compress selected image.");
      };
    };
    reader.onerror = () => {
      setIsCompressingImage(false);
      setVoiceError("Unable to read selected image.");
    };
  };

  const removeSnapshot = () => {
    setSnapshotBase64("");
    setSnapshotMimeType("");
    setSnapshotFileName("");
  };

  const getSupportedAudioMimeType = () => {
    const types = ["audio/webm", "audio/ogg", "audio/mp4", "audio/aac", "audio/wav"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ""; 
  };

  const startRecordingAudio = async () => {
    setVoiceError(null);
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        await handleAudioProcess(audioBlob);
        
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); 
      setIsRecording(true);
    } catch (err) {
      console.error("Audio recording error:", err);
      setVoiceError("Microphone permission blocked or unavailable.");
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopRecordingAudio();
    } else {
      startRecordingAudio();
    }
  };

  const handleAudioProcess = async (audioBlob) => {
    setIsProcessingVoice(true);
    setVoiceError(null);

    const userText = userTextQuery || "Spoken voice query";
    const userMsgId = Date.now();
    const aiMsgId = userMsgId + 1;

    const userMsg = {
      id: userMsgId,
      role: "user",
      text: userText,
      image: snapshotBase64 || null,
      audio: true,
      timestamp: new Date()
    };
    
    const aiMsg = {
      id: aiMsgId,
      role: "model",
      text: "",
      isStreaming: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg, aiMsg]);
    setVoiceAdvisory("");

    try {
      const advisory = await diagnoseVoiceQueryStream(
        audioBlob,
        snapshotBase64 || null,
        snapshotMimeType || "image/jpeg",
        userTextQuery || null,
        selectedLang,
        (chunk) => {
          setVoiceAdvisory((prev) => prev + chunk);
          setChatMessages(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, text: msg.text + chunk } : msg
          ));
        }
      );
      
      setChatMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, isStreaming: false, text: advisory } : msg
      ));

      localStorage.setItem("kisan_cached_voice_advisory", advisory);

      await addDoc(collection(db, "farmer_history"), {
        farmer_id: farmerId,
        timestamp: new Date().toISOString(),
        ai_diagnosis: advisory,
        status: "Pending RSK Review",
        latitude: coords ? coords.lat : "Unknown",
        longitude: coords ? coords.lng : "Unknown",
        query_type: "Voice Note Query",
        snapshot_base_64: snapshotBase64 || null,
        user_query_text: userTextQuery || null
      });

      setUserTextQuery("");
      removeSnapshot();
      triggerSaveBanner();
    } catch (err) {
      console.error(err);
      setVoiceError("Unable to diagnose speech. Check Firebase/Google settings.");
      setChatMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, isStreaming: false, text: "⚠️ Error: Failed to generate response. Please try again." } : msg
      ));
    } finally {
      setIsProcessingVoice(false);
      setChatMessages(prev => prev.map(msg => 
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      ));
    }
  };

  const handleDiagnoseWithoutVoice = async () => {
    if (!snapshotBase64 && !userTextQuery) {
      setVoiceError("Please upload a photo, record audio, or enter custom text first.");
      return;
    }
    setIsProcessingVoice(true);
    setVoiceError(null);

    const userText = userTextQuery || "Uploaded crop snapshot";
    const userMsgId = Date.now();
    const aiMsgId = userMsgId + 1;

    const userMsg = {
      id: userMsgId,
      role: "user",
      text: userText,
      image: snapshotBase64 || null,
      audio: false,
      timestamp: new Date()
    };
    
    const aiMsg = {
      id: aiMsgId,
      role: "model",
      text: "",
      isStreaming: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg, aiMsg]);
    setVoiceAdvisory("");

    try {
      const advisory = await diagnoseVoiceQueryStream(
        null,
        snapshotBase64 || null,
        snapshotMimeType || "image/jpeg",
        userTextQuery || null,
        selectedLang,
        (chunk) => {
          setVoiceAdvisory((prev) => prev + chunk);
          setChatMessages(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, text: msg.text + chunk } : msg
          ));
        }
      );

      setChatMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, isStreaming: false, text: advisory } : msg
      ));

      localStorage.setItem("kisan_cached_voice_advisory", advisory);

      await addDoc(collection(db, "farmer_history"), {
        farmer_id: farmerId,
        timestamp: new Date().toISOString(),
        ai_diagnosis: advisory,
        status: "Pending RSK Review",
        latitude: coords ? coords.lat : "Unknown",
        longitude: coords ? coords.lng : "Unknown",
        query_type: "Snapshot & Text Query",
        snapshot_base_64: snapshotBase64 || null,
        user_query_text: userTextQuery || null
      });

      setUserTextQuery("");
      removeSnapshot();
      triggerSaveBanner();
    } catch (err) {
      console.error(err);
      setVoiceError("Advisory request failed. Verify your connection.");
      setChatMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, isStreaming: false, text: "⚠️ Error: Failed to generate response. Please try again." } : msg
      ));
    } finally {
      setIsProcessingVoice(false);
      setChatMessages(prev => prev.map(msg => 
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      ));
    }
  };

  const getSpeechChunks = (text) => {
    const cleanText = text
      .replace(/[\#\*\-\•\_\`]/g, "")
      .replace(/(हिन्दी|मराठी|தமிழ்|తెలుగు|English)\:/gi, "")
      .trim();
      
    const sentences = cleanText.split(/[।\.!\?\n\r]+/);
    const chunks = [];
    let currentChunk = "";
    
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      if (!cleanSentence) continue;
      
      if ((currentChunk + " " + cleanSentence).length > 180) {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = cleanSentence;
      } else {
        currentChunk = currentChunk ? currentChunk + " " + cleanSentence : cleanSentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  };

  const initStreamingTTS = (sourceId, lang) => {
    stopSpeech();
    ttsActiveStreamSourceRef.current = sourceId;
    ttsAccumulatorRef.current = "";
    speechChunksRef.current = [];
    currentSpeechIndexRef.current = 0;
    ttsPlayingRef.current = false;
  };

  const feedStreamingTTS = (chunk, sourceId, lang) => {
    ttsAccumulatorRef.current += chunk;
    
    const tlMap = {
      "English": "en",
      "Hindi": "hi",
      "Marathi": "mr",
      "Tamil": "ta",
      "Telugu": "te"
    };
    const tl = tlMap[lang] || "en";

    let text = ttsAccumulatorRef.current;
    const matches = [...text.matchAll(/[।\.!\?\n]/g)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const endIdx = lastMatch.index + lastMatch[0].length;
      const completedPart = text.substring(0, endIdx);
      const remainingPart = text.substring(endIdx);
      
      ttsAccumulatorRef.current = remainingPart;

      const sentences = completedPart.split(/[।\.!\?\n\r]+/);
      for (const sentence of sentences) {
        const clean = sentence
          .replace(/[\#\*\-\•\_\`]/g, "")
          .replace(/(हिन्दी|मराठी|தமிழ்|తెలుగు|English)\:/gi, "")
          .trim();
        if (clean.length > 3) {
          speechChunksRef.current.push(clean);
        }
      }

      if (speechChunksRef.current.length > currentSpeechIndexRef.current) {
        triggerPlaybackIfIdle(sourceId, tl);
      }
    }
  };

  const finishStreamingTTS = (sourceId, lang) => {
    const tlMap = {
      "English": "en",
      "Hindi": "hi",
      "Marathi": "mr",
      "Tamil": "ta",
      "Telugu": "te"
    };
    const tl = tlMap[lang] || "en";

    if (ttsAccumulatorRef.current.trim()) {
      const remaining = ttsAccumulatorRef.current
        .replace(/[\#\*\-\•\_\`]/g, "")
        .replace(/(हिन्दी|मराठी|தமிழ்|తెలుగు|English)\:/gi, "")
        .trim();
      if (remaining.length > 0) {
        speechChunksRef.current.push(remaining);
      }
      ttsAccumulatorRef.current = "";
    }

    ttsActiveStreamSourceRef.current = null;
    if (speechChunksRef.current.length > currentSpeechIndexRef.current) {
      triggerPlaybackIfIdle(sourceId, tl);
    }
  };

  const triggerPlaybackIfIdle = (sourceId, tl) => {
    if (ttsPlayingRef.current) return;
    playNextChunk(sourceId, tl);
  };

  const playNextChunk = (sourceId, tl) => {
    const idx = currentSpeechIndexRef.current;
    
    if (idx >= speechChunksRef.current.length) {
      if (!ttsActiveStreamSourceRef.current) {
        
        setIsPlayingSpeech(false);
        setIsPausedSpeech(false);
        setCurrentSpeechSource(null);
        ttsPlayingRef.current = false;
      } else {
        
        ttsPlayingRef.current = false;
      }
      return;
    }
    
    ttsPlayingRef.current = true;
    setIsPlayingSpeech(true);
    setCurrentSpeechSource(sourceId);
    
    const chunkText = speechChunksRef.current[idx];
    const detectedLang = tl + "-" + (tl === "en" ? "US" : "IN");
    
    const onChunkEnded = () => {
      currentSpeechIndexRef.current++;
      playNextChunk(sourceId, tl);
    };
    
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(chunkText)}`;
    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.onended = onChunkEnded;
    audio.onerror = (e) => {
      console.warn("Google TTS chunk error, falling back locally...", e);
      speakLocally(chunkText, detectedLang, onChunkEnded);
    };
    
    audio.play().catch((err) => {
      console.warn("Google TTS blocked, falling back locally...", err);
      speakLocally(chunkText, detectedLang, onChunkEnded);
    });
  };

  const startFullSpeech = (text, sourceId) => {
    stopSpeech();
    
    const chunks = getSpeechChunks(text);
    if (chunks.length === 0) return;
    
    const detectedLang = detectLangFromText(text);
    const tl = detectedLang.split("-")[0];
    
    speechChunksRef.current = chunks;
    currentSpeechIndexRef.current = 0;
    ttsActiveStreamSourceRef.current = null;
    
    triggerPlaybackIfIdle(sourceId, tl);
  };

  const speakLocally = (text, langCode, onEndCallback) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 0.92;
      
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = langCode.split("-")[0];
      const matchedVoice = voices.find((v) => {
        const vLang = v.lang.toLowerCase().replace("_", "-");
        return vLang === langCode.toLowerCase() || vLang.startsWith(langPrefix);
      });
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      utterance.onend = onEndCallback;
      utterance.onerror = onEndCallback;
      window.speechSynthesis.speak(utterance);
    } else {
      onEndCallback();
    }
  };

  const pauseSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPausedSpeech(true);
    } else if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPausedSpeech(true);
    }
  };

  const resumeSpeech = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
      setIsPausedSpeech(false);
    } else if ("speechSynthesis" in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPausedSpeech(false);
    }
  };

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsPlayingSpeech(false);
    setIsPausedSpeech(false);
    setCurrentSpeechSource(null);
    speechChunksRef.current = [];
    currentSpeechIndexRef.current = 0;
    ttsActiveStreamSourceRef.current = null;
    ttsAccumulatorRef.current = "";
    ttsPlayingRef.current = false;
  };

  const speakSingleLineText = (lineText) => {
    stopSpeech();
    const detectedLang = detectLangFromText(lineText);
    const tl = detectedLang.split("-")[0];
    const cleanText = lineText.replace(/[\#\*\-\•\_\`]/g, "").trim();
    if (!cleanText) return;
    
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.play().catch((err) => {
      console.warn("Single line Google TTS play blocked, trying local speech...", err);
      speakLocally(cleanText, detectedLang, () => {});
    });
  };

  const detectLangFromText = (text) => {
    if (/[\u0B80-\u0BFF]/.test(text)) return "ta-IN"; 
    if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN"; 
    if (/[\u0900-\u097F]/.test(text)) {
      const lower = text.toLowerCase();
      
      if (
        lower.includes("मराठी") || 
        lower.includes("पिके") || 
        lower.includes("शिफारस") || 
        lower.includes("जमीन") || 
        lower.includes("तुम्ही") || 
        lower.includes("शेतकरी") || 
        lower.includes("सल्ला")
      ) {
        return "mr-IN";
      }
      return "hi-IN";
    }
    return "en-IN";
  };

  const SpeechPlayerControls = ({ text, id }) => {
    const isPlayingThis = isPlayingSpeech && currentSpeechSource === id;
    return (
      <div className="flex items-center gap-2 mb-4 bg-brand-950/60 p-3 rounded-2xl border border-brand-800/40 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className={isPlayingThis && !isPausedSpeech ? "text-brand-400 animate-pulse" : "text-gray-400"} size={18} />
          <span className="text-xs text-gray-300 font-bold uppercase tracking-wider">
            {isPlayingThis ? (isPausedSpeech ? translations.paused : translations.speaking) : translations.advisoryTalkback}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {isPlayingThis ? (
            <>
              {isPausedSpeech ? (
                <button
                  type="button"
                  onClick={resumeSpeech}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Play size={12} /> {translations.resume}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseSpeech}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Pause size={12} /> {translations.pause}
                </button>
              )}
              <button
                type="button"
                onClick={stopSpeech}
                className="bg-red-650 hover:bg-red-755 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <VolumeX size={12} /> {translations.stop}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => startFullSpeech(text, id)}
              className="bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md shadow-brand-500/10"
            >
              <Play size={12} /> {translations.listenAdvice}
            </button>
          )}
          
          {isPlayingThis && !isPausedSpeech && (
            <div className="flex items-end gap-0.5 h-4 px-2">
              <span className="voice-wave-bar"></span>
              <span className="voice-wave-bar"></span>
              <span className="voice-wave-bar"></span>
              <span className="voice-wave-bar"></span>
              <span className="voice-wave-bar"></span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderScannableAdvisory = (markdownText) => {
    if (!markdownText) return null;
    
    const lines = markdownText.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2"></div>;

      if (trimmed.startsWith("###")) {
        const textVal = trimmed.replace("###", "").trim();
        return (
          <h3 key={idx} className="text-sm font-extrabold text-brand-300 mt-4 mb-2 border-b border-brand-900/30 pb-1.5 tracking-wide">
            {textVal}
          </h3>
        );
      }

      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        const textVal = trimmed.replace(/\*\*/g, "").trim();
        return (
          <h4 key={idx} className="text-xs font-bold text-accent-amber mt-3 mb-1.5">
            {textVal}
          </h4>
        );
      }

      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const textVal = trimmed.substring(1).trim();
        const cleanParts = textVal.split("**");

        const inlineElements = cleanParts.map((part, pIdx) => {
          if (pIdx % 2 === 1) {
            return <strong key={pIdx} className="text-accent-gold font-bold">{part}</strong>;
          }
          return part;
        });

        return (
          <li key={idx} className="ml-4 list-disc text-gray-200 py-1 text-xs leading-relaxed">
            {inlineElements}
          </li>
        );
      }

      const cleanParts = trimmed.split("**");
      const inlineElements = cleanParts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="text-accent-gold font-bold">{part}</strong>;
        }
        return part;
      });

      return (
        <p key={idx} className="text-gray-300 py-0.5 text-xs leading-relaxed">
          {inlineElements}
        </p>
      );
    });
  };

  const currentTemp = soilData?.hourly?.soil_temperature_6cm?.[0] !== undefined 
    ? `${soilData.hourly.soil_temperature_6cm[0]} °C` 
    : "N/A";
  const currentMoisture = soilData?.hourly?.soil_moisture_3_to_9cm?.[0] !== undefined 
    ? `${soilData.hourly.soil_moisture_3_to_9cm[0]} m³/m³` 
    : "N/A";
  const currentMaxAirTemp = soilData?.daily?.temperature_2m_max?.[0] !== undefined 
    ? `${soilData.daily.temperature_2m_max[0]} °C` 
    : "N/A";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      
      {}
      {showSaveSuccess && (
        <div className="fixed top-20 right-4 z-50 glass-panel-glow bg-brand-900/90 text-brand-100 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-brand-500/30 animate-slide-in">
          <CheckCircle className="text-brand-400 animate-bounce" size={24} />
          <div>
            <p className="font-bold text-sm">{translations.saveSuccess}</p>
            <p className="text-xs text-brand-300">{translations.saveSuccessSub}</p>
          </div>
        </div>
      )}

      {}
      <div className="glass-panel-glow rounded-3xl p-6 mb-8 border border-brand-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-brand-500/10 p-20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sprout className="text-brand-400" size={26} />
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Kisan Portal</h1>
            </div>
            <p className="text-gray-400 text-sm">{translations.subtitle}</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-end md:items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
            {}
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs text-brand-400 uppercase tracking-widest font-bold flex items-center gap-1">
                <Globe size={12} /> {translations.chooseLang}
              </span>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-dark-card border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold shadow-inner"
              >
                <option value="English" className="bg-dark-bg text-white">English</option>
                <option value="Hindi" className="bg-dark-bg text-white">हिन्दी (Hindi)</option>
                <option value="Marathi" className="bg-dark-bg text-white">मराठी (Marathi)</option>
                <option value="Tamil" className="bg-dark-bg text-white">தமிழ் (Tamil)</option>
                <option value="Telugu" className="bg-dark-bg text-white">తెలుగు (Telugu)</option>
              </select>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-brand-400 uppercase tracking-widest font-bold">{translations.farmerId}</span>
              <div className="bg-brand-950/80 px-4 py-1.5 rounded-xl border border-brand-800 text-accent-gold font-mono font-bold text-sm shadow-inner">
                {farmerId}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {}
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="text-brand-400" size={18} />
              {translations.locationTracking}
            </h2>

            {isLocating ? (
              <div className="flex flex-col items-center justify-center p-6 bg-brand-950/20 rounded-2xl border border-brand-900/40 mb-4 gap-3 text-center">
                <Loader2 className="animate-spin text-brand-500" size={24} />
                <div>
                  <span className="text-sm font-semibold text-white">{translations.acquiring}</span>
                  <p className="text-[10px] text-gray-400 mt-1">{locMethod}</p>
                </div>
              </div>
            ) : geoError && !coords ? (
              <div className="bg-red-950/40 border border-red-500/20 text-red-200 p-4 rounded-2xl mb-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-sm">
                    <p className="font-bold">{translations.locFailed}</p>
                    <p className="text-xs text-red-300 mt-1">{geoError}</p>
                  </div>
                </div>
                <button
                  onClick={requestLocation}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition mt-2"
                >
                  {translations.grantPerm}
                </button>
              </div>
            ) : coords ? (
              <div className="bg-brand-950/40 border border-brand-800 p-4 rounded-2xl mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-brand-900 border border-brand-800 text-[9px] font-bold text-brand-300 uppercase tracking-widest mb-1.5">
                      {locMethod}
                    </span>
                    <p className="text-xs text-gray-400">{translations.detectedCoords}</p>
                    <p className="font-mono text-white text-base font-bold mt-0.5">
                      Lat: {coords.lat} | Lng: {coords.lng}
                    </p>
                  </div>
                  <button 
                    onClick={requestLocation}
                    className="bg-brand-900 hover:bg-brand-700 text-brand-300 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Compass size={12} className={isLocating ? "animate-spin" : ""} /> {translations.refreshLoc}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-brand-950/20 rounded-2xl border border-brand-900/40 mb-4 gap-2 text-center">
                <p className="text-sm text-gray-400">{translations.gpsRequired}</p>
                <button
                  onClick={requestLocation}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition mt-2"
                >
                  {translations.grantPerm}
                </button>
              </div>
            )}
          </div>

          {}
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Thermometer className="text-brand-400" size={18} />
              {translations.soilTelemetry}
            </h2>
            
            {telemetryError && (
              <div className="bg-red-950/20 border border-red-500/30 text-red-200 p-4 rounded-2xl mb-4 flex gap-2">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm">{telemetryError}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {}
              <div className="bg-brand-950/50 border border-brand-900/60 p-4 rounded-2xl flex flex-col justify-between text-center relative overflow-hidden group hover:border-brand-500/30 transition">
                <div className="text-brand-400 mx-auto mb-2 p-2 rounded-xl bg-brand-500/5 group-hover:bg-brand-500/10">
                  <Droplets size={22} />
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-gray-400 tracking-wider font-semibold">{translations.soilMoisture}</span>
                  <span className="block text-sm font-extrabold text-white mt-1 font-mono tracking-tight">{currentMoisture}</span>
                </div>
              </div>
              
              {}
              <div className="bg-brand-950/50 border border-brand-900/60 p-4 rounded-2xl flex flex-col justify-between text-center relative overflow-hidden group hover:border-brand-500/30 transition">
                <div className="text-brand-400 mx-auto mb-2 p-2 rounded-xl bg-brand-500/5 group-hover:bg-brand-500/10">
                  <Thermometer size={22} />
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-gray-400 tracking-wider font-semibold">{translations.soilTemp}</span>
                  <span className="block text-sm font-extrabold text-white mt-1 font-mono tracking-tight">{currentTemp}</span>
                </div>
              </div>

              {}
              <div className="bg-brand-950/50 border border-brand-900/60 p-4 rounded-2xl flex flex-col justify-between text-center relative overflow-hidden group hover:border-brand-500/30 transition">
                <div className="text-brand-400 mx-auto mb-2 p-2 rounded-xl bg-brand-500/5 group-hover:bg-brand-500/10">
                  <Sun size={22} />
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-gray-400 tracking-wider font-semibold">{translations.maxTemp}</span>
                  <span className="block text-sm font-extrabold text-white mt-1 font-mono tracking-tight">{currentMaxAirTemp}</span>
                </div>
              </div>
            </div>

            {(!soilData && !isLoadingTelemetry) && (
              <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center gap-1 mt-2">
                <Compass className="text-gray-700 animate-spin" size={24} />
                {translations.waitingTelemetry}
              </div>
            )}
          </div>
        </div>

        {}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {}
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-brand-500/10 flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Sprout className="text-brand-400" size={18} />
                {translations.diagnosticHeader}
              </h2>
              <p className="text-xs text-gray-400">
                {translations.diagnosticSub}
              </p>
            </div>

            {}
            {chatMessages.length > 0 && (
              <div className="flex flex-col gap-4 max-h-[30rem] overflow-y-auto pr-2 custom-scrollbar bg-brand-950/20 border border-brand-900/30 p-4 rounded-2xl">
                {chatMessages.map((msg, mIdx) => {
                  const isUser = msg.role === "user";
                  return (
                    <div 
                      key={msg.id || mIdx} 
                      className={`flex gap-3 max-w-[85%] ${isUser ? "self-end flex-row-reverse" : "self-start"}`}
                    >
                      {}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shadow flex-shrink-0 ${
                        isUser 
                          ? "bg-brand-500 text-white" 
                          : "bg-gradient-to-tr from-accent-amber to-brand-500 text-white"
                      }`}>
                        {isUser ? "USER" : "AI"}
                      </div>

                      {}
                      <div className={`p-4 rounded-2xl shadow-md flex flex-col gap-2 ${
                        isUser 
                          ? "bg-brand-900/60 border border-brand-850 rounded-tr-none text-white text-xs leading-relaxed" 
                          : "bg-brand-950/50 border border-brand-850 rounded-tl-none text-gray-200"
                      }`}>
                        {isUser && msg.image && (
                          <img 
                            src={msg.image} 
                            alt="User attachment" 
                            className="max-h-32 object-contain rounded-lg border border-brand-800 bg-black/40"
                          />
                        )}
                        {isUser && msg.audio && (
                          <div className="flex items-center gap-1.5 text-brand-400 font-bold text-[10px] uppercase tracking-wider">
                            <Mic size={10} className="animate-pulse" />
                            <span>Voice Query Attached</span>
                          </div>
                        )}
                        
                        {!isUser ? (
                          <>
                            {msg.isStreaming && (
                              <div className="flex justify-end items-center mb-2">
                                <div className="flex items-center gap-1.5 text-[9px] text-brand-400 font-bold uppercase tracking-wider animate-pulse bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
                                  <Loader2 className="animate-spin" size={8} />
                                  <span>Streaming...</span>
                                </div>
                              </div>
                            )}
                            <div className="prose prose-invert max-w-none text-xs space-y-1.5">
                              {renderScannableAdvisory(msg.text)}
                            </div>
                          </>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {}
              <div className="bg-brand-950/40 border border-brand-850 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="block text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-brand-400" /> {translations.cropSnapshot}
                  </span>
                  
                  {snapshotBase64 ? (
                    <div className="relative rounded-xl overflow-hidden border border-brand-800 bg-brand-950/50">
                      <img
                        src={snapshotBase64}
                        alt="Crop Snapshot Preview"
                        className="w-full max-h-48 object-contain bg-black/40 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={removeSnapshot}
                        className="absolute top-2 right-2 p-2 rounded-full bg-red-950/90 hover:bg-red-650 text-white transition shadow border border-red-500/20"
                        title={translations.removePhoto}
                      >
                        <Trash2 size={12} />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-brand-950/90 text-brand-300 text-[9px] px-2 py-0.5 rounded font-mono truncate max-w-[80%] border border-brand-800">
                        {snapshotFileName}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 min-h-[12rem]">
                      {}
                      <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-800/80 hover:border-brand-500/50 cursor-pointer bg-brand-950/20 hover:bg-brand-950/30 group transition-all duration-300">
                        <label htmlFor="camera-upload" className="flex flex-col items-center justify-center p-4 text-center cursor-pointer pointer-events-none">
                          <div className="text-brand-400 mb-2 p-2.5 rounded-2xl bg-brand-500/5 group-hover:bg-brand-500/10 group-hover:scale-110 transition duration-300">
                            <Camera size={24} />
                          </div>
                          <span className="text-xs font-bold text-white tracking-wide uppercase">Live Camera</span>
                          <p className="text-[8px] text-gray-500 mt-1 max-w-[90%] mx-auto leading-relaxed">
                            Snap photo directly
                          </p>
                        </label>
                        <input
                          id="camera-upload"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageChange}
                          disabled={isProcessingVoice || isCompressingImage}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>

                      {}
                      <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-800/80 hover:border-brand-500/50 cursor-pointer bg-brand-950/20 hover:bg-brand-950/30 group transition-all duration-300">
                        <label htmlFor="gallery-upload" className="flex flex-col items-center justify-center p-4 text-center cursor-pointer pointer-events-none">
                          <div className="text-brand-400 mb-2 p-2.5 rounded-2xl bg-brand-500/5 group-hover:bg-brand-500/10 group-hover:scale-110 transition duration-300">
                            <ImageIcon size={24} />
                          </div>
                          <span className="text-xs font-bold text-white tracking-wide uppercase">Photo Album</span>
                          <p className="text-[8px] text-gray-500 mt-1 max-w-[90%] mx-auto leading-relaxed">
                            Upload from device
                          </p>
                        </label>
                        <input
                          id="gallery-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          disabled={isProcessingVoice || isCompressingImage}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {}
              <div className="bg-brand-950/40 border border-brand-850 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="block text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
                    <Mic size={14} className="text-brand-400" /> {translations.spokenQuery}
                  </span>
                  
                  <div className="flex flex-col items-center justify-center py-2">
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      disabled={isProcessingVoice || isCompressingImage}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 shadow-lg ${
                        isRecording 
                          ? "bg-red-650 hover:bg-red-755 text-white pulsing-ring-recording shadow-red-500/20" 
                          : "bg-brand-500 hover:bg-brand-600 text-white pulsing-ring shadow-brand-500/20"
                      } disabled:opacity-50`}
                    >
                      {isRecording ? (
                        <MicOff size={30} className="animate-pulse" />
                      ) : (
                        <Mic size={30} />
                      )}
                    </button>
                    {isRecording && (
                      <div className="absolute w-20 h-20 rounded-full border border-red-500 animate-ping opacity-50 pointer-events-none"></div>
                    )}
                    
                    <div className="text-center mt-3">
                      {isRecording ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 text-[10px] font-bold animate-pulse">
                            {translations.recording} {recordingSeconds}s
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1">{translations.tapToSubmit}</p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          {translations.recordAudioSub}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                {translations.typeDetails}
              </label>
              <textarea
                value={userTextQuery}
                onChange={(e) => setUserTextQuery(e.target.value)}
                placeholder={translations.textareaPlaceholder}
                rows="2"
                className="w-full bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 shadow-inner resize-none font-sans"
              />
            </div>

             {}
             {!isRecording && (
               <button
                 type="button"
                 onClick={handleDiagnoseWithoutVoice}
                 disabled={isProcessingVoice || isCompressingImage || (!snapshotBase64 && !userTextQuery)}
                 className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-900/30 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition duration-300 shadow-lg shadow-brand-500/20 disabled:shadow-none flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
               >
                 {isProcessingVoice ? (
                   <>
                     <Loader2 className="animate-spin" size={16} />
                     {translations.analyzing}
                   </>
                 ) : (
                   <>
                     <Sprout size={16} />
                     {translations.getAdvisoryBtn}
                   </>
                 )}
               </button>
             )}

            {(isProcessingVoice && !voiceAdvisory) && (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2 mt-4 bg-brand-950/20 border border-brand-900/30 rounded-2xl">
                <Loader2 className="animate-spin text-brand-500" size={24} />
                <p className="text-xs text-gray-300 font-bold">{translations.diagnosingHealth}</p>
                <p className="text-[9px] text-gray-500">{translations.geminiProcessing}</p>
              </div>
            )}

            {voiceError && (
              <p className="text-xs text-red-400 font-semibold mt-3 flex items-center gap-1.5 bg-red-950/30 border border-red-500/10 p-3 rounded-xl">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <span>{voiceError}</span>
              </p>
            )}

          </div>

          {}
          <div className="glass-panel rounded-3xl p-6 border border-brand-500/15 flex flex-col relative overflow-hidden bg-gradient-to-br from-brand-950/80 to-dark-card/90 shadow-2xl">
            {}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-gold/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2.5 relative z-10 border-b border-brand-900/60 pb-3">
              <Sprout className="text-brand-400 animate-pulse" size={20} />
              <span className="uppercase tracking-wider text-xs font-black text-brand-200">Engine Developers</span>
            </h2>

            <div className="flex flex-col gap-5 relative z-10">
              {}
              <div className="flex items-center gap-4 bg-brand-900/20 border border-brand-800/40 p-4 rounded-2xl hover:border-brand-500/30 transition-all duration-300 hover:shadow-lg group">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-extrabold text-lg shadow-md group-hover:scale-105 transition-transform duration-300">
                  RA
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide uppercase group-hover:text-brand-400 transition-colors">
                    REHAN ANSARI
                  </h3>
                  <p className="text-[10px] font-semibold text-brand-300/90 mt-0.5 tracking-wider font-mono">
                    SE STUDENT • COMPUTER ENGINEERING
                  </p>
                  <p className="text-[9px] text-gray-400 mt-1 leading-relaxed">
                    Responsible for AI core logic implementation, key-rotation fallback engines, and dynamic SSE streaming integration.
                  </p>
                </div>
              </div>

              {}
              <div className="flex items-center gap-4 bg-brand-900/20 border border-brand-800/40 p-4 rounded-2xl hover:border-brand-500/30 transition-all duration-300 hover:shadow-lg group">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-gold to-accent-amber flex items-center justify-center text-white font-extrabold text-lg shadow-md group-hover:scale-105 transition-transform duration-300">
                  AW
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide uppercase group-hover:text-accent-gold transition-colors">
                    ANISH WANI
                  </h3>
                  <p className="text-[10px] font-semibold text-accent-gold/90 mt-0.5 tracking-wider font-mono">
                    SE STUDENT • INFORMATION TECHNOLOGY
                  </p>
                  <p className="text-[9px] text-gray-400 mt-1 leading-relaxed">
                    Responsible for meteorological soil telemetry, location services (GPS mapping), and visual interface development.
                  </p>
                </div>
              </div>
            </div>

            {}
            <div className="mt-8 text-center text-[10px] text-gray-550 border-t border-brand-900/30 pt-4 relative z-10 flex items-center justify-center gap-1.5">
              <CheckCircle size={10} className="text-brand-500" />
              <span>Kisan Alert Web • Academic Project 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}