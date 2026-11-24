# Nocturne — Gothic Music Lounge

A browser-based music player built with React, TypeScript, Vite, and Tailwind CSS.

## Deploy to GitHub Pages

This source package is configured for the GitHub repository `ksdarshann/Music` and the URL `https://ksdarshann.github.io/Music/`.

1. Put the **contents of this folder** at the repository root (not inside an extra `nocturne_work` or `Music` folder).
2. Preserve the folder structure, especially `src/` and `.github/workflows/`.
3. Ensure the default branch is `main`.
4. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the source.
5. Push a commit to `main`. The workflow builds the project and deploys the generated `dist/` folder.
6. Check **Actions**. Both the Build and Deploy jobs must finish successfully.

Do not upload this ZIP file itself to GitHub. Extract it first. For the most reliable folder-preserving upload, use GitHub Desktop and replace the contents of your cloned `Music` repository with the extracted project contents.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

## Music storage

Imported audio, playlists, queue, history, and preferences are stored in the browser using IndexedDB. They do not sync between browsers or devices.
