# keySkillset — AWS SES Email Design Rulebook

**Version 1.0 | April 2026 | Internal Use Only**
*Signup, Welcome & Onboarding Emails — HTML Best Practices, SES Limits, Dark Mode, Accessibility & Deliverability*
*Companion to Salesforce Email Design Rulebook v2.0*
*Created by – Sandesh Banakar*

---

## 1. Purpose & Scope

This rulebook governs all HTML emails sent through AWS Simple Email Service (SES) at keySkillset — specifically signup, welcome, and onboarding emails triggered by user actions in the product. It is a companion to, and does not replace, the Salesforce Email Design Rulebook v2.0.

**What is in scope for this document:**
- Signup confirmation emails
- Welcome / onboarding emails
- Account activation and set-password emails
- Any HTML email sent programmatically via the AWS SES API or SMTP interface

**What is out of scope:**
- List Email / Campaign Email sends — covered in the Salesforce Rulebook v2.0
- Flow-triggered transactional emails sent through Salesforce — covered in the Salesforce Rulebook v2.0

> **Key difference from Salesforce:** AWS SES sends raw MIME email directly to the recipient's mail server. There is no Salesforce tracking wrapper, no 32,000-character hard wall, no Content Library dependency, and no Salesforce merge field syntax. The email client rendering constraints (Outlook, Gmail, dark mode) still apply in full because those are client-side problems, not send-platform problems.

---

## 2. How AWS SES Differs From Salesforce — At a Glance

Before building any AWS SES email, every developer and designer must understand which constraints change and which remain identical.

| Constraint | Salesforce | AWS SES |
|---|---|---|
| HTML size limit | Hard 32,000-char limit for List Email. Salesforce tracking adds 5–10K on top. | No equivalent hard limit. Gmail still clips at 102 KB file size. Practical target: keep under 80 KB. |
| Size headroom | Target under 25,000 chars to leave room for tracking wrapper. | Target under 80 KB file size. No character-count wall. |
| Template engine | Salesforce merge fields: `{{{Field_Name}}}`. Resolved server-side by Salesforce. | Handlebars syntax: `{{variable}}`. Resolved at send time by SES API. Supports conditionals, loops, partials. |
| Image hosting | Must use Salesforce Content Library. External URLs may be blocked. | Any publicly accessible CDN or S3 URL. No Content Library requirement. |
| Tracking wrapper | Salesforce adds tracking markup that inflates your file size by 5–10K. | No automatic tracking wrapper. Add UTM parameters manually to links if analytics are needed. |
| Daily send limit | 5,000 emails/day org-wide (shared with all Salesforce bulk sends). | Starts at 200/day (sandbox). Production accounts scale on request. No fixed daily cap once out of sandbox. |
| Template management | Templates managed in Salesforce Setup > Classic Email Templates. | Templates stored via AWS SES CreateEmailTemplate API. No UI — developer-managed. |
| Outlook rendering rules | Same — Outlook uses Word's engine regardless of send platform. | Same — Outlook uses Word's engine regardless of send platform. |
| Gmail clipping | Same — Gmail clips at 102 KB regardless of send platform. | Same — Gmail clips at 102 KB regardless of send platform. |
| Dark mode behaviour | Same — client-side rendering applies regardless of send platform. | Same — client-side rendering applies regardless of send platform. |
| SPF / DKIM / DMARC | Configured on Salesforce sending domain. | Must be configured separately on your SES sending domain. SES makes DKIM setup straightforward. |
| Bounce / complaint mgmt | Salesforce handles bounce tracking via its own reporting. | Must wire SNS notifications to a Lambda or webhook to catch bounces and complaints and feed your suppression list. |
| Unsubscribe requirement | Required by CAN-SPAM / GDPR in marketing emails. | Transactional emails (signup, welcome) are not legally required to include unsubscribe, but must not be deceptive. |

---

## 3. AWS SES Limits & Quotas

These are the hard limits that apply to keySkillset's AWS SES account. Unlike Salesforce's fixed 32K wall, most SES limits are adjustable by requesting a quota increase via the AWS Service Quotas console.

