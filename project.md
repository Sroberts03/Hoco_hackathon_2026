# Everbuild MVP — Agent Build Plan

## Product

Build a professional reverse job board for projects.

**Tagline:** Projects are what matter, so let’s skip the resume.

Students, freelancers, and professionals publish projects. Companies browse a project-first feed, filter it by their interests, save promising projects, and contact creators directly. The platform should feel like a professional version of Scratch’s project gallery: projects are the primary objects, profiles provide context, and discovery happens through browsing.

## Objective

Deliver a working local proof of concept in which a company can:

1. Browse projects without logging in.
2. Filter projects by technology, capability, project type, status, and general location.
3. Save projects.
4. Set default feed filters based on company interests.
5. Open a project and view its web app or MP4 directly on the platform.
6. See the project’s creators and collaborators.
7. Start a one-to-one message thread with a creator, optionally attached to the project.
8. Comment on a project.

A creator should be able to:

1. Create a profile.
2. Upload and publish an MP4 project or a packaged HTML/CSS/JavaScript web app.
3. Add a title, description, cover image, tags, status, collaborators, optional “looking for” text, and optional source-code bundle.
4. Edit, publish, archive, and republish projects.
5. Receive messages and comments.
6. Block users and report projects.

## Product principles

- Projects are the primary feed objects; resumes are not part of the MVP.
- Public browsing should work without authentication.
- Projects must be viewable on this platform. Do not require an external demo URL.
- The initial experience is professional and restrained, not colorful or game-like.
- Deterministic behavior is preferred over opaque AI recommendations.
- Companies are verified through a hardcoded/demo flag for now.
- Anyone may create a creator account and publish projects.
- Messaging is asynchronous and does not require approval.
- Archived projects remain accessible to their owners but disappear from the default public feed.
- Use local seed data and local media so the demo works without external services.

## Explicit non-goals

Do not build these in the MVP:

- Resume upload or resume parsing.
- Job postings, applications, applicant tracking, or recruiting pipelines.
- Company interest cards or company-created job descriptions.
- Remixes or project forks.
- Real company verification.
- Real-time chat, typing indicators, read receipts, or presence.
- External video hosting or external web-app hosting.
- Arbitrary server-side code execution from uploaded projects.
- Payments, subscriptions, or monetization.
- Complex recommendation models.
- Full social-network functionality.

## Core roles

### Visitor

- Can browse the public feed.
- Can search and filter projects.
- Can open project pages and view hosted media.
- Cannot save, message, comment, or publish until authenticated.

### Creator

A creator may be a student, freelancer, professional, or other project builder.

- Owns a profile and projects.
- May add collaborators to a project.
- May publish MP4 and web-app projects.
- May receive messages and comments.
- May block users and report projects.

### Company user

- Has a company profile.
- Has `is_verified = true` for seeded/demo companies.
- Can define default interest filters.
- Can browse, save, comment, and message.
- Does not create job postings in this MVP.

## Information architecture

Required routes/views:

- `/` — public project feed.
- `/discover` — searchable/filterable project discovery view if separate from `/` is useful.
- `/projects/[id]` — project detail and hosted viewer.
- `/users/[id]` — creator profile and project collection.
- `/companies/[id]` — company profile and saved projects/default interests.
- `/login` and `/signup` — authentication.
- `/dashboard` — creator/company personal dashboard.
- `/projects/new` — project creation wizard.
- `/projects/[id]/edit` — project editing.
- `/messages` — inbox and threads.
- `/messages/[threadId]` — one-to-one message thread.
- `/settings` — profile, privacy, feed defaults, and account controls.

The exact routing may follow the existing repository’s conventions.

## Project model

Every project has:

- `id`
- `owner_id`
- `title`
- `slug`
- `description`
- `project_type`: `web_app` or `video`
- `project_status`: `idea`, `in_progress`, `complete`, `maintained`, or `seeking_collaborators`
- `publication_status`: `draft`, `published`, or `archived`
- `cover_asset_id` (nullable)
- `published_at`
- `archived_at` (nullable)
- `last_republished_at` (nullable)
- `looking_for` (nullable)
- `general_location` (nullable)
- `views_count`
- `created_at`
- `updated_at`

### Project media

Use a separate media table or equivalent storage metadata:

- `id`
- `project_id`
- `media_type`: `primary_video`, `web_app_bundle`, `source_bundle`, `cover_image`, or `poster_image`
- `storage_path`
- `mime_type`
- `file_size_bytes`
- `original_filename`
- `created_at`

