# Skill: install-ai-cs

> Auto-install AI Customer Service chat widget into any web project

## Usage

```
/install-ai-cs <API_KEY>
```

## What it does

1. Detects the project's framework (Next.js, Nuxt, React, Vue, HTML, etc.)
2. Finds the correct layout/template file
3. Inserts the widget script tag in the right location
4. Verifies the installation

## Implementation

### Step 1: Detect Framework

Check for these files to identify the framework:

| File | Framework |
|------|-----------|
| `next.config.*` or `src/app/layout.tsx` | Next.js (App Router) |
| `pages/_app.tsx` or `pages/_document.tsx` | Next.js (Pages Router) |
| `nuxt.config.*` | Nuxt.js |
| `vite.config.*` + `index.html` | Vite (React/Vue) |
| `angular.json` | Angular |
| `index.html` (root) | Static HTML |

### Step 2: Insert Widget Code

Based on the detected framework:

#### Next.js (App Router)
- File: `src/app/layout.tsx` or `app/layout.tsx`
- Add `import Script from 'next/script'` at the top
- Insert before `</body>`:
```tsx
<Script
  src="https://ai-customer-service-neon.vercel.app/widget.js"
  data-api-key="API_KEY"
  strategy="afterInteractive"
/>
```

#### Next.js (Pages Router)
- File: `pages/_document.tsx` or `pages/_app.tsx`
- Same as above with `next/script`

#### Nuxt.js
- File: `nuxt.config.ts`
- Add to `app.head.script`:
```ts
script: [
  {
    src: 'https://ai-customer-service-neon.vercel.app/widget.js',
    'data-api-key': 'API_KEY',
    defer: true
  }
]
```

#### Vite / Static HTML
- File: `index.html`
- Insert before `</body>`:
```html
<script src="https://ai-customer-service-neon.vercel.app/widget.js" data-api-key="API_KEY"></script>
```

#### Angular
- File: `src/index.html`
- Insert before `</body>`:
```html
<script src="https://ai-customer-service-neon.vercel.app/widget.js" data-api-key="API_KEY"></script>
```

### Step 3: Verify

After insertion, confirm:
1. The file was saved successfully
2. The script tag is present in the file
3. Remind the user to deploy/restart their dev server

### Output Format

```
✅ AI Customer Service widget installed!

Framework: Next.js (App Router)
File modified: src/app/layout.tsx
API Key: abc123...

Next steps:
1. Run your dev server to test locally
2. Deploy to see it live
3. Visit your dashboard to manage conversations:
   https://ai-customer-service-neon.vercel.app/dashboard
```
