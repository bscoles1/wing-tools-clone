# WingTools Clone: Architecture and Data Model

## 1. WING Snapshot (`.snap`) File Format Analysis

The Behringer WING `.snap` files are essentially **JSON** documents that encapsulate the complete state of a WING digital mixing console. Analysis of the `Multi-Renamer` project's `main.cpp` [1] confirms that these files are parsed as JSON objects. The core data resides within a root object, often under the key `ae_data`, or directly at the root if it contains specific top-level keys like `io` and `ch`.

Key sections identified within the `.snap` JSON structure include:

*   **`ae_data`**: This often serves as the primary container for the audio engine's configuration data. If present, the application typically extracts its content for further processing.
*   **`io`**: This section details the input and output patching, including physical connections (e.g., AES50, local) and their assignments to mixer channels. It contains sub-sections for `in` and `out`.
*   **`ch`**: Defines the configuration of individual mixer channels, including parameters like gain, phantom power, EQ settings, and routing to buses.
*   **`bus`**: Contains the configuration for mix buses, which are used for grouping channels and sending signals to effects or outputs.
*   **`mtx`**: Describes the matrix mixes, allowing flexible routing of bus outputs to physical outputs.
*   **`main`**: Specifies the main stereo or mono output configuration.

Routing information is typically represented through references between these sections, using group names (e.g., `AES50A`, `LCL`) and numerical indices to denote specific patch points and signal paths.

## 2. Internal Data Model Design

To effectively parse, manipulate, and visualize the WING snapshot data, an internal, normalized data model is crucial. This model will abstract away the raw JSON structure, providing a consistent and type-safe representation of the mixer's configuration.

### Core Entities:

| Entity | Description | Key Attributes |
| :----- | :---------- | :------------- |
| **Mixer** | Represents the overall WING console configuration. | `name`, `model`, `firmware`, `snapshotSchema` |
| **Input** | Physical or logical audio input. | `id`, `name`, `type` (e.g., `LCL`, `AES50A`), `channelIndex`, `gain`, `phantomPower`, `stereoMode` |
| **Output** | Physical or logical audio output. | `id`, `name`, `type`, `channelIndex`, `source` (what it's patched from) |
| **Channel** | A processing path within the mixer. | `id`, `name`, `inputSource`, `outputDestinations` (buses, matrixes), `eqSettings`, `dynamicsSettings` |
| **Bus** | A mix bus for grouping and processing signals. | `id`, `name`, `inputSources` (channels), `outputDestinations` (matrixes, physical outputs) |
| **Matrix** | A flexible routing stage for bus outputs. | `id`, `name`, `inputSources` (buses), `outputDestinations` (physical outputs) |
| **Patch Point** | A specific connection point between entities. | `sourceEntity`, `sourceIndex`, `destinationEntity`, `destinationIndex` |

### Relationships:

The data model will establish clear relationships between these entities, allowing for easy traversal of the signal flow. For example:

*   An `Input` can be routed to one or more `Channels`.
*   A `Channel` can send its signal to one or more `Buses`.
*   A `Bus` can send its signal to one or more `Matrixes` or `Outputs`.
*   A `Matrix` can send its signal to one or more `Outputs`.

## 3. Application Architecture Plan

The WingTools clone will follow a modern **full-stack web application** architecture, leveraging the provided `web-db-user` scaffold.

### Components:

1.  **Frontend (Client-side)**:
    *   **Technology**: React 19, Tailwind CSS 4, tRPC client, Wouter for routing.
    *   **Functionality**: User interface for file upload (drag-and-drop), interactive visualizations (Signal Flow Diagram), form inputs for Source Management, display of routing tables, and user authentication/subscription management.
    *   **Design**: Responsive design using `shadcn/ui` components for a consistent and polished look. Will prioritize visual diversity and intuitive user experience.

2.  **Backend (Server-side)**:
    *   **Technology**: Node.js (Express), tRPC server, Drizzle ORM for database interaction.
    *   **Functionality**: 
        *   **File Handling**: Securely receive and store `.snap` files (using S3 via `manus-upload-file`).
        *   **Parsing**: Implement the `.snap` file parser to convert raw JSON into the internal data model.
        *   **Data Processing**: Logic for Routing Diff, Snapshot Linter, and Source Management (e.g., modifying the internal model and re-serializing to `.snap`).
        *   **Document Generation**: APIs for generating PDF (using a library like `fpdf2` or a custom PDF generation service) and XLSX (using `openpyxl` or similar) documents based on the processed data.
        *   **Authentication & Authorization**: Manage user sessions, roles (Free, Basic, Premium), and access control to features.
        *   **Stripe Integration**: Handle subscription creation, webhooks, and payment processing.

3.  **Database**:
    *   **Technology**: MySQL/TiDB (via Drizzle ORM).
    *   **Schema**: Store user information (`users` table), subscription details, and metadata about uploaded `.snap` files (e.g., file path in S3, original filename, upload date, associated user).

4.  **File Storage**: 
    *   **Technology**: S3-compatible storage (via `manus-upload-file`).
    *   **Functionality**: Store uploaded `.snap` files and generated PDF/XLSX documents securely.

### Workflow:

1.  **User Uploads `.snap`**: Frontend sends the file to the backend.
2.  **Backend Processing**: The backend parses the `.snap` file, validates its structure, and stores it in S3. It then processes the data into the internal model.
3.  **Feature Interaction**: Frontend requests data for visualizations, reports, or modifications via tRPC procedures. The backend performs the necessary logic and returns the results.
4.  **Document Generation**: For PDF/XLSX exports, the backend generates the document and provides a download link (e.g., a pre-signed S3 URL).
5.  **User Management**: Authentication and subscription status are managed through the backend, gating access to premium features.

## References

[1] Aryeah86. (2026). *Multi-Renamer/windows-win32/src/main.cpp*. GitHub. [https://github.com/Aryeah86/Multi-Renamer/blob/main/windows-win32/src/main.cpp](https://github.com/Aryeah86/Multi-Renamer/blob/main/windows-win32/src/main.cpp)
