# musixyz 95

A Windows 95-inspired, phone-first local music player built with HTML, CSS and JavaScript.

## Features
- Import audio files from your phone
- Store imported audio in IndexedDB so it persists between launches
- Play/pause, seek, previous/next, shuffle and repeat
- Search and sort the library
- Favorite and remove tracks
- Retro Windows 95 desktop, taskbar, Start menu, title bars and beveled controls

## Build the Android APK from your phone using GitHub Actions

You do not need Android Studio, an Android SDK, Node.js or Termux on your phone. GitHub's cloud runner does the build.

1. Create a GitHub account or sign in at https://github.com.
2. Create a new repository named `musixyz` (a public repository is simplest for a first build).
3. Upload the contents of this project ZIP to the repository. Make sure `index.html`, `styles.css`, `app.js`, `package.json`, `capacitor.config.json`, and the `.github` folder are at the repository root.
4. Open the repository's **Actions** tab. If GitHub asks to enable Actions, enable them.
5. The workflow runs on the `main` branch after upload. You can also open **Build musixyz APK** and tap **Run workflow**.
6. When the run finishes successfully, open that run, scroll to **Artifacts**, and download `musixyz-debug-apk`.
7. Extract the artifact ZIP on your phone. Tap `app-debug.apk` to install. Android may ask you to allow installs from your browser or file manager.

The APK is a debug build for personal testing, not a Play Store release.

## Local browser testing
Serve this folder from a local web server and open it in a modern browser. IndexedDB requires a supported browser origin; opening the HTML as a `file://` URL may not work consistently.

## Storage and privacy
- Audio files are copied into the app's local IndexedDB database.
- Removing the original download does not remove the imported copy.
- Uninstalling the app or clearing its app data deletes the library.
- No cloud music sync is included.
- The app plays local audio files; it does not download from streaming services.
- Keep enough free phone storage for the APK installation and the music you import.

## Updating the app
After editing the source files and uploading the changes to GitHub, the workflow will rebuild the APK. Install the new APK over the old one to update it; do not uninstall first, or Android may delete the app's local music library.
