# keySkillset — Salesforce Email Design Rulebook

**Version 2.0 | April 2026 | Internal Use Only**
*Complete Guide — HTML Email Best Practices, Limits, Dark Mode, Accessibility & Deliverability*
*Created by – Sandesh Banakar*
*(Supersedes Version 1.0 — March 2026)*

---

## 1. Why This Rulebook Exists

This rulebook documents every HTML email lesson learned at keySkillset — from critical rendering failures during the March 2026 maintenance email project through to updated 2026 research on dark mode, accessibility, and deliverability. It is the single source of truth for anyone building or reviewing HTML emails that are sent via Salesforce.

**Two Salesforce send methods are in scope for this document:**
- List Email / Campaign Email — bulk sends from list views or campaign records
- Flow-triggered / Transactional Email — automated sends triggered by Salesforce Flow

**What went wrong in the March 2026 project:**
- Original email used div/flexbox/animations — rejected by Salesforce
- File size was 41,903 chars — exceeded the 32,000-char List Email limit
- `rgba()` colours broke in Outlook, making text invisible
- Logo pointed to a 404 URL
- Inline SVGs used throughout — not supported in Outlook desktop
- CSS animations stripped by every client
- `font-weight:800` silently ignored by Outlook

---

## 2. Salesforce Character & Size Limits

Salesforce enforces HTML size limits depending on how the email is sent. Exceeding a limit throws a hard error that prevents sending. Salesforce also adds tracking wrapper markup on top of your template — this overhead must be accounted for in your target size.

| Send Method | HTML Limit | Notes |
|---|---|---|
| List Email / Campaign Email | **32,000 chars** | Hard-coded in Lightning. Salesforce tracking overhead adds ~5–10K on top of your file size. This is what we hit in March 2026. |
| Flow-triggered / Transactional Email | **102,400 chars** | Higher limit for Flow/transactional sends. Standard template limit. Still subject to tracking overhead. Count characters before uploading. |
| Gmail Clipping Threshold | **102 KB file size** | Gmail clips email and shows "View entire message". Target under 80 KB file size to be safe. Affects all send methods. |
| Daily Mass Email Send Limit | **5,000/day (org)** | List Email sends count against the org-wide 5,000 daily mass email limit. Shared with all bulk/automated sends. Emails over limit are silently dropped. |

> **Rule of Thumb:** Always target under 25,000 characters for List Email / Campaign sends. This gives Salesforce ~7,000 chars of tracking/wrapper headroom. Our final v4 maintenance email template was 14,576 chars — 54% under the limit. For Flow-triggered emails, target under 80,000 chars.

---

## 3. The Complete Rules — What To Do & What To Avoid

Every rule below is drawn from project failures, Salesforce documentation, and 2025–2026 email client research.

**Status indicators:**
- **REQUIRED** = must follow
- **FORBIDDEN** = never do
- **CAUTION** = use carefully
- **NEW** = added in v2.0

### Layout & Structure

| Rule | Status | What breaks if you ignore it |
|---|---|---|
| Use table-based layout (`table`, `tr`, `td`) | **REQUIRED** | div/flexbox/grid breaks completely in Outlook (Word rendering engine). Layout collapses into a single column of unformatted text. |
| Max email width: 600–620px | **REQUIRED** | Wider emails cause horizontal scrolling on mobile. Content gets clipped or misaligned. |
| Single-column layout | **REQUIRED** | Multi-column layouts using CSS break in Outlook. Use nested tables for any column structure. |
| Use `role="presentation"` on layout tables | **REQUIRED** | Screen readers announce table structure to users. Accessibility standard for HTML email. |
| Use Flexbox or Grid | **FORBIDDEN** | Outlook ignores both entirely. Gmail mobile has partial support only. Layout breaks unpredictably. |
| Use `position` / `float` / `clear` | **FORBIDDEN** | Stripped by Outlook and Gmail. Elements overlap or disappear from view. |
| Use `div`, `section`, `article`, `aside`, `nav` for layout | **FORBIDDEN** | Outlook uses Word's engine which ignores these elements. Everything stacks or collapses. |
| Use HTML5 semantic elements | **FORBIDDEN** | Not supported in Outlook. Use table-based equivalents only. |

### CSS Styling

