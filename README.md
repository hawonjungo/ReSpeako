# ReSpeako
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/hawonjungo/ReSpeako)

ReSpeako is a versatile language tool application built with React and Capacitor. It empowers users with speech-to-text, text-to-speech, and an IPA (International Phonetic Alphabet) lookup feature, aiming to assist with language learning and pronunciation. The application is designed to be cross-platform, with the current configuration targeting Android.

<p align="center">
  <img src="https://github.com/user-attachments/assets/948c7a7c-60ec-4cdf-8a5c-4457aa8ed962" alt="image" />


</p>


## Features

*   **🎤 Speech-to-Text**: Accurately transcribes spoken audio into text using `@capacitor-community/speech-recognition` for native platforms and Web Speech API for browsers.
*   **🔊 Text-to-Speech**: Converts written text into audible speech using `@capacitor-community/text-to-speech` for native platforms and Web SpeechSynthesis API for browsers.
*   **🧾 IPA Checker**: Provides the International Phonetic Alphabet (IPA) transcription and definition for English words by fetching data from `https://api.dictionaryapi.dev`.
*   **🎨 Theme Toggle**: Offers a seamless switch between light and dark modes for user comfort, with theme preference saved in local storage.
*   **📱 Mobile-First Design**: Built with Capacitor for native mobile app capabilities on Android. Includes dynamic padding adjustments for on-screen keyboard visibility using `@capacitor/keyboard`.
*   **✨ Dynamic UI**: Features an animated rotating text component (`RotatingText.jsx`) using Framer Motion for a lively user interface.

## Tech Stack

*   **Frontend**: React, Vite
*   **Styling**: Tailwind CSS (`@tailwindcss/vite`)
*   **Mobile Development**: Capacitor (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`)
    *   Speech Recognition: `@capacitor-community/speech-recognition`
    *   Text-to-Speech: `@capacitor-community/text-to-speech`
    *   Keyboard Management: `@capacitor/keyboard`
*   **Animation**: Framer Motion
*   **Linting**: ESLint (`@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)
*   **API**: `dictionaryapi.dev` (for IPA and definitions)

## Project Structure

The repository is organized as follows:

```
hawonjungo-respeako/
├── android/            # Android native project managed by Capacitor
├── public/             # Static assets (e.g., favicon, fonts)
├── src/                # React application source code
│   ├── assets/         # Image assets (if any beyond public)
│   ├── components/     # React components (ReSpeako.jsx, RotatingText.jsx, ThemeToggle.jsx, ThemeContext.jsx)
│   ├── App.jsx         # Main application component
│   ├── main.jsx        # Application entry point (React DOM rendering)
│   ├── App.css         # Global styles for App component
│   └── index.css       # Global styles and Tailwind imports
├── capacitor.config.json # Capacitor project configuration (appId, appName, webDir)
├── package.json        # Project dependencies and NPM scripts
├── tailwind.config.js  # Tailwind CSS configuration (custom fonts, themes)
├── vite.config.js      # Vite build tool configuration
└── eslint.config.js    # ESLint configuration
```

## Getting Started

**Prerequisites**
*   Node.js (v16+ recommended) and npm
*   Android Studio (for Android development)
*   Capacitor CLI (can be installed locally or globally): `npm install @capacitor/cli`

**Installation & Setup**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/hawonjungo/ReSpeako.git
    cd ReSpeako
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Application

**1. Web Development Server:**
   To run the application in a web browser for development with hot-reloading:
   ```bash
   npm run dev
   ```
   This will start the Vite development server, typically accessible at `http://localhost:5173`.

**2. Android:**

   a. **Build the web app:**
      This command compiles the React application into static assets in the `dist` directory.
      ```bash
      npm run build
      ```

   b. **Add the Android platform (if not already added):**
      This command sets up the native Android project.
      ```bash
      npx cap add android
      ```

   c. **Sync web assets with the native Android project:**
      This command copies the built web assets from `dist` to the Android project and updates native configurations.
      ```bash
      npx cap sync android
      ```

   d. **Open the Android project in Android Studio:**
      ```bash
      npx cap open android
      ```

   e. **Run the app from Android Studio:**
      Once the project is open in Android Studio, select a connected device or an emulator and click the "Run" button. Ensure you have the necessary Android SDKs and build tools installed.

## Available Scripts

In the project directory, you can run:

*   `npm run dev`: Starts the Vite development server.
*   `npm run build`: Builds the app for production to the `dist` folder.
*   `npm run lint`: Lints the project files using ESLint.
*   `npm run preview`: Serves the production build locally for preview.

## Configuration Files

*   `capacitor.config.json`: Central configuration for Capacitor, including `appId` ("relifes.net"), `appName` ("ReSpeako"), and `webDir` ("dist").
*   `tailwind.config.js`: Defines Tailwind CSS customizations, such as custom font families (`noto`, `mono`, `ipa`).
*   `vite.config.js`: Configures Vite, including plugins like `@vitejs/plugin-react` and `@tailwindcss/vite`.
*   `eslint.config.js`: Sets up ESLint rules for JavaScript and JSX files, including React hooks and refresh plugins.
*   `android/app/src/main/AndroidManifest.xml`: Android-specific configurations, including necessary permissions like `android.permission.RECORD_AUDIO` and `android.permission.INTERNET`.

## Notes

*   The application requires microphone permission for speech-to-text functionality and internet permission for fetching IPA data. These are declared in `AndroidManifest.xml` for Android.
*   The `RotatingText.jsx` component provides an engaging text animation effect in the app title.
*   Theme preferences (dark/light mode) are persisted using `localStorage`.