| Limit | Value | Notes |
|---|---|---|
| Max email size (SES API v2) | 40 MB | Includes message body, HTML, images, and attachments. MIME encoding adds ~37% to raw file sizes. Keep well under this. |
| Max email size (SES API v1) | 10 MB | Legacy API only. Use v2 for all new integrations. |
| Gmail clipping threshold | 102 KB | Gmail clips HTML at 102 KB and shows "View entire message". Target under 80 KB to be safe. |
| Sandbox sending limit | 200 emails / 24 hrs | Applies before production access is granted. Request production access via AWS Support. |
| Sandbox sending rate | 1 email / second | Applies in sandbox only. Production rate is higher and adjustable. |
| Max bounce rate (warning) | 5% | AWS warns at this threshold. Sending may be paused if rate continues rising. |
| Max bounce rate (suspension risk) | 10% | AWS suspends sending at this level. Hard-bounce addresses must be removed from your list immediately. |
| Max complaint rate (safe) | Under 0.1% | Industry standard. AWS begins review above this level. |
| Max complaint rate (suspension risk) | 0.5% | AWS suspends sending. Complaint addresses must be added to suppression list. |
| Verified identities per region | 10,000 | Combined email addresses and domains per AWS Region. |

> **Rule of thumb:** AWS SES has no 32K character wall. The only size constraint that matters in practice is the 80 KB Gmail clipping threshold. For a rich welcome email, this is generous but we can keep the file well under this limit if images are hosted externally (not embedded).

---

## 4. The Complete Rules — What To Do & What To Avoid

Rules inherited from the Salesforce Rulebook are marked OUTLOOK ONLY when they apply specifically because of Outlook's rendering engine — they are still mandatory if any recipients may be on Outlook. Given that keySkillset serves healthcare organisations with unknown client mix, treat all Outlook rules as REQUIRED unless you have confirmed your entire audience is on Gmail or Apple Mail.

### Layout & Structure

| Rule | Status | What breaks / why it matters |
|---|---|---|
| Use table-based layout (`table`, `tr`, `td`) | **REQUIRED** | Outlook uses Word's rendering engine and ignores div/flexbox/grid entirely. Layout collapses to unformatted single column. |
| Max email width: 600–620px | **REQUIRED** | Wider emails cause horizontal scrolling on mobile. Content gets clipped or misaligned on small screens. |
| Single-column layout | **REQUIRED** | Multi-column CSS layouts break in Outlook. Use nested tables for any multi-column structure. |
| Use `role="presentation"` on layout tables | **REQUIRED** | Screen readers announce table structure to users. Required for WCAG compliance and accessibility. |
| Use Flexbox or Grid for layout | **FORBIDDEN** | Outlook ignores both entirely. Gmail mobile has only partial support. Use table-based layout only. |
| Use `div`, `section`, `article` for layout | **FORBIDDEN** | Outlook's Word engine ignores div-based layouts. Everything stacks or collapses. |
| Use `position`, `float`, `z-index`, or `clear` | **FORBIDDEN** | Stripped by Outlook and Gmail. Elements overlap or disappear entirely. |
| Use HTML5 semantic elements | **FORBIDDEN** | Not supported in Outlook. Use table-based equivalents only. |

### CSS Styling

