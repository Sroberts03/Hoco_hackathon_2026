// Seeds demo creators, companies, and projects into the hosted Supabase project.
//
//   npm run seed:demo
//
// Safe to re-run: every account on the demo email domain is deleted first
// (their projects, saves, and comments cascade). Real accounts are untouched.
// All demo accounts share DEMO_PASSWORD below, e.g. log in as
// talent@northwind.demo.everbuild.test to see a company's default feed.
import { createClient } from "@supabase/supabase-js";

const DEMO_DOMAIN = "demo.everbuild.test";
const DEMO_PASSWORD = "everbuild-demo-2026";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const must = (label, { data, error }) => {
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
};

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const creators = [
  { key: "maya", name: "Maya Chen", location: "Baltimore, MD", availability: "open_to_work",
    bio: "CS + education student building interactive tools that make data approachable.",
    education: "B.S. Computer Science (in progress)", interests: ["Data Visualization", "Education", "Python"] },
  { key: "jordan", name: "Jordan Okafor", location: "Columbia, MD", availability: "open_to_freelance",
    bio: "Freelance frontend engineer focused on accessible, well-tested UI.",
    education: "Self-taught", interests: ["Accessibility", "React", "TypeScript"] },
  { key: "priya", name: "Priya Raman", location: "Austin, TX", availability: "open_to_collaboration",
    bio: "Robotics engineer by day, algorithm visualizer by night.",
    education: "M.S. Mechanical Engineering", interests: ["Robotics", "Algorithms", "Computer Vision"] },
  { key: "luis", name: "Luis Ortega", location: "Chicago, IL", availability: "open_to_work",
    bio: "Student who likes small, sharp tools: budgets, synths, and firmware.",
    education: "A.S. Computer Science", interests: ["Music", "Finance", "Hardware"] },
  { key: "hannah", name: "Hannah Brooks", location: "Seattle, WA", availability: "not_currently_available",
    bio: "Physics teacher making short explainers about emergent systems.",
    education: "B.S. Physics", interests: ["Simulation", "Education", "Science"] },
  { key: "sam", name: "Sam Lee", location: "Baltimore, MD", availability: "open_to_freelance",
    bio: "Data engineer who builds civic dashboards and small health tools.",
    education: "B.A. Statistics", interests: ["Data Engineering", "Civic Technology", "Data Visualization"] },
];

const companies = [
  { key: "northwind", name: "Northwind Learning", location: "Baltimore, MD",
    description: "Learning platform for middle and high school STEM classrooms.",
    industry: ["Education"], interests: ["Data Visualization", "Education", "Python"],
    defaults: { tags: ["Data Visualization", "Education", "Python"] } },
  { key: "harbor", name: "Harbor Analytics", location: "New York, NY",
    description: "Analytics consultancy for public-sector and finance clients.",
    industry: ["Finance", "Data Engineering"], interests: ["Data Analysis", "Data Engineering", "Civic Technology", "Finance"],
    defaults: null },
  { key: "lumen", name: "Lumen Health", location: "Boston, MA",
    description: "Patient-facing health software with an accessibility-first design practice.",
    industry: ["Health"], interests: ["Accessibility", "UI/UX", "Health", "React"],
    defaults: { tags: ["Accessibility", "UI/UX", "Health"], types: ["web_app"] } },
];