| Rule | Status | What breaks if you ignore it |
|---|---|---|
| All critical CSS must be inline (`style="..."`) | **REQUIRED** | Gmail strips `<style>` blocks entirely. Outlook ignores class-based styles. All layout, colour, and font styles must be on each element directly. |
| Add Outlook mso-table resets in `<style>` block | **REQUIRED** | Without `mso-table-lspace/rspace:0pt`, Outlook adds phantom gaps between table sections. Without `#outlook a{padding:0}`, Outlook pads all links. |
| Use `rgba()` or `hsla()` colours | **FORBIDDEN** | Outlook does not support `rgba()`. Text/backgrounds using `rgba()` become invisible or render as black. Always convert to solid hex. |
| Use CSS gradients (`linear-gradient`, `radial-gradient`) | **FORBIDDEN** | Outlook renders no gradient — falls back to solid colour or transparent. Use solid `bgcolor` on `<td>` instead. |
| Use CSS animations (`@keyframes`) | **FORBIDDEN** | Stripped by Outlook, Gmail, Yahoo. Animations don't play but add to file size and can trigger spam filters. |
| Use pseudo-elements (`::before` / `::after`) | **FORBIDDEN** | Not supported in any major email client. Elements using them simply do not render. |
| Use CSS `background-image` property | **FORBIDDEN** | Outlook strips CSS background images completely. Use `bgcolor` attribute on `<td>` instead. |
| Use JavaScript of any kind | **FORBIDDEN** | Stripped by all email clients. Email is a static medium. |
| Use `position`, `float`, `z-index`, `clear` in CSS | **FORBIDDEN** | Stripped by Outlook and Gmail. Elements overlap or disappear. |
| Use `font-weight` above 700 | **FORBIDDEN** | Outlook has no bold weight above 700. `font-weight:800` or `900` is silently ignored — text appears as regular weight. |
| Use CSS shorthand properties (`margin`, `padding`, `border`) | **CAUTION** | Some clients only recognise individual properties. Write `margin-top`, `margin-right` etc. separately instead of `margin: 0 0 8px 0`. |
| Use `box-shadow` or `text-shadow` | **CAUTION** | Outlook ignores shadows completely. Safe to use, but don't rely on them for visual hierarchy. |
| Use `border-radius` | **CAUTION** | Outlook ignores `border-radius` — corners render as sharp squares. Visual only, layout is not broken. |

### Fonts & Typography

| Rule | Status | What breaks if you ignore it |
|---|---|---|
| Use web-safe fonts only (Arial, Georgia, Verdana, Helvetica) | **REQUIRED** | Custom fonts are ignored by Outlook, Gmail, and Yahoo. Text falls back to Times New Roman, breaking the design. |
| Minimum font size: 14px body text | **REQUIRED** | Smaller text is unreadable on mobile. iOS auto-scales small text upward, potentially breaking layout. |
| Line height: 1.5–1.7 (use `line-height` attribute on `<td>`) | **REQUIRED** | Tighter line height makes text cramped and difficult to read on mobile screens. |
| Left-align body text | **REQUIRED** | Centre-aligned long text and justified text both reduce readability and fail WCAG 2.1 AA guidelines. Reserve centring for headlines and CTAs only. |
| Use Google Fonts or external `@font-face` | **FORBIDDEN** | Outlook ignores `@font-face` and Google Fonts imports entirely. Gmail also strips them. Only Apple Mail supports them. |

### Images & Media

| Rule | Status | What breaks if you ignore it |
|---|---|---|
| Use hosted images (Salesforce Content Library or CDN) | **REQUIRED** | Images not on a public URL won't load. Broken image icons appear instead. |
| Set file to "Externally Available" in Salesforce Content Library | **REQUIRED** | If not set externally available, the image returns a 401/403 error to external email clients. Logo won't load. |
| Always set `width` attribute on `<img>` | **REQUIRED** | Outlook uses the image's natural size if no width is set — can cause oversized images that break layout. |
| Always use `height:auto` in CSS, not hardcoded height | **REQUIRED** | Hardcoding both width and height squishes the image. Let height scale naturally. |
| Always include descriptive alt text on every `<img>` | **REQUIRED** | Many clients block images by default. Without alt text, recipients see a blank box. Fails WCAG 1.1.1. |
| Always add `display:block` to images | **REQUIRED** | Without `display:block`, images render inline and create phantom spacing below them in most clients. |
| For logo images: use PNG with transparent or white background | **REQUIRED** | Logos with dark text on a transparent background become invisible in dark mode. Use a solid or contrasted background. |
| Use base64-encoded images | **FORBIDDEN** | Dramatically increases file size. Many clients block base64 images as a security measure. Broken in Outlook. |
| Use inline SVG elements | **FORBIDDEN** | SVG is not supported in Outlook desktop at all. Renders as blank space. Replace with PNG or text symbols. |
| Use CSS `background-image` for visible images | **FORBIDDEN** | Outlook strips CSS background images. Use `bgcolor` on `<td>` for colour. For visible images, use `<img>` only. |