| Rule | Status | What breaks / why it matters |
|---|---|---|
| All critical CSS must be inline (`style="..."`) | **REQUIRED** | Gmail strips `<style>` blocks. Outlook ignores class-based styles. All layout, colour, and font styles must be on each element directly. |
| Add Outlook mso-table resets in `<style>` block | **REQUIRED** | Without `mso-table-lspace/rspace:0pt`, Outlook adds phantom gaps between table sections. Without `#outlook a{padding:0}`, Outlook pads all links. |
| Use `rgba()` or `hsla()` colours | **FORBIDDEN** | Outlook does not support `rgba()`. Text and backgrounds using `rgba()` become invisible or render as black. Convert all to solid hex. |
| Use CSS gradients (`linear-gradient`, `radial-gradient`) | **FORBIDDEN** | Outlook renders no gradient — falls back to solid colour or transparent. Replace with solid `bgcolor` on `<td>`. |
| Use CSS animations (`@keyframes`) | **FORBIDDEN** | Stripped by Outlook, Gmail, and Yahoo. Animations don't play and add to file size. Static design only. |
| Use pseudo-elements (`::before` / `::after`) | **FORBIDDEN** | Not supported in any major email client. Elements using them simply do not render. |
| Use CSS `background-image` property | **FORBIDDEN** | Outlook strips CSS background images completely. Use `bgcolor` attribute on `<td>` for background colour. |
| Use JavaScript of any kind | **FORBIDDEN** | Stripped by all email clients. Email is a static medium. No exceptions. |
| Use `font-weight` above 700 | **FORBIDDEN** | Outlook has no bold weight above 700. `font-weight:800` or `900` is silently ignored — text renders as regular weight. |
| Use CSS shorthand properties (`margin`, `padding`, `border`) | **CAUTION** | Some clients only recognise individual properties. Write `margin-top`, `margin-right` etc. separately rather than `margin: 0 0 8px 0`. |
| Use `box-shadow` or `text-shadow` | **CAUTION** | Outlook ignores shadows. Safe to use for other clients but never rely on them for visual hierarchy. |
| Use `border-radius` | **CAUTION** | Outlook ignores `border-radius` — corners render as sharp squares. Visual only, layout is unaffected. |
| `-webkit-background-clip: text` (gradient text) | **FORBIDDEN** | Not supported in Outlook. Replace with solid colour text. |

### Fonts & Typography

| Rule | Status | What breaks / why it matters |
|---|---|---|
| Use web-safe fonts only (Arial, Georgia, Verdana, Helvetica) | **REQUIRED** | Custom fonts are ignored by Outlook, Gmail, and Yahoo. Text falls back to Times New Roman, breaking the design. |
| Minimum font size: 14px body text | **REQUIRED** | Smaller text is unreadable on mobile. iOS auto-scales small text upward, potentially breaking layout. |
| Line height: 1.5–1.7 | **REQUIRED** | Tighter line height makes text cramped and difficult to read on mobile screens. |
| Left-align body text | **REQUIRED** | Centre-aligned long text and justified text reduce readability and fail WCAG 2.1 AA. Reserve centring for headlines and CTAs only. |
| Use Google Fonts or external `@font-face` | **FORBIDDEN** | Outlook and Gmail strip Google Fonts imports entirely. Only Apple Mail supports custom fonts. Always falls back to Times New Roman. |

### Images & Media

| Rule | Status | What breaks / why it matters |
|---|---|---|
| Host all images on a publicly accessible CDN or S3 URL | **REQUIRED** | Unlike Salesforce, you are not required to use the Salesforce Content Library. Any public URL works — but it must be genuinely public. S3 bucket must have public read access. |
| Always set `width` attribute on `<img>` | **REQUIRED** | Outlook uses the image's natural size if no width is set — can cause oversized images that break layout. |
| Always use `height:auto` in CSS — never hardcode height | **REQUIRED** | Hardcoding both width and height squishes the image. Always let height scale naturally. |
| Always include descriptive alt text on every `<img>` | **REQUIRED** | Many clients block images by default. Without alt text, recipients see a blank box. Fails WCAG 1.1.1. |
| Always add `display:block` to images | **REQUIRED** | Without `display:block`, images render inline and create phantom spacing below them in most clients. |
| For logo images: use PNG with opaque (non-transparent) background | **REQUIRED** | Logos with dark text on a transparent background become invisible in dark mode. Use a solid or contrasted background on the PNG. |
| Use base64-encoded images | **FORBIDDEN** | Dramatically increases file size. Many clients block base64 images as a security measure. Broken in Outlook. Never embed images as base64. |
| Use inline SVG elements | **FORBIDDEN** | SVG is not supported in Outlook desktop at all. Replace with PNG or text symbols. |
| Use CSS `background-image` for visible images | **FORBIDDEN** | Outlook strips CSS background images. Use `<img>` tags for all visible images, `bgcolor` for background colour only. |

