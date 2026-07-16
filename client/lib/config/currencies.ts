export const CURRENCIES = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "SGD", label: "Singapore Dollar (S$)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
] as const;

export const TIMEZONES = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
] as const;