### Collaborators

Projects may have multiple attached users.

- `project_collaborators(project_id, user_id, role, display_order)`
- The owner is always shown as a creator.
- Collaborator roles are optional text for the MVP.
- Collaborators must explicitly be attached by the owner or accept an invitation, depending on the existing auth architecture. For the quickest implementation, seeded collaborators may be attached directly and owner-managed collaborators may be added through a user search.

## Upload and hosting requirements

### Video projects

- Accept MP4 uploads.
- Store the file locally.
- Render with a native HTML `<video controls>` player.
- Generate a poster/cover image from the first usable video frame when tooling is available.
- If poster generation fails, use a neutral local placeholder and allow the creator to upload a cover image.

### Web-app projects

- Accept a ZIP bundle containing HTML, JavaScript, CSS, and static assets.
- Extract to a project-specific storage directory.
- Serve the extracted project from the local application.
- Render it inside a sandboxed iframe on the project page.
- Do not execute uploaded server-side code.
- Reject unsafe archive paths such as `../`, absolute paths, or archive entries that escape the project directory.
- Add a file-count and decompressed-size guard even in local development.
- The hosted project must not have access to the parent application’s cookies, storage, or DOM.

Suggested iframe policy:

```html
<iframe sandbox="allow-scripts" ...></iframe>
```

Add only the minimum additional sandbox permissions required by the seeded examples. Do not use `allow-same-origin` unless the implementation genuinely requires it and the isolation model is understood.

### Source code

- Source code is optional.
- For web apps, support an optional second ZIP upload labeled “Source code.”
- Allow the owner to download the source bundle from the project page.
- Do not expose source code publicly unless the owner selects a public visibility setting.

### Cover-image suggestion

Implement best-effort automatic cover generation:

1. Video: extract a poster frame.
2. Web app: attempt a local screenshot using the available browser automation/tooling.
3. Fallback: use a neutral generated placeholder based on the project type and title.
4. Always allow a manually uploaded cover image.

Cover detection is a stretch feature; it must not block project publishing.

## Curated tag taxonomy

Use a curated taxonomy rather than unconstrained free-form tags. Store tags by category so the UI can present grouped filters.

### Languages and fundamentals

`HTML`, `CSS`, `JavaScript`, `TypeScript`, `Python`, `Java`, `C`, `C++`, `C#`, `Go`, `Rust`, `Kotlin`, `Swift`, `SQL`, `Algorithms`, `Data Structures`, `Mathematics`, `Statistics`

### Web and application development

`React`, `Next.js`, `Vue`, `Angular`, `Node.js`, `Express`, `Django`, `Flask`, `REST APIs`, `GraphQL`, `WebSockets`, `Frontend`, `Backend`, `Full Stack`, `Mobile Development`, `Desktop Applications`

### Data, AI, and computation

`Data Analysis`, `Data Visualization`, `Machine Learning`, `Deep Learning`, `Generative AI`, `Natural Language Processing`, `Computer Vision`, `Audio Processing`, `Optimization`, `Simulation`, `Scientific Computing`, `Databases`, `Data Engineering`

### Systems and engineering practice

`Distributed Systems`, `Cloud`, `DevOps`, `Docker`, `Kubernetes`, `Testing`, `Security`, `Cryptography`, `Performance`, `Open Source`, `Version Control`, `Accessibility`

### Design, media, and domains

`UI/UX`, `Graphic Design`, `Game Development`, `Animation`, `Video`, `Music`, `Robotics`, `Hardware`, `Education`, `Finance`, `Health`, `Science`, `Civic Technology`, `Social Impact`, `E-commerce`, `Product Design`

Allow an optional custom tag only if it does not interfere with curated filtering. The initial browse/filter UI should emphasize curated tags.

## Profiles

### Creator profile

Include:

- display name;
- profile image/avatar;
- short bio;
- interests;
- general education information;
- general location;
- hiring availability;
- social links, all optional;
- project collection;
- message/contact controls.

Do not include a resume field in the MVP.

Suggested availability values:

- `open_to_work`
- `open_to_freelance`
- `open_to_collaboration`
- `not_currently_available`

### Company profile

Include:

- company name;
- logo/avatar;
- short description;
- general location;
- industry/domain tags;
- company interests;
- website/social links, optional;
- verification badge.

Seeded/demo companies should be marked verified in data. Build the data model so a future verification service can replace the hardcoded flag.