// published: days since first publication. status defaults to "published".
const projects = [
  { owner: "maya", title: "Climate Classroom", industry: "education", type: "web_app", pstatus: "complete", published: 40, views: 420,
    tags: ["Python", "Data Visualization", "Education", "JavaScript"],
    desc: "An interactive lesson that lets students explore 140 years of temperature anomalies. Data cleaned in Python, charts drawn by hand on canvas so it runs offline in classrooms with poor connectivity.",
    lookingFor: "Teachers who would pilot this in a 7th–9th grade science unit." },
  { owner: "maya", title: "Explaining Gradient Descent", industry: "education", type: "video", pstatus: "complete", published: 75, views: 260,
    tags: ["Machine Learning", "Education", "Mathematics", "Animation", "Python"],
    desc: "A short animated explainer on gradient descent: loss surfaces, step sizes, and why learning rates matter." },
  { owner: "maya", title: "Tide Tables", industry: "research_science", type: "web_app", pstatus: "in_progress", published: 150, views: 90,
    tags: ["Data Visualization", "JavaScript", "Science"],
    desc: "A tide-height visualizer for Chesapeake Bay stations with a scrubbable 48-hour timeline." },
  { owner: "maya", title: "Census Explorer", industry: "government_civic", type: "web_app", pstatus: "in_progress", status: "draft",
    tags: ["Data Visualization", "Civic Technology", "Python"],
    desc: "Draft: a county-level census explorer. Not published, so it never appears in the feed." },
  { owner: "jordan", title: "Accessible Form Kit", industry: "developer_tools", type: "web_app", pstatus: "maintained", published: 20, views: 610,
    tags: ["React", "TypeScript", "Accessibility", "UI/UX", "Frontend"],
    desc: "Form components with real-time, screen-reader-friendly validation. Tested with VoiceOver and NVDA; meets WCAG 2.2 AA." },
  { owner: "priya", title: "Pathfinder Visualizer", industry: "education", type: "web_app", pstatus: "complete", published: 100, views: 1450,
    tags: ["Algorithms", "Data Structures", "JavaScript", "Education", "Data Visualization"],
    desc: "Draw walls on a grid and watch BFS, Dijkstra, and A* explore it step by step. Used by about 300 students in an intro algorithms course." },
  { owner: "priya", title: "Robot Arm Calibration", industry: "manufacturing_hardware", type: "video", pstatus: "seeking_collaborators", published: 12, views: 140,
    tags: ["Robotics", "Hardware", "Computer Vision", "Python"],
    desc: "A walkthrough of a camera-based calibration routine for a 4-DOF hobby arm, from fiducial detection to joint-offset estimation.",
    lookingFor: "A controls engineer interested in closing the loop with visual servoing." },
  { owner: "luis", title: "Budget Buddy", industry: "finance", type: "web_app", pstatus: "complete", published: 230, archivedDaysAgo: 48, status: "archived", views: 380,
    tags: ["Finance", "JavaScript", "UI/UX"],
    desc: "A no-signup monthly budget planner. Archived automatically after six months, so it is not in the feed." },
  { owner: "luis", title: "Synth Pad", industry: "media_entertainment", type: "web_app", pstatus: "in_progress", published: 3, views: 12,
    tags: ["Audio Processing", "Music", "JavaScript"],
    desc: "A tiny polyphonic synth built on the Web Audio API. Click the pads to play." },
  { owner: "hannah", title: "Cellular Automata Explainer", industry: "education", type: "video", pstatus: "complete", published: 2, views: 6,
    tags: ["Simulation", "Scientific Computing", "Education", "Python", "Data Visualization"],
    desc: "A two-minute classroom explainer on Conway's Game of Life and how simple local rules produce complex behavior. Fresh and low-view: it surfaces through freshness and exploration." },
  { owner: "hannah", title: "Wave Interference Lab", industry: "research_science", type: "video", pstatus: "complete", published: 210, views: 220,
    tags: ["Science", "Simulation", "Education"],
    desc: "Published more than six months ago and never renewed, so it is archived lazily the first time the feed loads." },
  { owner: "sam", title: "Transit Delay Dashboard", industry: "transportation_logistics", type: "web_app", pstatus: "maintained", published: 160, views: 980,
    tags: ["Data Visualization", "Civic Technology", "Python", "Data Analysis"],
    desc: "Bus delay patterns by route and hour, built from public GTFS-realtime feeds collected with a Python pipeline." },
  { owner: "sam", title: "Habit Grid", industry: "healthcare", type: "web_app", pstatus: "idea", published: 8, views: 45,
    tags: ["React", "TypeScript", "Accessibility", "Health"],
    desc: "Early idea: a keyboard-first habit tracker that works well with screen magnifiers." },
  { owner: "jordan", title: "Color Contrast Checker", industry: "developer_tools", type: "web_app", pstatus: "complete", published: 55, views: 330,
    tags: ["Accessibility", "UI/UX", "JavaScript", "Graphic Design"],
    desc: "Paste a palette and see every foreground/background pair scored against WCAG contrast thresholds." },
];

const saves = [
  ["northwind", "Pathfinder Visualizer"], ["harbor", "Transit Delay Dashboard"], ["harbor", "Budget Buddy"],
  ["lumen", "Accessible Form Kit"], ["lumen", "Habit Grid"], ["priya", "Climate Classroom"],
  ["jordan", "Pathfinder Visualizer"], ["lumen", "Pathfinder Visualizer"], ["sam", "Pathfinder Visualizer"],
  ["maya", "Accessible Form Kit"], ["lumen", "Color Contrast Checker"],
];