### Dark Mode

| Rule | Status | What breaks / why it matters |
|---|---|---|
| Add `<meta name="color-scheme" content="light">` to `<head>` | **REQUIRED** | Without this, Apple Mail and some other clients apply full colour inversion by default, making your design unreadable. |
| Add `<meta name="supported-color-schemes" content="light">` to `<head>` | **REQUIRED** | Required alongside `color-scheme` for Apple Mail to honour your light-mode intent. |
| Never use pure `#000000` or `#FFFFFF` for critical text or backgrounds | **CAUTION** | Apple Mail fully inverts pure black and white regardless of contrast rules. Use near-equivalents: `#000001` for black, `#FFFFFE` for white. |
| Avoid transparent PNG backgrounds if the image contains dark elements | **REQUIRED** | Dark text or icons on a transparent PNG background become invisible against dark-mode backgrounds. Export logo with an opaque background. |
| Test in actual dark mode inboxes, not browser preview | **REQUIRED** | Dark mode behaviour differs radically between Gmail app, Apple Mail, Outlook 365, and Outlook.com. Browser preview does not show dark mode rendering. |

### Accessibility (WCAG 2.1 AA)

| Rule | Status | What breaks / why it matters |
|---|---|---|
| Set `lang` attribute on `<html>` element (e.g. `lang="en"`) | **REQUIRED** | Screen readers use the `lang` attribute to select the correct language for voice output. WCAG 3.1.1 failure without it. |
| Minimum colour contrast ratio: 4.5:1 for body text | **REQUIRED** | Fails WCAG 1.4.3 (Contrast Minimum). Text becomes unreadable for users with low vision or colour blindness. Verify with WebAIM Contrast Checker. |
| Minimum colour contrast ratio: 3:1 for large text (18px+ or 14px+ bold) | **REQUIRED** | Lower threshold for large text under WCAG 1.4.3 but still must be measured. Do not rely on "looks fine". |
| Never use colour as the sole method of conveying information | **REQUIRED** | Fails WCAG 1.4.1. Users with colour blindness cannot distinguish information presented only through colour. Pair colour with text or icons. |
| Add `aria-label` to CTA links that lack descriptive visible text | **REQUIRED** | Screen readers read link text aloud. "Click here" fails WCAG 2.4.6. Write `aria-label="Set password and log in to keySkillset"`. |
| Minimum tap target size: 44 × 44px for buttons and links | **REQUIRED** | Smaller targets are difficult to tap on mobile. Fails WCAG 2.5.5. Always make CTA buttons at least 44px tall. |
| Maintain 80:20 text-to-image ratio | **REQUIRED** | Screen readers cannot interpret image content. Emails that are mostly images exclude assistive technology users and trigger spam filters. |
| Use logical heading structure (`h1`, `h2`, `h3`) | **REQUIRED** | Screen readers navigate by heading structure. Skipping levels or using headings only for size creates confusing navigation for blind users. |
| Add `aria-hidden="true"` to decorative emoji or icons | **CAUTION** | Screen readers read out emoji names aloud (e.g. "party popper"). Decorative emoji should be hidden from assistive technology. |

### AWS SES Template Syntax (Handlebars)