## Feed, filters, and ranking

The primary product surface is the company-adjustable project feed.

### Filters

Support:

- technology tags;
- capability tags;
- project type;
- project status;
- creator general location;
- creator availability;
- date/freshness range;
- text search over title and description.

Company users can save a default filter configuration based on their interests. Their feed opens with those filters applied. They can clear or modify the filters at any time.

Visitors and creators receive a sensible default feed with no company-specific interests.

### Ranking goals

The feed should combine:

- relevance to active filters/company interests;
- freshness;
- popularity, primarily views;
- standard text-search relevance;
- deterministic exploration so the same popular projects do not permanently dominate.

The ranking must be explainable and deterministic for a given user/company, filter set, and time bucket.

### Recommended MVP ranking

1. Apply hard filters first.
2. Calculate a relevance score from tag overlap and title/description text matching.
3. Add a freshness component with a smooth age decay.
4. Add a popularity component using `log1p(views_count)` so extremely popular projects do not overwhelm the feed.
5. Add deterministic exploration using a stable hash of `(viewer_id or company_id, project_id, week_bucket)`.
6. Sort by the combined score.

Conceptual score:

```text
score =
    0.45 * relevance
  + 0.20 * freshness
  + 0.15 * popularity
  + 0.20 * exploration
```

The exact weights may be tuned during implementation, but they must be centralized and documented.

The stable weekly hash means:

- refreshing the page does not randomly reorder everything;
- the feed remains reproducible for debugging;
- the exploration order changes over time;
- less popular and newer projects receive exposure.

Also provide explicit sort modes where convenient:

- Recommended
- Newest
- Popular

### Views

- Increment views when a project detail page is meaningfully opened.
- Avoid incrementing repeatedly from rapid refreshes by debouncing per viewer/session/project.
- Anonymous viewers may be grouped by short-lived session identifier.
- Do not expose individual viewer identities.

## Messaging

Implement asynchronous one-to-one inbox threads.

### Threads

- `message_threads(id, participant_a_id, participant_b_id, project_id nullable, created_at, updated_at)`
- A thread may optionally reference one project.
- A thread should show the referenced project when present.
- Prevent duplicate active threads for the same participant pair and project when practical.

### Messages

- `messages(id, thread_id, sender_id, body, created_at, deleted_at nullable)`
- Plain text only for MVP.
- No approval workflow.
- Show sent/received timestamps.
- Support delete or hide for the sender if easy within the existing stack.

### Basic controls

- Block user.
- Report message or thread if the implementation supports it cleanly.
- Blocked users cannot start new messages or comment.
- Add basic rate limiting or a simple per-user messaging cooldown to reduce spam.

## Comments

- Comments belong to a project.
- Flat comments are sufficient; nested replies are optional and should not block the MVP.
- Authenticated users can comment unless blocked by the project owner or comment author.
- Comment authors can delete their own comments.
- Project owners can hide/delete comments on their projects.
- Include a report action.

## Saves/bookmarks

- Authenticated users can save and unsave projects.
- `/dashboard` should show saved projects.
- Saved projects remain saved if the project later archives, but display an archived label.

## Privacy, blocking, and reporting

Implement:

- public or unlisted project visibility;
- user blocking;
- project reporting;
- basic message controls;
- owner-controlled source-code visibility;
- no public exact address or sensitive personal information.

Reports may simply be stored for moderator review in the MVP. Do not build a full moderation console unless time remains.

Minimum report model:

```text
reports(id, reporter_id, target_type, target_id, reason, details, status, created_at)
```

## Automatic archiving

Projects should automatically archive after six months to keep the main feed fresh.

Recommended behavior:

- A published project becomes archived six months after `published_at` or `last_republished_at`.
- Archived projects disappear from the default feed and normal search results.
- Archived projects remain visible to the owner.
- Archived project URLs continue to work and show an archived label.
- The owner can republish/renew the project, which sets `last_republished_at = now`.
- Archiving should not delete media, comments, saves, or messages.

For the local MVP, implement both:

1. Lazy archival during feed queries, so behavior works without a scheduler.
2. A small maintenance command or endpoint that archives expired projects explicitly.

## Data model summary

At minimum, support these entities:

- `users`
- `creator_profiles`
- `company_profiles`
- `skills/tags`
- `projects`
- `project_media`
- `project_tags`
- `project_collaborators`
- `saved_projects`
- `message_threads`
- `messages`
- `comments`
- `blocks`
- `reports`
- `project_views`
- `feed_preferences`

