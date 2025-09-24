# Assistant


**A private, offline-first, and highly configurable AI chat application designed to run on your local machine.**

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/writing-editor/local_llm_chat/deploy.yml?branch=main&style=for-the-badge)](https://github.com/writing-editor/local_llm_chat/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## ✨ Key Features

-   **🧠 Connect to Local LLMs**: Powered by your own [Ollama](https://ollama.com/) instance. Use any model you want, from Llama 3 to Phi-3.
-   **🔒 Completely Private**: No data ever leaves your machine. Your conversations and settings are stored locally in your browser.
-   **⚡ Offline-First (PWA)**: After the first visit, the app loads instantly, with or without an internet connection.
-   **🎭 Dynamic Persona**: Easily change the AI's role, tone, and objective by editing the System Prompt in the settings.
-   **💬 Streaming Responses**: The AI's response is streamed in real-time, word by word.
-   **📜 Chat History**: Conversations are automatically saved and restored on your next visit.
-   **📋 Markdown Support**: Renders bold text, lists, and other markdown formatting from the AI.
-   **🚀 Automated Deployment**: Pre-configured with GitHub Actions to deploy directly to GitHub Pages.
-   **🎨 Clean & Modern UI**: A beautiful, responsive, and easy-to-use light theme built with React and Tailwind CSS.

## 🚀 Live Demo

You can view a live version of this application here:

**[https://writing-editor.github.io/local_llm_chat/](https://writing-editor.github.io/local_llm_chat/)**

*(Note: The live demo will still require you to connect to your own running Ollama instance at `http://localhost:11434` or your custom URL.)*


## 🔧 Tech Stack

-   **Framework**: React 19
-   **Build Tool**: Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Offline Caching**: Progressive Web App (PWA) via Service Workers
-   **Deployment**: GitHub Actions

## ⚙️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

1.  **Node.js**: Ensure you have Node.js (v18 or newer) installed.
2.  **Ollama**: You must have [Ollama installed and running](https://ollama.com/) on your machine.
3.  **An Ollama Model**: You need to have at least one model pulled. You can do this with the following command:
    ```bash
    # for example
    ollama pull phi3:3.8b
    ```

### Installation & Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/writing-editor/local_llm_chat.git
    cd local_llm_chat
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application should now be running at `http://localhost:3000`. Open the app, click the settings icon, and verify that the Ollama URL is correct and the model name matches the one you have pulled.

## 🚢 Deployment

This repository is configured for automated deployment to **GitHub Pages** using GitHub Actions.

To set it up for your own fork:

1.  **Update `vite.config.ts`**: Change the `base` property to match your repository's name.
    ```typescript
    // vite.config.ts
    export default defineConfig({
      base: '/local_llm_chat/', // <-- Change this!
      // ...
    });
    ```
2.  **Enable GitHub Pages**: In your repository's settings (`Settings` > `Pages`), set the "Build and deployment" source to **"GitHub Actions"**.

Now, every push to the `main` branch will automatically trigger the build and deployment workflow.

##  roadmap Possible Future Enhancements

-   **🎨 Theme Switcher**: Allow users to toggle between light and dark modes.
-   **📂 Multiple Conversations**: Implement a sidebar to manage and switch between different chat threads.
-   **📥 Export Chat**: Add functionality to export conversations as Markdown or PDF files.
-   **🤖 Model Selector**: Add a dropdown in the UI to quickly switch between available Ollama models.

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is distributed under the MIT License. See `LICENSE` for more information.