### Dark Mode *(NEW in v2.0)*

| Rule | Status | What breaks if you ignore it |
|---|---|---|
| Add `<meta name="color-scheme" content="light">` to `<head>` | **REQUIRED** | Without this, some clients apply full colour inversion by default, making your design unreadable. |
| Add `<meta name="supported-color-schemes" content="light">` to `<head>` | **REQUIRED** | Required alongside `color-scheme` for Apple Mail to honour your light-mode intent. |
| Never use pure `#000000` or `#FFFFFF` for critical text or backgrounds | **CAUTION** | Apple Mail fully inverts pure black and white regardless of contrast rules. Use near-equivalents such as `#000001` or `#FFFFFE` instead. |
| Add Outlook dark mode conditional: mso gradient override in `<style>` | **CAUTION** | Outlook on Windows (2021+, 365) aggressively inverts colours. MSO conditional gradient hacks can preserve specific text/background colours. Test thoroughly. |
| Add `[data-ogsc]` selectors in `<style>` for Outlook.com dark mode | **CAUTION** | Outlook.com uses partial colour inversion. Duplicating `@media (prefers-color-scheme: dark)` rules with `[data-ogsc]` prefix gives more control over Outlook.com rendering. |
| Avoid transparent image backgrounds if image contains dark elements | **REQUIRED** | Dark text/icons on transparent background become invisible against dark mode backgrounds. Use opaque white or contrasted backgrounds on image assets. |
| Test in actual dark mode inboxes — not browser preview | **REQUIRED** | Dark mode behaviour differs radically between Gmail app, Apple Mail, Outlook 365, and Outlook.com. Browser preview does not show dark mode rendering. |

### Accessibility (WCAG 2.1 AA) *(NEW in v2.0)*

| Rule | Status | What breaks if you ignore it |
|---|---|---|
| Set `lang` attribute on `<html>` element (e.g. `lang="en"`) | **REQUIRED** | Screen readers use the `lang` attribute to select the correct language/accent for voice output. WCAG 3.1.1 failure without it. |
| Minimum colour contrast ratio: 4.5:1 for body text | **REQUIRED** | Fails WCAG 1.4.3 (Contrast Minimum). Text becomes unreadable for users with low vision or colour blindness. Verify with WebAIM Contrast Checker. |
| Minimum colour contrast ratio: 3:1 for large text (18px+ or 14px+ bold) | **REQUIRED** | Lower threshold for large text under WCAG 1.4.3, but still must be verified. Do not rely on "looks fine" — measure it. |
| Never use colour as the sole method of conveying information | **REQUIRED** | Fails WCAG 1.4.1. Users with colour blindness cannot distinguish information presented only through colour. Always pair colour with text or an icon. |
| Use logical heading structure (`h1`, `h2`, `h3`) in email copy | **REQUIRED** | Screen readers navigate by heading structure. Skipping levels or using headings only for size creates confusing navigation for blind users. |
| Add `aria-label` to CTA links that lack descriptive visible text | **REQUIRED** | Screen readers read link text aloud. "Click here" or "Learn more" alone fails WCAG 2.4.6. Write `aria-label="Set password and log in to keySkillset"` instead. |
| Minimum tap target size: 44 × 44px for buttons and links | **REQUIRED** | Smaller targets are difficult to tap on mobile. Fails WCAG 2.5.5. Poor UX and accessibility for motor-impaired users. |
| Maintain 80:20 text-to-image ratio | **REQUIRED** | Screen readers cannot interpret image content. Emails that are mostly images exclude users relying on assistive technology. Also flagged by spam filters. |
| Do not use colour alone for link differentiation from body text | **CAUTION** | Fails WCAG 1.4.1 if contrast between link and surrounding text is below 3:1. Add underline or other visual distinction. |
| Add `aria-hidden="true"` to decorative emoji or icons | **CAUTION** | Screen readers will read out emoji names aloud (e.g. "party popper"). Decorative emoji should be hidden from assistive technology. |

### Merge Fields & Personalisation Tokens *(NEW in v2.0)*

