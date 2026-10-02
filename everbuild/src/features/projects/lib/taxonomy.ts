// Curated tag taxonomy. Must match the tags inserted by
// supabase/migrations/20261002130000_projects_and_feed.sql.

export const TAG_TAXONOMY = {
  "Languages and fundamentals": [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C",
    "C++",
    "C#",
    "Go",
    "Rust",
    "Kotlin",
    "Swift",
    "SQL",
    "Algorithms",
    "Data Structures",
    "Mathematics",
    "Statistics"
  ],
  "Web and application development": [
    "React",
    "Next.js",
    "Vue",
    "Angular",
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "REST APIs",
    "GraphQL",
    "WebSockets",
    "Frontend",
    "Backend",
    "Full Stack",
    "Mobile Development",
    "Desktop Applications"
  ],
  "Data, AI, and computation": [
    "Data Analysis",
    "Data Visualization",
    "Machine Learning",
    "Deep Learning",
    "Generative AI",
    "Natural Language Processing",
    "Computer Vision",
    "Audio Processing",
    "Optimization",
    "Simulation",
    "Scientific Computing",
    "Databases",
    "Data Engineering"
  ],
  "Systems and engineering practice": [
    "Distributed Systems",
    "Cloud",
    "DevOps",
    "Docker",
    "Kubernetes",
    "Testing",
    "Security",
    "Cryptography",
    "Performance",
    "Open Source",
    "Version Control",
    "Accessibility"
  ],
  "Design, media, and domains": [
    "UI/UX",
    "Graphic Design",
    "Game Development",
    "Animation",
    "Video",
    "Music",
    "Robotics",
    "Hardware",
    "Education",
    "Finance",
    "Health",
    "Science",
    "Civic Technology",
    "Social Impact",
    "E-commerce",
    "Product Design"
  ]
} as const satisfies Record<string, readonly string[]>;

export type TagCategory = keyof typeof TAG_TAXONOMY;

export const TAG_CATEGORIES = Object.keys(TAG_TAXONOMY) as TagCategory[];

export const ALL_TAGS: readonly string[] = Object.values(TAG_TAXONOMY).flat();

export function isCuratedTag(name: string): boolean {
  return ALL_TAGS.includes(name);
}
