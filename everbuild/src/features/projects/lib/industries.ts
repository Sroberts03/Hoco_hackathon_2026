// Curated industry list. One industry per project.
// Must match supabase/migrations/20261002140000_project_industry.sql.

export const INDUSTRIES = {
  education: "Education",
  healthcare: "Healthcare",
  finance: "Finance & Fintech",
  government_civic: "Government & Civic",
  retail_ecommerce: "Retail & E-commerce",
  media_entertainment: "Media & Entertainment",
  gaming: "Gaming",
  manufacturing_hardware: "Manufacturing & Hardware",
  energy_climate: "Energy & Climate",
  transportation_logistics: "Transportation & Logistics",
  nonprofit_social_impact: "Nonprofit & Social Impact",
  research_science: "Research & Science",
  developer_tools: "Developer Tools",
  enterprise_software: "Enterprise Software",
  other: "Other",
} as const;

export type Industry = keyof typeof INDUSTRIES;

export function isIndustry(v: string): v is Industry {
  return v in INDUSTRIES;
}
