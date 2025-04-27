# Clarity Suite Supabase Edge Functions

This directory contains Supabase Edge Functions used for the Clarity Suite application's AI features. The functions have been updated to use Google Cloud's Vertex AI (Gemini) API instead of OpenAI.

## Environment Variables

The following environment variables need to be configured in the Supabase project settings:

```
GOOGLE_APPLICATION_CREDENTIALS_JSON=<service-account-json>
GOOGLE_CLOUD_PROJECT_ID=<your-project-id>
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_EMBEDDING_MODEL=textembedding-004
GOOGLE_GEMINI_MODEL=gemini-2.5-pro
```

## Service Account Setup

1. Create a Google Cloud project
2. Enable Vertex AI API
3. Create a service account with the "Vertex AI User" role
4. Create a JSON key for the service account
5. Set the JSON key content as the `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable (escape the JSON properly)

## Functions Overview

### Shared Modules

- `_shared/google_auth.ts` - Handles Google Cloud authentication and API calls to Vertex AI
- `_shared/cors.ts` - Handles CORS headers and provides response helper functions

### AI Functions

- `analyze-file` - Extracts and analyzes text from uploaded files (PDF, image, text, DOCX)
- `generate-embeddings` - Creates vector embeddings for text using Google's embedding model
- `project-qa` - Answers questions about a project using retrieval-augmented generation (RAG)
- `project-search` - Performs semantic search over documents using vector embeddings
- `regenerate-embeddings` - Helper function to update embeddings for existing files

## Database Changes

The database uses pgvector with 768-dimensional vectors for Google's textembedding-004 model. This is stored in the document_chunks table with appropriate indexes for vector similarity search.

## Local Development

To run the functions locally, you'll need to set up the environment variables in a `.env.local` file. Make sure to install the Supabase CLI and run:

```
supabase functions serve
```

## Deployment

Deploy the functions to Supabase with:

```
supabase functions deploy
```

Make sure to set the environment variables in the Supabase dashboard before deployment. 