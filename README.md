# Clarity Hub - Legal Case Tracking System

## Overview

Clarity Hub is a comprehensive legal case tracking application designed for legal professionals to manage case evidence, documents, and collaborative workflows. The platform integrates document management, rich-text editing, AI assistance, and collaborative features specifically tailored for legal professionals.

## Features

- **Authentication System**
  - User registration, login, and password reset
  - Invitation-based client/collaborator access

- **Project Management**
  - Create and manage legal cases
  - Organize case evidence and documents
  - Collaborative workspaces with role-based permissions

- **Document Management**
  - Upload and organize case files (PDFs, images, media)
  - Automatic exhibit ID generation
  - AI-powered filename suggestions

- **Rich Text Editing**
  - TinyMCE integration for professional document editing
  - Exhibit citation system for referencing evidence
  - Real-time collaborative editing

- **AI Assistance**
  - Document analysis and summarization
  - Context-aware writing suggestions
  - Project-wide question answering based on case documents

- **Advanced Search**
  - Full-text search across all case documents
  - Entity recognition for identifying key information
  - Document chunk analysis for precise reference

- **Interactive Document Viewing**
  - Integrated PDF, image, and media viewers
  - Annotation capabilities
  - Side-by-side document and editor view

## Technology Stack

- **Frontend**
  - React 18+ with TypeScript
  - Vite for build tooling
  - Material UI for component library
  - Zustand for state management
  - TinyMCE for rich text editing

- **Backend**
  - Supabase for database, authentication, and storage
  - Edge Functions for serverless processing
  - Google AI (Gemini/Vertex AI) integration

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account and CLI
- Google AI API access (optional for AI features)

### Environment Setup

1. Clone the repository
   ```
   git clone [repository-url]
   cd clarity-hub-app
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure environment variables
   - Copy `.env.example` to `.env.local` and update with your credentials
   ```
   cp .env .env.local
   ```
   - Required variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `GOOGLE_AI_API_KEY`: For AI functionality (if using)

4. Start development server
   ```
   npm run dev
   ```

### Supabase Setup

1. Run migrations to set up database tables
   ```
   supabase migrations up
   ```

2. Deploy edge functions
   ```
   supabase functions deploy
   ```

## Project Structure

- **src/**
  - **assets/**: Static assets and resources
  - **components/**: React components
    - **ai/**: AI-powered components
    - **dialogs/**: Modal dialogs and popups
    - **Editor/**: TinyMCE editor customizations
    - **icons/**: Custom icon components
    - **search/**: Search functionality components
    - **viewers/**: Document viewing components
  - **contexts/**: React context providers
  - **hooks/**: Custom React hooks
  - **layouts/**: Page layout components
  - **pages/**: Main application pages
  - **services/**: API and service integrations
  - **store/**: Zustand store configurations
  - **theme/**: Material UI theme customization
  - **types/**: TypeScript type definitions
  - **utils/**: Utility functions

- **supabase/**
  - **functions/**: Edge Functions
  - **migrations/**: Database migrations

## Backend Components

### Database Tables

- **projects**: Legal cases and their metadata
- **files**: Uploaded documents and files
- **notes**: User notes and annotations
- **links**: Relationships between documents
- **entities**: Extracted entities from documents
- **document_chunks**: Processed document segments for AI and search
- **project_collaborators**: User access and permissions

### Edge Functions

- **get-next-exhibit-id**: Automatically generates sequential exhibit IDs
- **suggest-filename**: AI-powered filename suggestions
- **project-qa**: Document-based question answering
- **analyze-file**: Document content analysis
- **analyze-writing-context**: Context-aware writing assistance
- **generate-embeddings**: Vector embeddings for search functionality

## Frontend Components

### Layout Structure

The application uses a three-panel layout:

1. **Left Panel**: Project selection, file management, search capabilities
2. **Center Panel**: TinyMCE editor with citation features and AI suggestions
3. **Right Panel**: Document viewers and AI assistance features

### Key Components

- **Editor Integration**: Custom TinyMCE setup with legal-specific features
- **Document Viewers**: Specialized viewers for different file types
- **Citation System**: Interactive document citation functionality
- **AI Assistants**: Context-aware helpers for document analysis

## License

[License Information]

## Contact

[Contact Information]

## Testing

This project includes end-to-end tests using Playwright. The tests cover key functionality including:

- Project selection and note creation/editing
- File upload and preview
- Panel resizing and folding/unfolding
- Responsive behavior testing
- Console error checking

### Running tests

Make sure the development server is running:

```bash
npm run dev
```

Then in a separate terminal, run the tests:

```bash
# Run all tests headlessly
npm test

# Run tests with Playwright UI
npm run test:ui
```

### Test structure

- Tests are located in the `tests` directory
- Test fixtures (sample files) are in `tests/fixtures`
- The Playwright configuration is in `playwright.config.ts`

The test suite automatically verifies all key flows across Chromium, Firefox, and WebKit, with responsive widths and console-error checks.

## Gemini 2.5 Pro Integration

This application uses Google's Gemini 2.5 Pro model for AI-powered features via Supabase Edge Functions. The integration enables:

1. **Document Analysis** - Extract key information from legal documents
2. **Writing Context Analysis** - Analyze legal text for key entities, dates, and concepts
3. **Project Q&A** - Ask questions about your case with RAG-powered retrieval from your documents
4. **Smart Filename Suggestions** - Get AI-powered naming suggestions for your evidence files

### Setup Instructions

To deploy the Gemini 2.5 Pro integration:

1. Ensure your Google Cloud account has Vertex AI API enabled
2. Create service account credentials in GCP with Vertex AI permissions
3. Add the following secrets to your Supabase project:

```bash
# Required for Gemini integration
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"YOUR_PROJECT_ID",...}
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_EMBEDDING_MODEL=textembedding-004
GOOGLE_GEMINI_MODEL=gemini-2.5-pro-preview-03-25
```

4. Deploy the edge functions to your Supabase project:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Deploy the functions
supabase functions deploy analyze-writing-context --project-ref your-project-ref
supabase functions deploy analyze-file --project-ref your-project-ref
supabase functions deploy project-qa --project-ref your-project-ref
```

5. Update your frontend code to use the AI service:

```typescript
import aiService from './services/aiService';

// Example: Analyze a document
const analysis = await aiService.analyzeFile(fileId);

// Example: Ask a question about your case
const answer = await aiService.askProjectQuestion(projectId, "What evidence supports our claim?");
```

### Troubleshooting

If you encounter issues with the Gemini integration:

1. Check Supabase Edge Function logs in the Supabase dashboard
2. Verify your Google Cloud credentials have the correct permissions
3. Ensure your Gemini model name is correct and available in your region
4. Check for CORS issues when calling Edge Functions from the frontend