const comments = [
  ["Climate Classroom", "harbor", "Nice offline-first approach. How big is the bundled dataset?", 30],
  ["Climate Classroom", "sam", "About 180 KB after rounding to one decimal place.", 29],
  ["Accessible Form Kit", "lumen", "The error announcements are excellent. Did you test with JAWS too?", 15],
  ["Accessible Form Kit", "jordan", "Not yet. JAWS testing is next on the list.", 14],
  ["Pathfinder Visualizer", "maya", "I used this to study for my algorithms midterm. Thanks!", 60],
  ["Pathfinder Visualizer", "northwind", "Would love a version that narrates each step for students.", 40],
  ["Pathfinder Visualizer", "luis", "A* with the Manhattan heuristic looks great here.", 30],
  ["Transit Delay Dashboard", "harbor", "Are the delay buckets computed per stop or per trip?", 50],
  ["Transit Delay Dashboard", "sam", "Per trip, then averaged by hour of day.", 49],
  ["Robot Arm Calibration", "luis", "Firmware side is ready for the visual servo experiments.", 5],
  ["Explaining Gradient Descent", "hannah", "Great pacing. I might use this in class.", 20],
];

// ---------------------------------------------------------------------------

async function deleteExistingDemoUsers() {
  let page = 1;
  let removed = 0;
  for (;;) {
    const { users } = must("listUsers", await db.auth.admin.listUsers({ page, perPage: 200 }));
    const demo = users.filter((u) => u.email?.endsWith(`@${DEMO_DOMAIN}`) || u.email?.endsWith(`.${DEMO_DOMAIN}`));
    for (const u of demo) {
      must(`deleteUser ${u.email}`, await db.auth.admin.deleteUser(u.id));
      removed++;
    }
    if (users.length < 200) break;
    if (!demo.length) page++;
  }
  return removed;
}

async function createAccount(email, name, role, location) {
  const { user } = must(`createUser ${email}`, await db.auth.admin.createUser({
    email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { display_name: name, role },
  }));
  must(`users ${email}`, await db.from("users").insert({ id: user.id, role, display_name: name, general_location: location }));
  return user.id;
}

async function main() {
  const removed = await deleteExistingDemoUsers();
  if (removed) console.log(`Removed ${removed} previous demo accounts`);

  const ids = {};
  for (const c of creators) {
    ids[c.key] = await createAccount(`${c.key}@${DEMO_DOMAIN}`, c.name, "creator", c.location);
    must(`creator_profiles ${c.key}`, await db.from("creator_profiles").insert({
      user_id: ids[c.key], bio: c.bio, education: c.education, interests: c.interests, availability: c.availability,
    }));
  }
  for (const c of companies) {
    ids[c.key] = await createAccount(`talent@${c.key}.${DEMO_DOMAIN}`, c.name, "company", c.location);
    must(`company_profiles ${c.key}`, await db.from("company_profiles").insert({
      user_id: ids[c.key], company_name: c.name, description: c.description, industry_tags: c.industry,
      interests: c.interests, is_verified: true, verified_at: new Date().toISOString(), verification_source: "demo_seed",
    }));
    if (c.defaults) must(`feed_preferences ${c.key}`, await db.from("feed_preferences").insert({ user_id: ids[c.key], filters: c.defaults }));
  }

  const tagRows = must("tags", await db.from("tags").select("id, name"));
  const tagId = Object.fromEntries(tagRows.map((t) => [t.name, t.id]));

  const projectId = {};
  for (const p of projects) {
    const status = p.status ?? "published";
    const published = p.published !== undefined ? daysAgo(p.published) : null;
    const row = must(`project ${p.title}`, await db.from("projects").insert({
      owner_id: ids[p.owner], title: p.title, slug: slugify(p.title), description: p.desc,
      project_type: p.type, project_status: p.pstatus, industry: p.industry ?? null, publication_status: status,
      published_at: published, first_published_at: published,
      archived_at: status === "archived" ? daysAgo(p.archivedDaysAgo ?? 0) : null,
      looking_for: p.lookingFor ?? null, views_count: p.views ?? 0,
      created_at: published ?? daysAgo(4),
    }).select("id").single());
    projectId[p.title] = row.id;

    const missing = p.tags.filter((t) => !tagId[t]);
    if (missing.length) throw new Error(`Unknown tags on ${p.title}: ${missing.join(", ")}`);
    must(`project_tags ${p.title}`, await db.from("project_tags").insert(p.tags.map((t) => ({ project_id: row.id, tag_id: tagId[t] }))));
  }

  must("saved_projects", await db.from("saved_projects").insert(
    saves.map(([user, title]) => ({ user_id: ids[user], project_id: projectId[title], created_at: daysAgo(10) })),
  ));
  must("comments", await db.from("comments").insert(
    comments.map(([title, author, body, days]) => ({ project_id: projectId[title], author_id: ids[author], body, created_at: daysAgo(days) })),
  ));

  console.log(`Seeded ${creators.length} creators, ${companies.length} companies, ${projects.length} projects.`);
  console.log(`Demo password for every account: ${DEMO_PASSWORD}`);
  console.log(`Company with saved defaults: talent@northwind.${DEMO_DOMAIN}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