| Rule | Status | What breaks / why it matters |
|---|---|---|
| Use Handlebars syntax for all personalisation: `{{variable}}` | **REQUIRED** | SES templates use the Handlebars template system. Salesforce-style `{{{Field_Name}}}` syntax does not work. Use `{{first_name}}`, `{{org_name}}` etc. |
| Never put Handlebars variables inside CSS property values | **FORBIDDEN** | SES does not resolve Handlebars tags inside `<style>` blocks. The CSS will be rendered literally with the template token visible. |
| Never use Handlebars variables in image `src=""` URLs | **CAUTION** | Dynamic image URLs are unreliable. Host all images at fixed CDN or S3 URLs. Pass only text variables — never image paths — as Handlebars data. |
| Use `{{#if variable}}...{{/if}}` for optional sections | **REQUIRED** | If a variable is missing from the template data object, Handlebars renders nothing. Use conditionals for any field that may be null or absent. |
| Always provide a default or fallback for every variable | **REQUIRED** | A missing variable produces blank text or breaks layout. Use `{{variable}}` with fallback via `{{#if}}...{{else}}Default text{{/if}}`. |
| Escape user-generated content before passing to SES | **REQUIRED** | SES does not escape HTML in template variables. If your template data includes user input (e.g. names from a form), escape it server-side before passing to SES to prevent XSS. |
| Test templates with real data via SES SendTemplatedEmail | **REQUIRED** | Handlebars render failures only appear at send time. Always test with the actual JSON data object you pass at send time, not with placeholder text. |

### AWS SES Infrastructure & Deliverability

| Rule | Status | What breaks / why it matters |
|---|---|---|
| Configure SPF, DKIM, and DMARC on your sending domain before going live | **REQUIRED** | Without these, your emails fail authentication checks. Gmail and Yahoo reject unauthenticated bulk sends. SES makes DKIM setup straightforward via Easy DKIM. |
| Use a subdomain for SES sends (e.g. `mail.keyskillset.com`) | **REQUIRED** | Separates SES sender reputation from your main domain. A bad batch of emails cannot damage your primary domain's deliverability or reputation. |
| Move out of the SES sandbox before any production send | **REQUIRED** | Sandbox accounts are limited to 200 emails per 24 hours sent only to verified addresses. Request production access via AWS Support before going live. |
| Enable the account-level suppression list (BOUNCE + COMPLAINT) | **REQUIRED** | When enabled, SES automatically stops sending to addresses that have previously hard-bounced or complained. Without this, you keep hitting bad addresses and your bounce rate rises. |
| Wire SNS notifications for bounces and complaints to a handler | **REQUIRED** | SES will not call your code automatically. You must configure SNS topics for Bounce and Complaint events and subscribe a Lambda or webhook to add addresses to your suppression list. |
| Keep bounce rate below 5% and complaint rate below 0.1% | **REQUIRED** | AWS warns at 5% bounce and reviews/suspends at 10%. Complaint rate above 0.5% triggers suspension. Monitor these in CloudWatch Reputation Metrics daily. |
| Use dedicated IP addresses if send volume is high | **CAUTION** | Shared SES IPs have accumulated reputation from all SES customers. At high volume (50K+ emails/month), dedicated IPs give you full control over your own sender reputation. |
| Set up CloudWatch alarms for bounce and complaint rates | **REQUIRED** | Without alarms, you will not know your rates are rising until AWS contacts you. Set alarms at 2.5% bounce and 0.05% complaint — half the warning thresholds. |

### Mobile Compatibility

| Rule | Status | What breaks / why it matters |
|---|---|---|
| Add viewport meta tag to `<head>` | **REQUIRED** | Without viewport meta, mobile clients render the email at desktop width and scale it down — text becomes unreadably small. |
| Add `-webkit-text-size-adjust:100%` to body CSS | **REQUIRED** | iOS automatically enlarges small text. This resets it and preserves the intended layout. |
| Add `x-apple-disable-message-reformatting` meta to `<head>` | **REQUIRED** | Without this, Apple Mail on iOS reformats the email — scaling and reflowing content unexpectedly. |
| Use `@media` query block for mobile overrides | **REQUIRED** | Without responsive overrides, desktop font sizes and padding are too large or small on mobile. Note: Gmail app strips media queries — ensure desktop styles are also readable on mobile. |

---

## 5. What You Can Do on AWS SES That You Cannot on Salesforce

Because AWS SES has no 32K character wall, no tracking wrapper inflation, and no Salesforce Content Library constraint, you have significantly more creative headroom for signup, welcome, and onboarding emails. The following are explicitly permitted on AWS SES, provided the email remains under 80 KB total file size.

