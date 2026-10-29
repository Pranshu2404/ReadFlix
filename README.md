# Readflix: website, phone app, Windows app and browser extension

Everything in this folder is the same Readflix app, packaged five ways. Everything needed to run is included, so the desktop app, Android app and extension work fully offline.

| Folder | What it is |
|---|---|
| `web/` | The website / installable web app (PWA) |
| `www/` | The app files used by the Windows/Mac/Linux and Android apps |
| `extension/` | Chrome / Edge / Brave extension |
| `main.js`, `preload.js` | The Windows/Mac/Linux app shell (Electron) |
| `capacitor.config.json` | The Android app setup (Capacitor) |
| `.github/workflows/build.yml` | Builds the .exe and .apk and publishes the website on GitHub, for free |

Each version keeps its own shelf on its own device. Books you add in the Windows app do not appear in the Android app.

---

## Fastest route: let GitHub build everything (no installs on your PC)

1. Create a new repository on github.com (for example `readflix`). Make it **Public** if you want the free website on GitHub Pages; private works for the apps.
2. Upload the *contents* of this folder: on the repository page click **Add file > Upload files**, then drag everything in, including the `.github` folder. If the browser skips the hidden `.github` folder, use GitHub Desktop or run:
   ```
   git init && git add . && git commit -m "Readflix" && git branch -M main
   git remote add origin https://github.com/YOUR-NAME/readflix.git && git push -u origin main
   ```
3. For the website, go to **Settings > Pages > Source** and choose **GitHub Actions**. Do this once.
4. Open the **Actions** tab. The "Build Readflix" run starts by itself and takes about 5 to 10 minutes. When it turns green, open it and download from **Artifacts**:
   - **Readflix-Windows**: `Readflix-1.0.0-nsis.exe` (installer) and `Readflix-1.0.0-portable.exe` (runs without installing)
   - **Readflix-Android**: `Readflix.apk`
   - The website address is shown on the **website** job: `https://YOUR-NAME.github.io/readflix/`
5. Each time you push a change, all three are rebuilt. You can also start a build by hand: **Actions > Build Readflix > Run workflow**.

---

## 1. Website and web app (phones and computers)

You can host the `web/` folder in either of two ways:
- **Netlify Drop (2 minutes):** open https://app.netlify.com/drop and drag the `web` folder onto it. You get a `something.netlify.app` link. Sign up (free) to claim the site and give it a better name.
- **GitHub Pages:** the workflow above does this for you.

To install it from the link:
- **Android:** open it in Chrome, then use the menu and **Install app**.
- **iPhone/iPad:** open it in Safari, then tap **Share > Add to Home Screen**.
- **Windows/Mac:** open it in Chrome or Edge and click the install icon in the address bar.

## 2. Windows app (also macOS and Linux)

- **From GitHub:** download the .exe from Artifacts (see above).
- **On your own PC:** install Node.js 22 or newer, then run these in this folder:
  ```
  npm install
  npm run desktop          # try it
  npm run build:windows    # makes release/Readflix-1.0.0-nsis.exe and the portable .exe
  ```
  For macOS run `npm run build:mac` on a Mac. For Linux run `npm run build:linux`.

The installer is not code-signed, so Windows SmartScreen will say "Windows protected your PC". Click **More info**, then **Run anyway**. Removing this warning for everyone needs a code-signing certificate, or publishing through the Microsoft Store (below).

The installer lets you open EPUB, CBZ and FB2 files from Explorer with Readflix. Right-click a file and choose **Open with > Readflix**.

## 3. Android app

- **From GitHub:** download `Readflix.apk` from Artifacts. Send it to your phone, open it, and allow **Install unknown apps** when Android asks.
- **On your own PC** (needs Android Studio):
  ```
  npm install
  npm run android:init     # creates the android/ project with the Readflix icon
  npm run android:open     # opens Android Studio: Build > Build APK(s)
  ```

This APK is a *debug* build, which is fine for your own phones. For the Play Store you need a *signed release bundle*: in Android Studio choose **Build > Generate Signed App Bundle**, and keep the keystore file safe forever.

## 4. Browser extension (Chrome, Edge, Brave, Opera)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and pick the `extension` folder.
4. Pin Readflix. The toolbar button (or Alt+Shift+R) opens it in a tab.

## 5. Putting it in the stores

| Store | Cost | What to upload |
|---|---|---|
| Google Play | $25 one time. New personal accounts must run a closed test with at least 12 testers for 14 days before going public | Signed `.aab` from Android Studio. Alternative: give your website link to https://www.pwabuilder.com and download its Android package |
| Microsoft Store | Free for individual developers (ID and selfie check) | Give your website link to https://www.pwabuilder.com and download the Windows package, or submit the installer |
| Chrome Web Store | $5 one time | Zip the *contents* of `extension/` |
| Microsoft Edge Add-ons | Free | Same zip |
| Apple App Store | $99 per year and a Mac | Out of scope here. iPhone users can use the website with Add to Home Screen |

Before you publish, check that the name "Readflix" is free to use where you will sell it. It is close to "Netflix", so a trademark check is worth doing.

## Updating later

Rebuild Readflix, then replace `www/`, `web/` and `extension/` with the new versions and push to GitHub. Raise `"version"` in `package.json` (and in `extension/manifest.json` for the stores) each time you publish.
