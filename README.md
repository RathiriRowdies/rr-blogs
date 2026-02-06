Rathiri Rowdies (RR) — Full Website Summary (features + theme rules)

1. Core purpose

A small-group blog website where all content is dynamic (posts + comments loaded from Supabase database).

Two experiences:

Public site: view posts, open single post, read comments, share posts.

Authenticated area: user dashboard + admin dashboard.

2. Roles & dashboards

User dashboard

Login / logout

Create posts (title + body + optional image)

Choose limited styling: font choice allowed, but color restricted (black/red/blue only)

View/manage their own posts (edit/delete if allowed)

Comment on posts

Admin dashboard

Everything users can do, plus:

Moderate/manage all posts (publish/unpublish, delete)

Optionally manage users (roles) through controlled policies

3. Authentication, sessions, tokens

Supabase Auth handles:

Email + password login

Verified email required (email confirmation)

Session system: access token (JWT) + refresh token

Auto session persistence + refresh (no custom token system needed unless you add server APIs)

4. Database-driven content (no hardcoding)

Posts are fetched from Supabase:

Public feed: published posts only

Single post page: post + comments

User dashboard: only the user’s posts

Admin dashboard: all posts

Comments are fetched and inserted from Supabase

5. Theme and design constraints (strict)

Global site theme

“Clean theme” = whiteboard look:

Background: white

Text: primarily black

Borders: light gray

Simple cards, clean spacing, minimal UI clutter

Typography rules

Site template uses only one font: Raleway

Titles and key items must use bold (Raleway 600/700)

No decorative fonts anywhere in the base layout

Color rules

Template must stay formal and minimal:

Primary: black + white + light gray borders

Links: blue (formal)

No extra colors in the site UI

User post styling rules

Users may change font (if you allow it), but:

Post text colors are limited to black, red, blue only

No other colors allowed in user-generated post styling

6. Performance and “fastest loading” goals

Progressive image loading

Every post image supports:

Load low-resolution thumbnail first (fast)

Seamlessly swap to full-quality image after it loads (no flicker / no reflow)

Lazy loading for images outside the viewport (recommended)

General speed practices

Minimal JS (vanilla modules)

Cache static assets via hosting/CDN

Avoid large blocking scripts

Keep CSS clean and small

7. Image and media system

Images stored in Supabase Storage

Posts store references:

image_thumb_path (LQIP/thumbnail)

image_full_path (full quality)

Optionally use:

Public bucket for best speed (public blog)

Private bucket + signed URLs if needed (more security, slightly more complexity)

8. Security requirements

Password hashing

Handled securely by Supabase Auth (not in your frontend)

Database security

Row Level Security (RLS) rules enforce:

Public reads only for published posts

Users can only modify their own posts/comments

Admin policies grant elevated moderation access

Frontend security

No service role key in the browser

Escape user content when rendering (prevent XSS)

Use HTTPS in production (protect tokens in transit)

Network / “port listening” concern

Proper production deployment should enforce:

HTTPS only

Secure headers (CSP, HSTS, etc.) if you add them

No tokens in URLs, no logging secrets

9. Sharing and cross-app connection

Share button options:

Web Share API (mobile share sheet, modern browsers)

Fallback: copy link to clipboard

Optional expansion:

Direct share links to WhatsApp, X, Facebook, LinkedIn, etc.

10. Comments (site-wide “command feature”)

Each post supports:

Read comments

Add comment (requires login)

Comments stored in DB, displayed per post

11. RR branding (name + icon)

Website name and title:

Rathiri Rowdies (RR)

A clean, minimal RR icon used in navbar and optionally favicon

Branding consistent with whiteboard theme (no flashy colors)

12. Pages included (suggested)

index.html — public feed

post.html — single post + comments + share

login.html — sign up / sign in (email verification)

dashboard.html — user dashboard (create + manage own posts)

admin.html — admin dashboard (moderation)