| Rule | Status | What breaks if you ignore it |
|---|---|---|
| Count characters with merge fields at their maximum expected length | **REQUIRED** | Merge fields like `{{org_name}}` expand at send time. A 10-char token could become a 50-char value. Always estimate worst-case file size before uploading. |
| Use Salesforce standard merge field syntax: `{{{field_name}}}` | **REQUIRED** | Custom template syntax is ignored or rendered literally. Use Salesforce-standard fields from the template editor. |
| Test merge fields using Send Test with actual records | **REQUIRED** | Merge field errors only surface at render time. A null field can break layout or produce blank sections. Always test with real data. |
| Never put merge fields inside CSS property values | **FORBIDDEN** | Salesforce does not resolve merge fields inside `<style>` blocks. The CSS will be rendered literally and break styling. |
| Never use merge fields in image `src=""` URLs | **CAUTION** | Dynamic image URLs from merge fields are unreliable. Host images in Salesforce Content Library and use fixed URLs. |
| Add fallback text for every merge field | **CAUTION** | If a field is null for a recipient, nothing renders. Use Salesforce IF/ELSE merge syntax to provide fallback copy. |

### Salesforce-Specific Rules

| Rule | Status | What breaks if you ignore it |
|---|---|---|
| Keep List Email template under 25,000 characters | **REQUIRED** | Salesforce List Email limit is 32,000 chars. Tracking wrappers add ~5–10K. Exceeding limit throws "This email template is too big" error and blocks sending. |
| Keep Flow-triggered email template under 80,000 characters | **REQUIRED** | Stay within safe headroom below the 102,400-char standard template limit. |
| Host all images in Salesforce Content Library | **REQUIRED** | External URLs may be blocked by Salesforce's security policies. Salesforce-hosted images are served from trusted domains. |
| Always send a test email before scheduling | **REQUIRED** | Salesforce renders differently from browser preview. Tracking wrappers, link rewrites, and merge fields can change the final output. |
| Use custom HTML email template (not Letterhead) | **REQUIRED** | Classic Letterhead templates add extra markup and override your styling. Use Custom HTML template type for full control. |
| Avoid spam trigger words in subject line and body copy | **CAUTION** | Words like "Urgent", "Act Now", "Free", excessive ALL CAPS, and multiple !!! increase spam score. See Section 6 for the full list. |

### Mobile Compatibility

| Rule | Status | What breaks if you ignore it |
|---|---|---|
| Add viewport meta tag to `<head>` | **REQUIRED** | Without viewport meta, mobile clients render the email at desktop width and scale it down — text becomes unreadably small. |
| Add `-webkit-text-size-adjust:100%` to body CSS | **REQUIRED** | iOS automatically enlarges small text. This resets it and preserves the intended layout. |
| Add `x-apple-disable-message-reformatting` meta to `<head>` | **REQUIRED** | Without this, Apple Mail on iOS reformats the email — scaling and reflowing content unexpectedly. |
| Use `@media` query block for mobile overrides | **REQUIRED** | Without responsive overrides, desktop font sizes and padding are too large/small on mobile. Note: Gmail app strips media queries — ensure desktop styles are readable on mobile too. |

---

## 4. Dark Mode — How Each Client Behaves

Dark mode is now mainstream across all major email clients. Each client handles dark mode differently, and the differences are significant enough that you must understand them before designing any keySkillset email. There are three behaviours in the wild:

| Client | Dark Mode Type | What It Does To Your Email |
|---|---|---|
| Outlook 2021 / 365 (Windows) | Full colour inversion | Aggressively inverts all colours. Light backgrounds become dark. Dark text becomes light. Even explicitly set colours with `!important` are overridden via `data-ogsb` / `data-ogsc` attributes. Use MSO conditional gradients to work around. |
| Outlook.com (web) | Partial colour inversion | Inverts light backgrounds and dark text. Leaves dark sections largely alone. Targetable via `[data-ogsc]` CSS selectors. |
| Apple Mail (macOS / iOS) | Partial inversion + meta tag support | Respects `<meta name="color-scheme" content="light">`. Fully inverts pure `#000000` and `#FFFFFF` — use near-equivalents like `#000001` or `#FFFFFE` to avoid this. |
| Gmail app (iOS) | Full colour inversion | Forces dark mode on light emails. Can be partially controlled via `mix-blend-mode` hack. No `@media` support. |
| Gmail (web) | No change / partial | Gmail web does not aggressively force dark mode. Generally leaves your email as-is. `@media (prefers-color-scheme: dark)` is partially supported. |
| Yahoo Mail | No change | Yahoo Mail does not apply dark mode to email content. Your light theme renders as-is. |

### Minimum Dark Mode Code Requirements

Every keySkillset email sent through Salesforce must include the following in the `<head>`:

```html
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
```

---

## 5. What Breaks, Where & Why — Quick Reference