| What you can now do | How to do it correctly |
|---|---|
| Richer, longer content | You are not fighting a 32K wall. Include more sections — platform walkthrough, feature highlights, support contact — without needing to aggressively strip content for size. |
| More sections and layout blocks | With no tracking wrapper inflation, a 25-section email can easily stay under 80 KB. Use nested tables to build multi-section layouts freely. |
| Images hosted anywhere | Host images on S3, Cloudinary, imgix, or any public CDN. No Salesforce Content Library required. Ensure the bucket or CDN is set to public read. |
| Handlebars conditionals and loops | Use `{{#if org_name}}...{{/if}}` to show or hide entire sections per user. Use `{{#each courses}}` to loop over dynamic content. This is not possible in standard Salesforce templates. |
| Richer personalisation | Pass a full JSON object as template data — user name, org name, assigned courses, manager name, deadline date. Handlebars renders it all inline at send time. |
| Inline SVG icons (non-Outlook recipients only) | If you are certain no recipients are on Outlook desktop, inline SVG is technically supported in Gmail, Apple Mail, and web clients. However: unknown audience means Outlook must be assumed. Use PNG fallbacks. |
| A/B testing via template variants | Create multiple SES templates (e.g. `welcome_v1`, `welcome_v2`) and split-test them at the application layer by varying which template name you pass to `SendTemplatedEmail`. SES has no native A/B split — this is done in your code. |

> **On "being creative":** The Outlook and Gmail rendering constraints are not Salesforce constraints — they are email client constraints. They apply on every send path. You can be creative with content, structure, personalisation, and length on AWS SES. You cannot be creative with CSS layout techniques (flexbox, gradients, animations, `rgba()`) because those break in Outlook regardless of whether you are sending through Salesforce, AWS, or a carrier pigeon.

---

## 6. What Breaks, Where & Why — Quick Reference

| Symptom | Likely Cause | Client(s) | Fix |
|---|---|---|---|
| Layout collapses to single column | Using div/flexbox for layout | Outlook | Rebuild using nested tables only |
| Text is invisible on coloured background | `rgba()` colours used | Outlook | Replace all `rgba()` with solid hex equivalents |
| Background is flat or missing | CSS gradient used | Outlook | Use solid `bgcolor` on `<td>` instead |
| Logo shows broken image icon | URL wrong or not public | All clients | Host on public S3 or CDN, verify public read access |
| Logo is squished or stretched | Both width & height hardcoded on `<img>` | All clients | Set `width` attribute only; use `height:auto` in CSS |
| Email clipped "View entire message" | File over 102 KB | Gmail | Minify and remove unused sections. Target under 80 KB. |
| Fonts look different than expected | Custom or Google Font used | Outlook, Gmail | Use Arial, Georgia, Verdana only |
| Text appears in regular weight | `font-weight:800` or `900` used | Outlook | Cap `font-weight` to 700 |
| Gaps between table sections | mso-table resets missing | Outlook | Add `mso-table-lspace:0pt; mso-table-rspace:0pt` in `<style>` |
| Phantom space below images | No `display:block` on images | All clients | Always add `display:block` to all `<img>` tags |
| Animations not playing | `@keyframes` used | All clients | Remove animations — static design only |
| SVG not visible | Inline SVG used | Outlook | Replace with PNG or Unicode text symbols |
| Logo invisible in dark mode | Dark logo on transparent PNG | Apple Mail, Gmail iOS, Outlook | Export logo with opaque white or contrasted background |
| Handlebars token visible as literal text | Missing variable in template data JSON | SES render | Add `{{#if}}...{{else}}Fallback{{/if}}` guards for all variables |
| Template fails to send | Handlebars variable in template data missing entirely | SES API | Ensure every `{{variable}}` in the template exists in the TemplateData object |
| Bounce rate rising | Sending to invalid addresses / no suppression list | AWS SES account | Enable account-level suppression list. Wire SNS bounce handler. |
| SES account suspended | Bounce rate >10% or complaint rate >0.5% | AWS SES account | Set CloudWatch alarms at 50% of warning thresholds. Act immediately on bounce SNS events. |
| Low-contrast text fails audit | Colour contrast ratio below 4.5:1 | All clients | Check all text/background combinations with WebAIM Contrast Checker |
| Screen reader reads emoji aloud | Decorative emoji not hidden | Screen readers | Add `aria-hidden="true"` to decorative emoji spans |

