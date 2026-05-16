# Vector Database Retrieval with Gemini and Supabase

This project demonstrates how to build a simple but powerful vector database using Node.js, Google's Gemini API for generating embeddings, and Supabase as the PostgreSQL backend with the `pgvector` extension for efficient similarity searches.

The system reads text documents from a local directory, generates vector embeddings for their content, and stores them in a Supabase table. It then provides a mechanism to query this database to find the most relevant documents based on a user's query.

## Features

- **Document Ingestion**: Reads text files from a specified directory (`docs/`).
- **Vector Embeddings**: Uses the Google Gemini API (`text-embedding-004` model) to generate 768-dimension embeddings for document content.
- **Vector Storage**: Stores documents and their corresponding embeddings in a Supabase PostgreSQL database.
- **Similarity Search**: (Assumed functionality in `index.js`) Performs a similarity search to retrieve documents relevant to a query.
- **Easy Configuration**: Manages API keys and database credentials through environment variables.

## Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/).
- A **Supabase Account**. You can sign up for free at [Supabase](https://supabase.com/).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```

### Configuration

1.  **Create a Supabase Project:**
    - Log in to your Supabase account and create a new project.
    - Keep the project details handy, as you will need the URL and API key.

2.  **Enable `pgvector`:**
    - In your Supabase project dashboard, navigate to **Database** > **Extensions**.
    - Find `vector` in the list and click **Enable**.

3.  **Create the `documents` Table:**
    - Navigate to the **SQL Editor** in your Supabase dashboard.
    - Run the following SQL query to create the table required for this project. The schema is also available in `created_tables.sql`.

    ```sql
    CREATE TABLE documents (
      id BIGSERIAL PRIMARY KEY,
      content TEXT,
      metadata JSONB,
      embedding VECTOR(3072)
    );
    ```

4.  **Set up Environment Variables:**
    - Create a file named `.env` in the root of your project.
    - Add the following environment variables to it, replacing the placeholder values with your actual credentials.

    ```env
    # Google Gemini API Key
    GEMINI_API_KEY="your_gemini_api_key"

    # Supabase Project Credentials
    SUPABASE_URL="https://your-project-id.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
    ```

    - You can find your Supabase URL and `service_role_key` in your project's **Settings** > **API** section.

## Usage

1.  **Add Documents:**
    - Place the text files you want to embed and store into the `docs/` directory. If the directory doesn't exist, create it. A sample `text.txt` is included.

2.  **Ingest and Embed Documents:**
    - Run the `upsertDocuments.js` script to process the files, generate embeddings, and upload them to your Supabase table.

    ```bash
    node upsertDocuments.js
    ```

    The script will log its progress, including which files are being processed and the status of the Supabase insertion.

3.  **Query the Database:**
    - (This assumes `index.js` is set up for querying)
    - Run the main application file to perform a similarity search.

    ```bash
    node index.js
    ```

## Database Schema

The following SQL statement is used to create the necessary table in your Supabase database.

**File:** `created_tables.sql`

```sql
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  metadata JSONB,
  embedding VECTOR(3072)
);
```

This schema defines a `documents` table with a vector column configured to store 768-dimension embeddings, which matches the output of the `text-embedding-004` model.