Use the repository’s existing database conventions. Do not introduce a second database or ORM if one already exists.

## Seed/demo data

The demo must feel populated immediately.

Seed:

- at least 6 creator profiles;
- at least 10 projects;
- both MP4 and web-app projects;
- at least 3 verified company profiles;
- varied tags and project statuses;
- varied creator locations and availability;
- several collaborators;
- sample saves;
- sample comments;
- at least two message threads;
- varied view counts and publication dates;
- at least one archived project for demonstrating archive behavior.

All seed media should be local. Create small self-contained web-app examples and small local MP4 demo assets if necessary. Do not make the demo depend on external URLs.

Recommended demo story:

1. A creator profile publishes a web app and a video project.
2. The creator adds `Python`, `Data Visualization`, and `Education` tags.
3. A second project has `React`, `TypeScript`, and `Accessibility` tags.
4. A verified company has default interests in `Data Visualization`, `Education`, and `Python`.
5. The company opens the feed and sees relevant projects first.
6. A less popular but fresh project appears through deterministic exploration.
7. The company opens the project, runs the hosted web app, saves it, comments, and sends a project-specific message.
8. The creator receives the message in the inbox.

## Suggested agent work split

Agents should inspect the existing repository before changing files and should follow its established framework, styling, and database conventions.

### Agent A — foundation and data

- Inspect the repository and existing app architecture.
- Establish or extend the database schema.
- Implement auth and roles.
- Implement creator/company profiles.
- Add curated tags and seed data.

### Agent B — project creation and hosting

- Implement project creation/editing.
- Implement MP4 upload and playback.
- Implement HTML/CSS/JavaScript ZIP upload.
- Implement safe extraction and sandboxed serving.
- Implement cover upload and best-effort poster/screenshot generation.

### Agent C — discovery feed

- Implement public project feed.
- Implement filters and text search.
- Implement company default filters.
- Implement deterministic ranking with freshness, views, relevance, and exploration.
- Implement view counting and explicit sort modes.

### Agent D — social and communication

- Implement creator profiles and project pages.
- Implement saves.
- Implement comments.
- Implement inbox threads and optional project attachment.
- Implement blocking and reporting.

### Agent E — integration, seed experience, and QA

- Make the core demo path coherent.
- Verify anonymous browsing.
- Verify both hosted project types.
- Verify feed defaults and deterministic ordering.
- Verify archive behavior.
- Add loading, empty, error, and permission states.
- Fix broken integration points and polish the primary screens.

Agents must not independently replace major architecture choices. If a shared schema or route needs to change, update the plan or coordinate through the shared task notes before overwriting another agent’s work.

## Acceptance criteria

The MVP is successful when all of the following work locally:

### Browsing and discovery

- An anonymous visitor can browse published projects.
- A visitor can filter by tags, type, status, location, availability, and text.
- A company can save default feed filters.
- The default company feed applies those filters automatically.
- The recommended order is deterministic within a time bucket.
- Freshness, popularity, and exploration visibly affect results.
- Archived projects do not appear in the default feed.

### Projects

- A creator can publish an MP4 project and play it on the platform.
- A creator can publish a ZIP web app and run it on the platform.
- A creator can upload a cover or use a generated/fallback cover.
- A project can have tags, status, collaborators, optional “looking for,” and optional source code.
- A project can be republished after archiving.

### Profiles and interaction

- Creator and company profiles render publicly.
- A user can save and unsave a project.
- A user can comment on a project.
- A company can send a one-to-one message.
- The recipient can see and respond in an inbox thread.
- A user can block another user.
- A user can report a project.

### Freshness and safety

- A project older than six months after publication/renewal is archived.
- Archived projects are not deleted.
- Uploaded web-app archives cannot escape their project directory.
- Uploaded web apps are sandboxed away from the parent application.
- Basic upload, message, and error states are understandable.

## Implementation priorities

If time runs short, preserve this order:

1. Public project feed.
2. Hosted web-app and MP4 viewing.
3. Project creation with tags and metadata.
4. Company filters and deterministic ranking.
5. Profiles.
6. Messaging.
7. Saves and comments.
8. Reports, blocking, archive maintenance command, and cover automation.

Never remove platform hosting or anonymous project browsing to save time. Those are central to the product concept.

## Final demo statement

Everbuild lets companies discover people by seeing what they can build—not by reading what they claim on a resume.