---

## 7. Handlebars Template Syntax — Quick Reference

AWS SES uses the Handlebars templating system for all stored email templates (created via the `CreateEmailTemplate` API). Unlike Salesforce's flat merge field syntax, Handlebars supports conditionals, loops, and nested objects.

### Basic Variable

```html
<!-- In your HTML template -->
<p>Hi {{first_name}},</p>

<!-- In your TemplateData JSON -->
{ "first_name": "Jordan" }
```

### Conditional — Show/Hide a Section

```handlebars
{{#if org_name}}
  <p>You have been enrolled by {{org_name}}.</p>
{{else}}
  <p>You have been enrolled in a training programme.</p>
{{/if}}
```

### Nested Object

```handlebars
<!-- Template data -->
{
  "user": {
    "first_name": "Jordan",
    "email": "jordan@example.com"
  }
}

<!-- In template -->
<p>Hi {{user.first_name}}</p>
```

### Loop — Iterating a List

```handlebars
<!-- Template data -->
{
  "courses": [
    { "name": "HIPAA Basics" },
    { "name": "Workplace Safety" }
  ]
}

<!-- In template -->
{{#each courses}}
  <tr><td>{{name}}</td></tr>
{{/each}}
```

> **Security note:** SES does not escape HTML in Handlebars variables. If any variable comes from user input (e.g. a name typed during signup), escape it server-side before passing it in the TemplateData JSON. Unescaped user input inside an email template is an XSS vector if the email is ever viewed in a web context.

---

## 8. Testing Workflow — Required Before Every Send

No email template should go to production before completing both checklists below. Browser preview does not replicate email client rendering. SES API preview does not replicate dark mode. You must test in actual inboxes.

### 8.1 — Pre-Build Checks

- [ ] Confirm all layout uses `table`, `tr`, `td` — no `div`, `flexbox`, or `grid`
- [ ] Confirm all CSS is inline on every element — no class-based styles
- [ ] Replace all `rgba()` colours with solid hex equivalents
- [ ] Remove all Google Fonts `@import` — use Arial/Helvetica stack
- [ ] Cap all `font-weight` values at 700
- [ ] Remove all inline SVG — replace with PNG or Unicode text symbols
- [ ] Remove all CSS animations and `@keyframes`
- [ ] Remove all `::before` / `::after` pseudo-elements
- [ ] Remove `-webkit-background-clip: text` gradient effects — use solid colour
- [ ] Add `color-scheme` and `supported-color-schemes` meta tags to `<head>`
- [ ] Add `lang="en"` attribute to `<html>` element
- [ ] Add `aria-label` attributes to all CTA links
- [ ] Add `aria-hidden="true"` to all decorative emoji
- [ ] Verify all Handlebars variables have `{{#if}}...{{else}}` fallbacks
- [ ] Confirm every `{{variable}}` in the template exists in the TemplateData JSON object
- [ ] Check all text/background contrast ratios using WebAIM Contrast Checker (minimum 4.5:1)
- [ ] Confirm logo PNG has an opaque (non-transparent) background
- [ ] Verify all image URLs are publicly accessible (S3 public read, CDN live)
- [ ] Confirm file size is under 80 KB to avoid Gmail clipping

### 8.2 — AWS SES Infrastructure Checks