| Symptom | Likely Cause | Client(s) | Fix |
|---|---|---|---|
| Layout collapses to single column | Using div/flexbox for layout | Outlook | Rebuild using nested tables only |
| Text is invisible on coloured background | `rgba()` colours used | Outlook | Replace all `rgba()` with solid hex equivalents |
| Background is flat or missing | CSS gradient used | Outlook | Use solid `bgcolor` on `<td>` instead |
| Logo shows broken image icon | URL wrong / not public / not Externally Available | All clients | Host in Salesforce Content Library, set Externally Available |
| Logo is squished or stretched | Both width & height hardcoded on `<img>` | All clients | Set `width` attribute only; use `height:auto` in CSS |
| "Email is too big" error | File over 32,000 chars (List Email) | Salesforce | Minify HTML, remove sections. Target under 25,000 chars. |
| Fonts look different than expected | Custom or Google Font used | Outlook, Gmail | Use Arial, Georgia, Verdana only |
| Text appears in regular weight | `font-weight:800` or `900` used | Outlook | Cap `font-weight` to 700 |
| Gaps between table sections | mso-table resets missing | Outlook | Add `mso-table-lspace:0pt; mso-table-rspace:0pt` in `<style>` |
| Images too large or break layout | No `width` attribute on `<img>` | Outlook | Always set `width` attribute and `max-width` in `style` |
| Phantom space below images | No `display:block` on images | All clients | Always add `display:block` to all `<img>` tags |
| Email clipped with "View entire message" | File over 102 KB | Gmail | Minify and remove unused sections. Target under 80 KB. |
| Animations not playing | `@keyframes` used | All clients | Remove animations — use static design only |
| SVG not visible | Inline SVG used | Outlook | Replace SVG with text symbols, Unicode, or hosted PNG |
| Logo invisible in dark mode | Dark logo on transparent PNG background | Apple Mail, Gmail iOS, Outlook 365 | Export logo with opaque white or contrasted background |
| Text becomes white-on-white in dark mode | Pure `#FFFFFF` text with light background — inverted by client | Apple Mail | Use `#FFFFFE` instead of `#FFFFFF`; add `color-scheme` meta tags |
| Merge field renders as literal text | Wrong syntax or field not available on record | Salesforce | Use Salesforce standard merge syntax; test with Send Test |
| Screen reader reads emoji names aloud | Decorative emoji not hidden | Screen readers (all clients) | Add `aria-hidden="true"` to decorative emoji spans |
| Low-contrast text fails accessibility audit | Colour contrast ratio below 4.5:1 | All clients | Check all text/background combinations with WebAIM Contrast Checker |

---

## 6. Deliverability & Spam Avoidance

Spam filters in 2026 use machine learning and evaluate dozens of signals simultaneously — not just keywords. The following rules apply to all Salesforce sends from keySkillset.

### 6.1 — Technical Authentication (Non-Negotiable)

These must be configured at the domain level before any email is sent. If you are unsure whether these are set up, ask the Salesforce administrator.

| Authentication Protocol | What It Does |
|---|---|
| SPF (Sender Policy Framework) | A DNS record listing IP addresses authorised to send email from your domain. Prevents spoofing. |
| DKIM (DomainKeys Identified Mail) | Adds a cryptographic signature to every email proving it came from your domain and was not tampered with in transit. |
| DMARC (Domain-based Message Authentication) | Ties SPF and DKIM together. Tells receiving servers what to do with emails that fail authentication. Required by Gmail and Yahoo for bulk senders in 2024 onwards. |

### 6.2 — Content Rules

- Maintain a minimum 60:40 text-to-image ratio. Image-only emails are flagged by spam filters because they cannot read the text inside images.
- Avoid link shorteners (e.g. bit.ly). These are heavily used by spammers to hide malicious URLs. Use full URLs or hyperlinked anchor text.
- Limit links to 2–3 per email where possible. Excessive links are a spam signal.
- Never use ALL CAPS in the subject line or body. A consistent spam signal across all major filters.
- Avoid excessive punctuation (!!!, ???, $$$). Flagged by all major content filters.
- Keep HTML clean and well-formed. Broken tags, messy nesting, and malformed markup suggest spam or phishing toolkits. Validate before sending.
- Never reuse the same template verbatim indefinitely. Spam filters detect high-volume identical emails. Rotate copy and structure periodically.

### 6.3 — Subject Line Spam Trigger Words to Avoid

The following categories of words are flagged by spam filters in 2026. Use natural, specific language instead:

| Category | Examples to Avoid | Safe Alternatives |
|---|---|---|
| Urgency | Urgent, Act Now, Final Notice, Last Chance, Hurry | Use specific deadlines: "Respond by Friday 25 April" |
| Financial promise | Free, Earn money, Cash, Save big, Lowest price, 100% guarantee | Describe actual value without promotional framing |
| Aggressive CTA | Click here, Buy now, Order now, Subscribe now | Use descriptive anchor text: "Set your password", "View your dashboard" |
| Deceptive framing | You've been selected, Congratulations, Winner, Exclusive offer | Be direct and specific about what the email is |
| Excessive formatting | ALL CAPS, multiple !!!, $$$, excessive emoji | Use sentence case, standard punctuation, one emoji maximum in subject |

### 6.4 — Physical Address & Legal Requirements

CAN-SPAM (US) and GDPR (EU) both require a physical mailing address in every commercial email footer. keySkillset emails must include the company address and a functional unsubscribe link in every send. Never remove the legal footer copy — it is compliance-required.

---

## 7. Testing Workflow — Required Before Every Send

No email should be scheduled for live send before completing the following checklist. Browser preview in Salesforce is insufficient — you must test in actual email clients.

### 7.1 — Pre-Upload Checks

- [ ] Count characters — confirm under 25,000 for List Email sends, or under 80,000 for Flow-triggered sends
- [ ] Validate HTML — no unclosed tags, no broken nesting. Run through an HTML validator.
- [ ] Check file size (not character count) — confirm email is under 80 KB to avoid Gmail clipping
- [ ] Verify all image URLs are live, publicly accessible, and hosted in Salesforce Content Library
- [ ] Confirm all images have `width` attribute set and `display:block` applied
- [ ] Replace all `rgba()` colours with solid hex equivalents
- [ ] Replace all Google Fonts imports with web-safe font stack
- [ ] Cap all `font-weight` values at 700
- [ ] Confirm no inline SVG elements remain — replace with PNG or Unicode symbols
- [ ] Confirm no CSS animations or `@keyframes` remain
- [ ] Add `color-scheme` and `supported-color-schemes` meta tags for dark mode
- [ ] Verify merge fields use correct Salesforce syntax and have fallback values
- [ ] Check all text/background contrast ratios using WebAIM Contrast Checker (minimum 4.5:1)
- [ ] Confirm alt text is present and descriptive on every `<img>` element
- [ ] Verify `lang` attribute is set on `<html>` element
- [ ] Confirm CTA links have descriptive `aria-label` attributes
- [ ] Check subject line and body copy for spam trigger words (Section 6.3)

### 7.2 — Salesforce Send Test

- [ ] Upload template to Salesforce and use "Send Test" to send a preview to your own inbox
- [ ] Send test to at least: Gmail (web), Outlook desktop (2019 or 365), iPhone Mail
- [ ] Enable dark mode on each test device and re-check every client
- [ ] Verify logo loads correctly in all three clients
- [ ] Verify all colours are correct (no invisible text, no inverted sections)
- [ ] Verify layout holds — no collapsed columns, no phantom gaps, no oversized images
- [ ] Verify CTA link is functional and points to the correct URL
- [ ] Verify merge fields resolve correctly (or test with actual record data)
- [ ] Verify email is readable at mobile width without horizontal scrolling
- [ ] Use a spam testing tool (Mail-Tester.com or Litmus Spam Filter Testing) before the live send

### 7.3 — Recommended Testing Tools

| Tool | What It Tests |
|---|---|
| Salesforce Send Test (built-in) | Tests merge field resolution, tracking wrappers, Salesforce link rewrites |
| Litmus (paid) | Preview in 90+ email clients including Outlook 2013/2016/2019/365, Gmail app, Apple Mail dark mode |
| Email on Acid (paid) | Cross-client rendering, spam filter testing, accessibility checker, dark mode preview |
| Mail-Tester.com (free) | Full spam score including SPF/DKIM/DMARC check, content analysis, HTML quality score |
| WebAIM Contrast Checker (free) | Checks text/background colour contrast against WCAG 2.1 AA (4.5:1 ratio) |
| Parcel.io email code editor (free tier) | Real-time rendering with dark mode preview — faster than Litmus for quick iteration |

---

## 8. Recommended Email Build Workflow

### Step 1 — Design with Constraints in Mind

- Use solid colours only — no gradients, no `rgba()`
- Plan for single-column layout using tables from the start
- Only use Arial, Helvetica, Georgia, or Verdana
- Avoid pure `#000000` or `#FFFFFF` — use near-equivalents for dark mode safety
- Export logo as PNG with opaque background (not transparent) for dark mode safety
- Keep copy short — fewer sections equals smaller file size

### Step 2 — Build the HTML

