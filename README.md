# Modern Entomology Collection 🐞

A sophisticated web application designed to replace traditional physical insect collection assignments. This tool allows students to digitally collect, process, pin, and label insect specimens in a scientifically accurate virtual environment.

![App Screenshot](https://images.unsplash.com/photo-1535083783855-76462b20eecf?q=80&w=1000&auto=format&fit=crop)

## 🎓 Overview

This application provides a digital alternative to the "10-insect collection" assignment. It eliminates the ethical concerns and logistical challenges of physical collection while maintaining the pedagogical value of taxonomy, identification, and curation.

### Key Features
*   **Virtual Pinning Studio:** Upload photos and place a virtual pin specifically on the thorax/notum.
*   **Image Processing:** Built-in tools to crop, rotate, and remove backgrounds (Magic Wand & Brush) for professional-looking specimens.
*   **Taxonomic Data Entry:** Fields for Order, Family, Genus, Species, and evolutionary history.
*   **Multi-Drawer Management:** Organize specimens into multiple drawers with custom names.
*   **Local Persistence:** Data is stored automatically in the browser, with JSON export options for backup and submission.
*   **Instructor Mode:** A dedicated admin interface for grading student submissions.

---

## 📘 Student User Guide

### 1. Getting Started
1.  Open the application in your browser.
2.  **Register:** Enter your Name and Student ID. Create a password.
    *   *Note: Your account exists only on your specific device/browser.*
3.  Click **"Create Account"**.

### 2. Creating Your Collection
1.  **Add Drawer:** Click "Add New Specimen Drawer" to expand your collection space.
2.  **Add Specimen:** Click on an empty slot (indicated by a `+` sign).
3.  **Upload Image:** Select a clear photo of your insect specimen.
4.  **Edit Image:** Use the "Open Studio" tool to:
    *   **Frame:** Rotate and crop the image.
    *   **Clean Up:** Use the "Auto Remove" (Magic Wand) or "Highlight Remove" (Brush) to remove the background.
5.  **Pinning:** Click on the thorax of the insect to place the virtual pin.
6.  **Taxonomy:** Fill in the classification details (Phylum, Class, Order, etc.) and collection data (Date, Location).
7.  **Save:** Click "Save Specimen" to add it to the drawer.

### 3. Submitting Your Assignment
**Crucial Step:** Since this app does not use a cloud database, you must export your file to submit it.
1.  Ensure all your specimens are saved.
2.  Click the **"Save Progress"** (Download) button in the top right header.
3.  This will download a `.json` file named like `123456_John_Doe_Collection.json`.
4.  Submit this file to your learning management system (Canvas, Blackboard, etc.).

---

## 🛡️ Instructor Grading Guide

### Accessing Admin Mode
1.  On the Login Screen, enter the Staff Credentials:
    *   **ID:** `STAFF_ADMIN`
    *   **Password:** `admin2024`
2.  The interface will change to **Instructor Grading Mode** (Dark header with Amber accents).

### Grading a Submission
1.  Click the **"Load Student File (.json)"** button in the header.
2.  Select the JSON file submitted by the student.
3.  The app will load their entire collection in **Read Only** mode.
4.  You can:
    *   Open drawers to view organization.
    *   Click on individual specimens to inspect taxonomy and pinning accuracy.
    *   View "Evolutionary History" notes.

---

## 💻 Technical Documentation

### Stack
*   **Frontend:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React
*   **Deployment:** GitHub Pages (Static Hosting)

### Project Structure
```
/
├── components/         # React Components
│   ├── Editor.tsx      # Main modal for editing specimens
│   ├── ImageEditor.tsx # Canvas-based image processing tool
│   └── PinningCanvas.tsx # Component handling the coordinate pinning
├── services/           # Helper functions
├── types.ts            # TypeScript interfaces (Insect, Drawer, User)
├── App.tsx             # Main application logic & state management
└── index.html          # Entry point
```

### Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/entobox.git
    cd entobox
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

### Deployment (GitHub Pages)

This project is configured to deploy automatically via GitHub Actions.

1.  Ensure your `vite.config.ts` has `base: './'`.
2.  Push changes to the `main` branch.
3.  The `.github/workflows/deploy.yml` action will build the project and deploy it to the `gh-pages` branch.
4.  Go to **Settings > Pages** in your repository to see the live URL.

### Data Privacy Note
This application runs entirely client-side. No student data or images are uploaded to any external server. All data persists in the user's browser `localStorage` until they clear their cache. The Export/Import JSON feature is the only mechanism for data portability.