- [ ] SPF record is configured on sending domain (`mail.keyskillset.com`)
- [ ] DKIM is enabled via Easy DKIM in SES console — all three CNAME records verified
- [ ] DMARC TXT record is set on sending domain
- [ ] SES account has been moved out of sandbox (production access granted)
- [ ] Account-level suppression list is enabled (BOUNCE + COMPLAINT reasons)
- [ ] SNS topics are created for Bounce and Complaint events
- [ ] Lambda or webhook is subscribed to SNS topics and adds addresses to suppression list
- [ ] CloudWatch alarms are set for bounce rate (warn at 2.5%) and complaint rate (warn at 0.05%)
- [ ] Template is uploaded to SES via `CreateEmailTemplate` API
- [ ] Template has been tested via `SendTemplatedEmail` with actual TemplateData JSON

### 8.3 — Email Client Testing

- [ ] Send test to Gmail (web) — verify layout, colours, images, and CTA link
- [ ] Send test to Outlook desktop (2019 or 365) — verify no layout collapse, no invisible text
- [ ] Send test to iPhone Mail — verify mobile layout and readability
- [ ] Enable dark mode on each test device and re-check every client
- [ ] Verify logo is visible in dark mode (no transparent background issue)
- [ ] Verify all Handlebars variables resolved — no literal tokens visible
- [ ] Verify CTA link is correct and functional end-to-end
- [ ] Run through Mail-Tester.com for spam score and SPF/DKIM/DMARC pass check
- [ ] Use Litmus or Email on Acid for cross-client rendering preview including Outlook 2013

### 8.4 — Recommended Testing Tools

| Tool | What It Tests |
|---|---|
| AWS SES Send Test (built-in) | Renders Handlebars variables. Tests actual email delivery. Does not simulate email client rendering. |
| Mail-Tester.com (free) | Full spam score including SPF/DKIM/DMARC check, HTML quality, and content analysis. |
| Litmus (paid) | Preview in 90+ email clients — Outlook 2013/2016/2019/365, Gmail app, Apple Mail dark mode. |
| Email on Acid (paid) | Cross-client rendering, accessibility checker, dark mode preview, spam filter testing. |
| WebAIM Contrast Checker (free) | Checks text/background colour contrast against WCAG 2.1 AA (4.5:1 ratio minimum). |
| Parcel.io (free tier) | Real-time email code editor with dark mode preview. Faster than Litmus for rapid iteration. |
| AWS CloudWatch Reputation Metrics | Monitor live bounce rate and complaint rate against your SES account thresholds. |

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
- Solid hex colours only — e.g. `#0D2D6B`, never `rgba()`
- `font-weight: 700` maximum
- `mso-table-lspace:0pt` and `mso-table-rspace:0pt` in `<style>`
- Mobile `@media` query overrides
- `color-scheme` and `supported-color-schemes` meta tags
- `lang="en"` attribute on `<html>`
- `aria-label` on all CTA links
- `aria-hidden="true"` on all decorative emoji
- 4.5:1 minimum contrast ratio on all text
- Handlebars `{{#if}}...{{else}}Fallback{{/if}}` for every variable
- Server-side HTML escaping for all user-generated variable content
- Public CDN or S3 URL for all image hosting

### Never USE

- `div`, `section`, `article` for layout
- `display:flex`, `display:grid`
- `rgba()` or `hsla()` for any colour
- CSS gradients (`linear-gradient`, `radial-gradient`)
- `@keyframes` or any CSS animations
- `::before` or `::after` pseudo-elements
- `-webkit-background-clip: text`
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
- Handlebars variables inside CSS property values
- Unescaped user-generated content in Handlebars template data

---

## 10. The Golden Rules

> **Rule 1:** AWS SES removes the Salesforce size wall. It does not remove Outlook.
>
> **Rule 2:** You can be creative with content and personalisation. You cannot be creative with CSS layout.
>
> **Rule 3:** Every Handlebars variable needs a fallback. A missing variable in production is a broken email in production.
>
> **Rule 4:** Wire your bounce and complaint handlers before going live. SES will suspend your account without warning if rates spike.
>
> *When in doubt: flat colour, web-safe font, hosted image, table layout. Same as always.*

---

*keySkillset — Internal Document — April 2026 — Companion to Salesforce Email Design Rulebook*
*keySkillset — Internal Use Only — Do Not Distribute*