- Table-based structure — every layout element must use `<table>` + `<tr>` + `<td>`
- All CSS inline on every element — no external stylesheets, no class-based styles
- Replace all `rgba()` with solid hex before finishing
- Cap `font-weight` at 700 throughout
- Add `role="presentation"` on all layout tables
- Set `width` + `valign` attributes directly on `<td>`, not only in CSS
- Add Outlook mso-table resets in `<style>` block in `<head>`
- Add mobile `@media` query block for responsive overrides
- Add `color-scheme` and `supported-color-schemes` meta tags in `<head>`
- Use `bgcolor` attribute on `<td>` as well as `background-color` in CSS
- Add `lang="en"` (or appropriate language) on `<html>` element
- Add `aria-label` on all CTA links

### Step 3 — Images

- Upload all images to Salesforce Content Library
- Set each file to "Externally Available"
- Get the public URL from the developer and use it in `src=""`
- Set `width` attribute on every `<img>` — never hardcode height
- Set `height:auto` in CSS, `display:block` always
- Write descriptive alt text for every image
- Ensure logo PNG has an opaque (non-transparent) background

### Step 4 — Check File Size Before Uploading

- Count characters — target under 25,000 for List Email / Campaign sends
- Target under 80,000 characters for Flow-triggered sends
- If over: minify first (remove whitespace, comments), then remove sections
- Never remove footer legal copy — required for CAN-SPAM and GDPR compliance
- Check file size is under 80 KB to avoid Gmail clipping

### Step 5 — Test Before Sending

- Complete the full pre-upload checklist in Section 7.1
- Upload to Salesforce and run Send Test — check in Gmail, Outlook desktop, and iPhone Mail
- Enable dark mode on each test device and recheck
- Run through Mail-Tester.com for spam score
- Only schedule the live send after a fully clean test pass

---

## 9. Quick Reference Cheatsheet

### Always USE

- `table`, `tr`, `td` for all layout
- Inline CSS on every element: `style="..."`
- `bgcolor` attribute on `td` in addition to `background-color` in CSS
- `width` attribute on `td` and `img`
- `valign` attribute on `td`
- `role="presentation"` on layout tables
- `display:block` on all images
- `height:auto` in CSS for images
- Descriptive alt text on all images
- Web-safe fonts only: Arial, Helvetica, Georgia, Verdana
- Solid hex colours only — e.g. `#0D2D6B` not `rgba()`
- `font-weight: 700` maximum
- Salesforce Content Library for all image hosting
- `mso-table-lspace:0pt` and `mso-table-rspace:0pt` in `<style>`
- Mobile `@media` query overrides
- `color-scheme` and `supported-color-schemes` meta tags
- `lang` attribute on `<html>`
- `aria-label` on CTA links
- 4.5:1 minimum contrast ratio on all text
- Merge field fallback values for null records

### Never USE

- `div`, `section`, `article` for layout
- `display:flex`, `display:grid`
- `rgba()` or `hsla()` for any colour
- CSS gradients (`linear-gradient`, `radial-gradient`)
- `@keyframes` or any CSS animations
- `::before` or `::after` pseudo-elements
- Inline SVG elements
- base64-encoded images
- Google Fonts or any external `@font-face`
- `font-weight: 800` or `900`
- CSS `background-image` (use `bgcolor` on `td` instead)
- JavaScript of any kind
- `position`, `float`, `z-index`, or `clear` in CSS
- HTML5 semantic elements (`section`, `article`, `aside`, `nav`)
- Pure `#000000` or `#FFFFFF` for critical text or backgrounds
- Transparent PNG backgrounds on logos or icons with dark elements
- Merge fields inside CSS property values

---

## 10. What We Fixed — Project Change Log

This is a record of every change made to the keySkillset maintenance email (March 2026) and why it was necessary. It also documents the violations identified in `shine-welcome-v3.html` that must be resolved before that template is sent via Salesforce.

### 10.1 — Maintenance Email Fixes (March 2026)

