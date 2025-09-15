const industryLocations = [
  "energy tech apac", "energy tech can", "energy tech latin", "energy tech us",
  "energy bus apac", "energy bus can", "energy bus latin", "energy bus us",
  "retail tech apac", "retail tech can", "retail tech latin", "retail tech us",
  "retail bus apac", "retail bus can", "retail bus latin", "retail bus us",
  "health apac", "health can", "health latin", "health us",
  "chemical apac", "chemical can", "chemical latin", "chemical us",
  "hr apac", "hr can", "hr latin", "hr us", "food& bev ","food & bev canda","food & bev latin","food & bev europe","food and bev apac",
  "food bus","food canada","food latin america","food eu","food apac",
  "cfo apac", "cfo can", "cfo latin", "cfo us",
  "finance apac", "finance can", "finance latin", "finance us",
  "manufacturer apac", "manufacturer can", "manufacturer latin", "manufacturer us",
  "utility apac", "utility can", "utility latin", "utility us",
  "electric apac", "electric can", "electric latin", "electric us",
  "aerospace apac", "aerospace can", "aerospace latin", "aerospace us",
  "logistic apac", "logistic can", "logistic latin", "logistic us",
  "agr apac", "agr can", "agr latin", "agr us",
  "cannabis apac", "cannabis can", "cannabis latin", "cannabis us",
  "meditech apac", "meditech can", "meditech latin", "meditech us",
  "cio application apac", "cio application can", "cio application latin", "cio application us",
  "semiconductor apac", "semiconductor can", "semiconductor latin", "semiconductor us",
  "cioreview apac", "cioreview can", "cioreview latin", "cioreview us",
  "banking cio apac", "banking cio can", "banking cio latin", "banking cio us",
  "autotech apac", "autotech can", "autotech latin", "autotech us",
  "insurance apac", "insurance can", "insurance latin", "insurance us",
  "appliedtech apac", "appliedtech can", "appliedtech latin", "appliedtech us",
  "pharma apac", "pharma can", "pharma latin", "pharma us",
  "biotech apac", "biotech can", "biotech latin", "biotech us",
  "cybersecurity apac", "cybersecurity can", "cybersecurity latin", "cybersecurity us",
  "martech apac", "martech can", "martech latin", "martech us",
  "cio review", "cio review latin", "cio review canada", "cio review eu", "cio review apac"
];

// Optional: remove duplicates just in case
const cleanedLocations = Array.from(new Set(industryLocations.map(loc => loc.toLowerCase())));

export default cleanedLocations;
