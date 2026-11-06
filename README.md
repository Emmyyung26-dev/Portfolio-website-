# NuelWebSolution – Portfolio Website

Plain HTML + CSS + JavaScript, with Three.js (3D) and GSAP (animation) loaded from a CDN.

```
index.html     page structure and all text
style.css      all styling
config.js      YOUR details: WhatsApp, email, socials, form  <- edit first
scene.js       3D crystal + particles (+ shader background if no video)
script.js      animations, menu, tilt, buttons, form logic
assets/        video/, img/, projects/, favicon, about photo
```

## 1. Run it
Double-click `index.html`, or for a more accurate test run a tiny server in this folder:
`python3 -m http.server 8000` then open http://localhost:8000
(An internet connection is needed for Three.js, GSAP and the fonts.)

## 2. Replace the background video
Files live in `assets/video/`:
- `hero-loop.mp4` – desktop (1280x720)
- `hero-loop-mobile.mp4` – phones (720x1280)
- `assets/img/hero-poster.jpg` – still image shown while loading / if autoplay is blocked

Keep the same file names, or edit the `<video>` block near the top of `index.html`.
Tips: 8–15 s seamless loop, H.264 MP4, under ~1.5 MB, no audio. If a file is missing or cannot play,
the site automatically switches to the live 3D shader background, then to a CSS fallback.
The video is scaled/shifted in `style.css` (`.bg__video`) so its centre sits behind the 3D crystal.

## 3. Change text and images
- Text: open `index.html` and edit it directly. Each section is marked with a comment.
- Your photo: replace `assets/about-placeholder.svg` with a photo (e.g. `assets/me.jpg`) and update
  the `src` in the `.stack__pane--1` figure in the About section.
- Colours: the `:root` block at the top of `style.css`.

## 4. Add your real projects
In the Projects section of `index.html`, each project is one `<article class="project">` block.
1. Put a screenshot (about 1200x750) in `assets/projects/`, e.g. `my-shop.jpg`.
2. Change the `<img src>` and `alt`.
3. Edit the category, name and description.
4. Set the button: `<a class="link-arrow" href="https://your-live-site.com" target="_blank" rel="noopener">`
   and delete the `data-project-link` attribute.
5. Delete the `<span class="project__tag">Sample</span>` line.
Copy a whole block to add more projects, delete one to remove it.

## 5. Connect WhatsApp, email, socials, form
Open `config.js`:
- `whatsappNumber`: digits only with country code, e.g. `"2348012345678"`.
- `email`: your business email.
- `socials`: full profile URLs (empty ones show a reminder instead of a dead link).
- `formEndpoint`: paste a free Formspree (or similar) URL to receive messages directly.
  Leave empty to open the visitor's email app instead.
- `stats`: leave `[]` unless you have genuine numbers.

## 6. Publish online (all free options)
- **Netlify Drop**: go to app.netlify.com/drop and drag this whole folder in. Live in seconds.
- **Cloudflare Pages / GitHub Pages / Vercel**: upload the folder as a static site (no build step).
- Then connect your own domain in the host's settings.
After publishing, add `<link rel="canonical" href="https://yourdomain.com/">` and an `og:image`
(a 1200x630 image) to `<head>` for nicer link previews.

## Accessibility and performance built in
Reduced-motion support (animations off, video paused), skip link, keyboard-friendly menu, semantic
headings, lazy-loaded images, a lighter mobile video, capped 3D pixel ratio, and fewer particles on phones.
