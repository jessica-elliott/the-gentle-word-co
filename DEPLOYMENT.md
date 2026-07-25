# The Gentle Word Co. — Deployment Guide

This project has been cleaned, the five approved mockups have been added and optimized as WebP files, and `npm run build` has been verified successfully.

## GitHub

1. Create a new GitHub repository named `the-gentle-word-co`.
2. Upload the contents of this project folder to the repository root.
3. Commit the files to the `main` branch.

Do not upload the outer ZIP file itself. Upload the files and folders inside it.

## Cloudflare Pages

1. In Cloudflare, open **Workers & Pages** and create a Pages project.
2. Choose **Connect to Git** and select the GitHub repository.
3. Use these build settings:
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `_site`
4. Deploy and review the generated `*.pages.dev` address.
5. Connect `thegentlewordco.com` only after approving the preview.

## Local build (optional)

```bash
npm install
npm run build
npm run preview
```

The local preview will be available at `http://localhost:8080`.

## Verified routes

- `/`
- `/gentle-reset-starter-kit/`
- `/blog/`
- `/blog/archive/`
- `/404.html`

## Notes

- Starter Kit Gumroad URL: `https://thegentlewordco.gumroad.com/l/gepooj`
- 7-Day Reset Gumroad URL: `https://thegentlewordco.gumroad.com/l/lgkqk`
- The scheduled GitHub Action runs Monday through Saturday and has permission to create an empty commit when a future-dated post becomes eligible.
