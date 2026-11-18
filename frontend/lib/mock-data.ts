import type { Job } from "./types";

type Seed = Omit<Job, "id" | "scrapedAt" | "portal"> & { hoursAgo: number };

const SEEDS: Seed[] = [
  { role: "Frontend Developer Intern", originalTitle: "Frontend Engineering Intern", company: "Razorpay", city: "Bengaluru", mode: "Remote", type: "Internship", skills: ["React", "JavaScript", "CSS"], description: "Build thoughtful payment experiences used by ambitious businesses across India.", url: "https://razorpay.com/jobs/", hoursAgo: 2 },
  { role: "Python Developer", originalTitle: "Junior Software Developer — Python", company: "Zoho", city: "Chennai", mode: "On-site", type: "Full-Time", skills: ["Python", "SQL", "Django"], description: "Create reliable business software and learn alongside a deeply technical product team.", url: "https://www.zoho.com/careers/", hoursAgo: 5 },
  { role: "UI/UX Design Intern", originalTitle: "Product Design Intern", company: "Figma", city: "Remote", mode: "Remote", type: "Internship", skills: ["Figma", "Wireframing", "Prototyping"], description: "Explore product ideas, prototype interactions, and help make collaboration feel effortless.", url: "https://www.figma.com/careers/", hoursAgo: 40 },
  { role: "Data Analyst Intern", originalTitle: "Analyst Intern — Data & Insights", company: "Deloitte", city: "Hyderabad", mode: "Hybrid", type: "Internship", skills: ["Excel", "SQL", "Python"], description: "Turn complex datasets into clear insights for teams solving meaningful business problems.", url: "https://www2.deloitte.com/in/en/careers.html", hoursAgo: 8 },
  { role: "Software Engineer Trainee", originalTitle: "Graduate Software Engineer", company: "Freshworks", city: "Chennai", mode: "On-site", type: "Full-Time", skills: ["Java", "DSA", "Git"], description: "Start your product engineering journey on software used by teams around the world.", url: "https://www.freshworks.com/company/careers/", hoursAgo: 70 },
  { role: "Digital Marketing Intern", originalTitle: "Growth & Content Intern", company: "BrightMint", city: "Mumbai", mode: "Hybrid", type: "Internship", skills: ["SEO", "Content", "Analytics"], description: "Experiment with content, campaigns, and data to help an early-stage startup grow.", url: "https://www.linkedin.com/jobs/", hoursAgo: 11 },
  { role: "Backend Developer Intern", originalTitle: "Node.js Engineering Intern", company: "Stackly", city: "Pune", mode: "Remote", type: "Internship", skills: ["Node.js", "MongoDB", "REST API"], description: "Design clean APIs and ship backend features with a small, fast-moving product team.", url: "https://www.linkedin.com/jobs/", hoursAgo: 52 },
  { role: "Data Science Trainee", originalTitle: "Graduate Trainee — Data Science", company: "NimbleAI", city: "Bengaluru", mode: "Hybrid", type: "Full-Time", skills: ["Python", "Machine Learning", "Pandas"], description: "Learn to turn models into practical features while working with real product data.", url: "https://www.linkedin.com/jobs/", hoursAgo: 96 },
  { role: "Machine Learning Intern", originalTitle: "ML Research Intern", company: "Sarvam Labs", city: "Bengaluru", mode: "On-site", type: "Internship", skills: ["PyTorch", "Python", "NLP"], description: "Fine-tune and evaluate language models for Indic languages alongside the research team.", url: "https://www.linkedin.com/jobs/", hoursAgo: 3 },
  { role: "Full Stack Developer", originalTitle: "Associate Software Engineer — MERN", company: "Cartlane", city: "Delhi", mode: "Hybrid", type: "Full-Time", skills: ["React", "Node.js", "MongoDB"], description: "Own features end-to-end on a fast-growing commerce platform serving Tier-2 cities.", url: "https://www.linkedin.com/jobs/", hoursAgo: 30 },
  { role: "QA Automation Intern", originalTitle: "Test Engineering Intern", company: "Kissflow", city: "Chennai", mode: "On-site", type: "Internship", skills: ["Selenium", "Java", "Postman"], description: "Write automated tests and learn how a mature SaaS team ships with confidence.", url: "https://www.linkedin.com/jobs/", hoursAgo: 120 },
  { role: "DevOps Engineer Trainee", originalTitle: "Cloud Operations Trainee", company: "Gridline", city: "Pune", mode: "Remote", type: "Full-Time", skills: ["AWS", "Docker", "Linux"], description: "Learn to run production infrastructure with CI/CD, monitoring and on-call practices.", url: "https://www.linkedin.com/jobs/", hoursAgo: 18 },
  { role: "Product Analyst Intern", originalTitle: "Associate Product Analyst Intern", company: "Meesho", city: "Bengaluru", mode: "Hybrid", type: "Internship", skills: ["SQL", "Excel", "Analytics"], description: "Dig into funnels and experiments to help product teams decide what to build next.", url: "https://www.linkedin.com/jobs/", hoursAgo: 200 },
];

/** Built per call so "NEW"/"added today" stay meaningful relative to now. */
export function MOCK_JOBS(): Job[] {
  const now = Date.now();
  return SEEDS.map(({ hoursAgo, ...s }, i) => ({
    ...s,
    id: `demo-${i + 1}`,
    portal: "Demo",
    scrapedAt: new Date(now - hoursAgo * 3600_000).toISOString(),
  })).sort((a, b) => +new Date(b.scrapedAt) - +new Date(a.scrapedAt));
}