| # | Change | Reason |
|---|---|---|
| 1 | Fixed broken closing HTML tags | File was truncated — `</div>` tags missing at end of file, causing rendering failure |
| 2 | Updated Started time to 11:00 AM IST | Incorrect time in original file |
| 3 | Removed Maintenance In Progress pill & clock SVG icon | Visual cleanup — SVG not supported in Outlook |
| 4 | Removed Wave divider, Pre-header, Motivation quote | File size reduction for Salesforce 32K character limit |
| 5 | Fixed Back Online cell — date/time were swapped | Date was in time position, time was in date position |
| 6 | Reduced time grid from 3 cells to 2 (Started + Back Online) | Simplified and reduced file size |
| 7 | Swapped hero subtext sentence order | Copy flow improvement |
| 8 | Widened hero-sub `max-width` from 410px to 460px | Prevented awkward mid-phrase line breaks |
| 9 | Full rebuild — div/flex to table-based inline CSS | Original file incompatible with Salesforce and Outlook |
| 10 | Removed all `rgba()` — converted to solid hex | `rgba()` not supported in Outlook — invisible text/backgrounds |
| 11 | Removed all inline SVGs — replaced with text symbols | SVG not supported in Outlook desktop |
| 12 | Removed CSS animations and `@keyframes` | Stripped by all email clients, adds to file size |
| 13 | Removed Google Fonts import | Not supported by Outlook or Gmail |
| 14 | Capped `font-weight` to 700 | Outlook ignores 800/900 — falls back to regular weight |
| 15 | Added Outlook `mso`-table resets | Prevents phantom gaps between table sections in Outlook |
| 16 | Added mobile `@media` query block | Responsive scaling for mobile email clients |
| 17 | Replaced logo URL with Salesforce Content Library URL | Original URL returned 404 — image not loading |
| 18 | Removed hardcoded height from logo `<img>` | Logo was squished — natural aspect ratio now preserved |
| 19 | Updated times to 12:00 PM / 12:00 AM on 18–19 March | Final confirmed maintenance window |

### 10.2 — shine-welcome-v3.html: Violations Requiring Fix Before Salesforce Send

The welcome email HTML file (`shine-welcome-v3.html`) was designed as a browser preview and is not Salesforce/Outlook-safe in its current form. The following violations were identified and must be resolved before this template is sent via Salesforce:

| # | Change | Reason |
|---|---|---|
| V1 | Google Fonts `@import` — remove | `@import url(Google Fonts)` in `<style>` — stripped by Outlook and Gmail. Replace with Arial/Helvetica stack. |
| V2 | `rgba()` colours throughout — replace all | `box-shadow`, `border`, and `overlay` colours use `rgba()`. Invisible in Outlook. Convert every instance to solid hex. |
| V3 | CSS gradients on hero, card, CTA button — remove | `linear-gradient` used on `.hero`, `.onboarding-card`, `.cta-btn`. Falls back to transparent in Outlook. Replace with solid `bgcolor` on `<td>`. |
| V4 | `display:flex` throughout — rebuild with tables | Used on `.cobrand-strip`, `.features-row`, `.card-step`, `.cert-teaser`, `.pm-note`, `.card-tour-row`. Outlook ignores flex entirely. Full table-based rebuild required. |
| V5 | `.hero::before` pseudo-element — remove | `::before` used for `radial-gradient` overlay on hero. Not supported in any email client. Remove entirely. |
| V6 | `font-weight:800` throughout — cap at 700 | Used on `.hero h1`, multiple headings, and bold labels. Silently ignored by Outlook — renders as regular weight. |
| V7 | `position:relative` / `position:absolute` — remove | Used on `.hero` and `.hero::before`. Stripped by Outlook and Gmail. Remove or rebuild without positioning. |
| V8 | div-based layout — full table rebuild required | Entire document uses div-based layout (`.email-wrapper`, `.hero`, `.body-section` etc.). Incompatible with Outlook. Full rebuild to `table/tr/td` required. |
| V9 | `-webkit-background-clip: text` (gradient text effect) — remove | Used on `.gradient-text` class for the hero headline. Not supported in Outlook. Replace with solid colour text. |
| V10 | No `color-scheme` meta tags — add | Missing `<meta name="color-scheme">` and `<meta name="supported-color-schemes">`. Required for dark mode safety. Add to `<head>`. |
| V11 | No `lang` attribute on `<html>` — add | Missing `lang="en"` on the root `<html>` element. Required for screen reader language detection. WCAG 3.1.1 failure. |
| V12 | No `aria-label` on CTA links — add | `cta-btn` and `tour-btn` links lack `aria-label` attributes. Screen readers only read visible text. Add descriptive `aria-labels`. |

---

## 11. The Golden Rules

> **Rule 1:** If you cannot explain how Gmail AND Outlook will render it — do not ship it.
>
> **Rule 2:** Email clients are not browsers. Treat every email like it will be opened in Outlook 2013 on Windows.
>
> **Rule 3:** Simple, table-based, inline-CSS emails always win over complex, modern CSS emails.
>
> **Rule 4:** Test in actual inboxes — not browser preview. Browser preview lies.
>
> *When in doubt: flat colour, web-safe font, hosted image, table layout.*

---

*keySkillset — Internal Document — April 2026 — Supersedes Version 1.0*
*keySkillset — Internal Use Only — Do Not Distribute*
