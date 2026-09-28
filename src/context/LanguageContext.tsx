import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'bho';

export interface LanguageOption {
  id: Language;
  label: string;
  nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'en', label: 'English', nativeName: 'English' },
  { id: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { id: 'bho', label: 'Bhojpuri', nativeName: 'भोजपुरी' },
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Nav items
    'nav.home': 'Home',
    'nav.report': 'Report Issue',
    'nav.myReports': 'My Reports',
    'nav.map': 'Water Map',
    'nav.services': 'Water Services',
    'nav.notices': 'Notices & Alerts',
    'nav.awareness': 'Awareness',
    'nav.help': 'Help & Support',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.adminPortal': 'Admin Portal Switch',

    // Header
    'header.searchPlaceholder': 'Search by report ID, ward, or pipeline issue...',
    'header.selectWard': 'Select Municipal Ward',
    'header.ward': 'Select Municipal Ward',
    'header.active': 'Active',

    // Home Hero & Banner
    'home.greeting': 'Welcome to JalSetu',
    'home.everyDrop': 'Every Drop Builds a Better Bihar.',
    'home.civicQuote': '“Save Water Today, For a Healthier Tomorrow.”',
    'home.civicInitiative': '— JalSetu Civic Initiative',
    'home.myLocation': 'My Location',
    'home.gpsLive': '(GPS Live Verification)',
    'home.recenter': 'Recenter',
    'home.civicAction': 'Civic Action',
    'home.reportWaterProblem': 'Report a Water Problem',
    'home.reportProblemDesc': 'See a leak, dirty water, or low pressure? Capture photo evidence and report it in seconds.',
    'home.everyDropMatters': 'Every Drop Matters',
    'home.everyDropMattersDesc': 'A small civic action today protects clean municipal drinking water for tomorrow.',
    'home.reportIssueCategories': 'Report a Water Issue',
    'home.selectCategoryDesc': 'Select an issue type below to pinpoint grievance details and dispatch ward engineers.',
    'home.heroBadge': 'Bihar State Municipal Water Portal',
    'home.heroTitle': 'Clean Water & Rapid Infrastructure Resolution for Bihar',
    'home.heroSubtitle': 'Direct citizen monitoring, geotagged leak reporting, and scheduled clean drinking water supply tracking under Har Boond, Behtar Bihar.',
    'home.reportButton': 'Report an Issue Now',
    'home.viewMap': 'Explore Live Ward Map',
    'home.activeIssues': 'Active Ward Grievances',
    'home.resolvedMonthly': 'Issues Resolved This Month',
    'home.avgResponse': 'Average Response Time',
    'home.cleanWaterSupplied': 'Drinking Water Purity Index',

    // Quick Actions
    'home.quickActions': 'Quick Citizen Services',
    'home.quickLeak': 'Pipeline Leak / Burst',
    'home.quickContamination': 'Contaminated Water',
    'home.quickTanker': 'Emergency Water Tanker',
    'home.quickPressure': 'Low Pressure Grievance',
    'home.noticeBoard': 'Municipal Notice Board',
    'home.viewAllNotices': 'View all ward notices',
    'home.motivationalBadge': 'Jal-Jeevan-Hariyali Mission',
    'home.motivationalQuote': '“Water is Bihar’s shared heritage and future lifeline. Every drop saved in our wards protects clean drinking water for the next generation.”',
    'home.motivationalSubtext': 'Join community rainwater harvesting and zero-leakage vigilance across your ward today.',
    'home.learnMoreTips': 'Learn More Conservation Tips',

    // Footer
    'footer.bulletinTag': 'Har Boond, Behtar Bihar Bulletin',
    'footer.bulletinTitle': 'Stay Updated on Bihar Water Conservation',
    'footer.bulletinDesc': 'Get weekly ground reports on Jal-Jeevan-Hariyali initiatives, community rainwater harvesting blueprints, seasonal groundwater levels, and scheduled supply advisories across your ward.',
    'footer.selectDistrict': 'Select District',
    'footer.emailPlaceholder': 'Enter your email address',
    'footer.subscribeNow': 'Subscribe Now',
    'footer.subscribing': 'Subscribing...',
    'footer.subscribedTitle': "You're Subscribed!",
    'footer.subscribedDesc': "Welcome to the JalSetu Citizen Network. We've sent a confirmation email along with Bihar's 2026 Monsoon Water Conservation Handbook.",
    'footer.subscribeAnother': 'Subscribe another email',
    'footer.consent': 'Receive weekly water conservation insights & alerts',
    'footer.noSpam': 'Official JalSetu initiative. No spam, ever. Unsubscribe anytime.',
    'footer.emergencyTitle': 'Bihar 24x7 Water Emergency & Grievance Cell',
    'footer.tollFreeActive': 'Toll-Free Active',
    'footer.emergencyDesc': 'Immediate municipal dispatch for main pipeline bursts, contamination alerts, or emergency tanker requirements.',
    'footer.tollFree': '1800-3456-789 (Toll-Free)',
    'footer.muzaffarpur': 'Muzaffarpur: 0621-2242134',
    'footer.patna': 'Patna HQ: 0612-2545123',
    'footer.copyright': '© 2026 JalSetu. All rights reserved.',
    'footer.tagline': 'Built for a Cleaner, Stronger and Healthier Bihar.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.accessibility': 'Accessibility',
    'footer.sitemap': 'Sitemap',
  },
  hi: {
    // Nav items
    'nav.home': 'मुख्य पृष्ठ',
    'nav.report': 'समस्या दर्ज करें',
    'nav.myReports': 'मेरी रिपोर्ट्स',
    'nav.map': 'जल नक्शा',
    'nav.services': 'जल सेवाएँ',
    'nav.notices': 'सूचना एवं चेतावनी',
    'nav.awareness': 'जल संरक्षण',
    'nav.help': 'सहायता व संपर्क',
    'nav.settings': 'सेटिंग्स',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.adminPortal': 'प्रशासनिक पोर्टल',

    // Header
    'header.searchPlaceholder': 'रिपोर्ट आईडी, वार्ड या पाइपलाइन समस्या खोजें...',
    'header.selectWard': 'नगर निगम वार्ड चुनें',
    'header.ward': 'नगर वार्ड चुनें',
    'header.active': 'सक्रिय',

    // Home Hero & Banner
    'home.greeting': 'जलसेतु में आपका स्वागत है',
    'home.everyDrop': 'हर बूँद से समृद्ध बनेगा बिहार।',
    'home.civicQuote': '“आज जल बचाएं, कल को स्वस्थ बनाएं।”',
    'home.civicInitiative': '— जलसेतु नागरिक पहल',
    'home.myLocation': 'मेरा स्थान',
    'home.gpsLive': '(जीपीएस लाइव सत्यापन)',
    'home.recenter': 'पुनः केंद्रित करें',
    'home.civicAction': 'नागरिक कार्रवाई',
    'home.reportWaterProblem': 'पानी की समस्या दर्ज करें',
    'home.reportProblemDesc': 'लीकेज, गंदा पानी या कम दबाव दिख रहा है? फोटो प्रमाण लें और कुछ ही सेकंड में रिपोर्ट करें।',
    'home.everyDropMatters': 'हर बूँद कीमती है',
    'home.everyDropMattersDesc': 'आज का एक छोटा नागरिक प्रयास कल के लिए स्वच्छ पेयजल सुरक्षित करता है।',
    'home.reportIssueCategories': 'जल समस्या श्रेणी चुनें',
    'home.selectCategoryDesc': 'समस्या का प्रकार चुनें ताकि वार्ड इंजीनियर को तुरंत भेजा जा सके।',
    'home.heroBadge': 'बिहार राज्य नगर जल प्रबंधन पोर्टल',
    'home.heroTitle': 'बिहार के लिए स्वच्छ पेयजल और त्वरित समाधान',
    'home.heroSubtitle': 'हर बूँद, बेहतर बिहार अभियान के तहत सीधी नागरिक निगरानी, भू-टैग की गई लीकेज रिपोर्टिंग और आपूर्ति निगरानी।',
    'home.reportButton': 'समस्या दर्ज करें',
    'home.viewMap': 'वार्ड का लाइव मैप देखें',
    'home.activeIssues': 'सक्रिय वार्ड शिकायतें',
    'home.resolvedMonthly': 'इस माह हल की गई समस्याएँ',
    'home.avgResponse': 'औसत समाधान समय',
    'home.cleanWaterSupplied': 'पेयजल शुद्धता सूचकांक',

    // Quick Actions
    'home.quickActions': 'त्वरित नागरिक सेवाएँ',
    'home.quickLeak': 'पाइपलाइन लीकेज / टूटन',
    'home.quickContamination': 'गंदे पानी की शिकायत',
    'home.quickTanker': 'आपातकालीन जल टैंकर',
    'home.quickPressure': 'कम दबाव की समस्या',
    'home.noticeBoard': 'नगर सूचना पट्ट',
    'home.viewAllNotices': 'सभी सूचनाएं देखें',
    'home.motivationalBadge': 'जल-जीवन-हरियाली अभियान',
    'home.motivationalQuote': '“जल बिहार की साझी विरासत और भावी जीवनरेखा है। आज बचाया गया पानी आने वाली पीढ़ी के भविष्य को संवारता है।”',
    'home.motivationalSubtext': 'अपने वार्ड में वर्षा जल संचयन और लीकेज-मुक्त बिहार के सामूहिक संकल्प से आज ही जुड़ें।',
    'home.learnMoreTips': 'जल संरक्षण के उपाय जानें',

    // Footer
    'footer.bulletinTag': 'हर बूँद, बेहतर बिहार बुलेटिन',
    'footer.bulletinTitle': 'बिहार जल संरक्षण की हर खबर से जुड़े रहें',
    'footer.bulletinDesc': 'जल-जीवन-हरियाली पहल, वर्षा जल संचयन, भूजल स्तर और अपने वार्ड के जलापूर्ति परामर्श पर साप्ताहिक रिपोर्ट प्राप्त करें।',
    'footer.selectDistrict': 'जिला चुनें',
    'footer.emailPlaceholder': 'अपना ईमेल पता दर्ज करें',
    'footer.subscribeNow': 'अभी सदस्यता लें',
    'footer.subscribing': 'सब्सक्राइब हो रहा है...',
    'footer.subscribedTitle': 'सदस्यता सफल हुई!',
    'footer.subscribedDesc': 'जलसेतु नागरिक नेटवर्क में आपका स्वागत है। हमने पुष्टि ईमेल और बिहार जल संरक्षण मार्गदर्शिका भेज दी है।',
    'footer.subscribeAnother': 'दूसरा ईमेल जोड़ें',
    'footer.consent': 'साप्ताहिक जल संरक्षण रिपोर्ट और अलर्ट प्राप्त करें',
    'footer.noSpam': 'आधिकारिक जलसेतु पहल। कोई स्पैम नहीं। कभी भी सदस्यता रद्द करें।',
    'footer.emergencyTitle': 'बिहार 24x7 जल आपातकालीन एवं शिकायत प्रकोष्ठ',
    'footer.tollFreeActive': 'टोल-फ्री सक्रिय',
    'footer.emergencyDesc': 'पाइपलाइन टूटने, जल प्रदूषण या आपातकालीन पानी के टैंकर के लिए त्वरित नगर निगम सहायता।',
    'footer.tollFree': '1800-3456-789 (टोल-फ्री)',
    'footer.muzaffarpur': 'मुजफ्फरपुर: 0621-2242134',
    'footer.patna': 'पटना मुख्यालय: 0612-2545123',
    'footer.copyright': '© 2026 जलसेतु। सर्वाधिकार सुरक्षित।',
    'footer.tagline': 'स्वच्छ, सशक्त और स्वस्थ बिहार के लिए समर्पित।',
    'footer.privacy': 'गोपनीयता नीति',
    'footer.terms': 'सेवा की शर्तें',
    'footer.accessibility': 'पहुंच-योग्यता',
    'footer.sitemap': 'साइटमैप',
  },
  bho: {
    // Nav items
    'nav.home': 'मुख्य पन्ना',
    'nav.report': 'समस्या दर्ज करीं',
    'nav.myReports': 'हमार रपट',
    'nav.map': 'पानी नक्शा',
    'nav.services': 'जल सेवा सब',
    'nav.notices': 'सूचना आ अलर्ट',
    'nav.awareness': 'जागरूकता',
    'nav.help': 'मदद आ संपर्क',
    'nav.settings': 'सेटिंग्स',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.adminPortal': 'प्रशासनिक पोर्टल',

    // Header
    'header.searchPlaceholder': 'रपट आईडी, वार्ड भा पाइपलाइन समस्या खोजीं...',
    'header.selectWard': 'नगर वार्ड चुनीं',
    'header.ward': 'नगर वार्ड चुनीं',
    'header.active': 'चालू',

    // Home Hero & Banner
    'home.greeting': 'जलसेतु में रउआ स्वागत बा',
    'home.everyDrop': 'हर बूँद से बनी बेहतर बिहार।',
    'home.civicQuote': '“आज पानी बचाईं, काल्ह के निरोग बनाईं।”',
    'home.civicInitiative': '— जलसेतु पहल',
    'home.myLocation': 'हमार जगह',
    'home.gpsLive': '(जीपीएस लाइव जांच)',
    'home.recenter': 'फेरु सेट करीं',
    'home.civicAction': 'नागरिक कदम',
    'home.reportWaterProblem': 'पानी के समस्या दर्ज करीं',
    'home.reportProblemDesc': 'लीकेज, गंदा पानी भा कम प्रेशर बा? फोटो खींच के तुरंत रपट दर्ज करीं।',
    'home.everyDropMatters': 'हर बूँद कीमती बा',
    'home.everyDropMattersDesc': 'आज के छोट प्रयास काल्ह खातिर साफ पानी बचाइ।',
    'home.reportIssueCategories': 'पानी समस्या श्रेणी चुनीं',
    'home.selectCategoryDesc': 'समस्या के प्रकार चुनीं ताकि वार्ड इंजीनियर तुरंत पहुँच सकें।',
    'home.heroBadge': 'बिहार राज्य नगर जल प्रबंधन पोर्टल',
    'home.heroTitle': 'बिहार खातिर साफ पानी आ झटपट समाधान',
    'home.heroSubtitle': 'हर बूँद, बेहतर बिहार अभियान के तहत सीधे नागरिक निगरानी, लीकेज रिपोर्टिंग आ आपूर्ति के देखरेख।',
    'home.reportButton': 'समस्या दर्ज करीं',
    'home.viewMap': 'वार्ड के लाइव नक्शा देखीं',
    'home.activeIssues': 'सक्रिय वार्ड शिकायत',
    'home.resolvedMonthly': 'ए महीना निपटावल समस्या',
    'home.avgResponse': 'औसत समाधान समय',
    'home.cleanWaterSupplied': 'पानी शुद्धता सूचकांक',

    // Quick Actions
    'home.quickActions': 'झटपट नागरिक सेवा',
    'home.quickLeak': 'पाइपलाइन चुवाई / टूटन',
    'home.quickContamination': 'गंदा पानी के शिकायत',
    'home.quickTanker': 'आपातकालीन जल टैंकर',
    'home.quickPressure': 'कम प्रेशर के समस्या',
    'home.noticeBoard': 'नगर सूचना पट्ट',
    'home.viewAllNotices': 'सब सूचना देखीं',
    'home.motivationalBadge': 'जल-जीवन-हरियाली अभियान',
    'home.motivationalQuote': '“पानी हमनी के साझी धरोहर आ जिनगी के आधार हवे। आज बचावल एक-एक बूँद पानी अगिला पीढ़ी के खुशहाल रखी।”',
    'home.motivationalSubtext': 'अपने वार्ड में बरखा पानी संचयन आ पानी के बर्बादी रोके के संकल्प में शामिल होखीं।',
    'home.learnMoreTips': 'जल संरक्षण के उपाय जानीं',

    // Footer
    'footer.bulletinTag': 'हर बूँद, बेहतर बिहार बुलेटिन',
    'footer.bulletinTitle': 'बिहार जल संरक्षण के हर खबर से जुड़ल रहीं',
    'footer.bulletinDesc': 'जल-जीवन-हरियाली अभियान, बरखा पानी संचयन आ अपने वार्ड के पानी आपूर्ति के साप्ताहिक रपट पाईं।',
    'footer.selectDistrict': 'जिला चुनीं',
    'footer.emailPlaceholder': 'अपन ईमेल दर्ज करीं',
    'footer.subscribeNow': 'अबहीं जुड़ल जाव',
    'footer.subscribing': 'जुड़त बानी...',
    'footer.subscribedTitle': 'सदस्यता सफल भइल!',
    'footer.subscribedDesc': 'जलसेतु नेटवर्क में राउर स्वागत बा। हमनी पुष्टि ईमेल आ बिहार जल संरक्षण किताब भेज देले बानी।',
    'footer.subscribeAnother': 'दूसर ईमेल जोड़ीं',
    'footer.consent': 'हफ्तावार जल संरक्षण रपट आ अलर्ट पाईं',
    'footer.noSpam': 'सरकारी जलसेतु पहल। कवनो स्पैम ना। कहियो बंद कर सकीले।',
    'footer.emergencyTitle': 'बिहार 24x7 जल आपातकालीन सहायता सेल',
    'footer.tollFreeActive': 'टोल-फ्री चालू बा',
    'footer.emergencyDesc': 'पाइप टूटे भा गंदा पानी के शिकायत खातिर तुरंत नगर निगम सहायता।',
    'footer.tollFree': '1800-3456-789 (टोल-फ्री)',
    'footer.muzaffarpur': 'मुजफ्फरपुर: 0621-2242134',
    'footer.patna': 'पटना मुख्यालय: 0612-2545123',
    'footer.copyright': '© 2026 जलसेतु। सब अधिकार सुरक्षित।',
    'footer.tagline': 'स्वच्छ, मजबूत आ स्वस्थ बिहार खातिर।',
    'footer.privacy': 'गोपनीयता नीति',
    'footer.terms': 'नियम आ शर्त',
    'footer.accessibility': 'सुलभता',
    'footer.sitemap': 'साइटमैप',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('jalsetu_lang');
      if (saved === 'en' || saved === 'hi' || saved === 'bho') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('jalsetu_lang', lang);
    } catch {
      // ignore
    }
  };

  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    return TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
