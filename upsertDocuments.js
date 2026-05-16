// import { genAI } from "./config.js";
// import { supabase } from "./config.js";

// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// // --- Configuration ---
// const SOURCE_DOCUMENTS_DIR = "docs";
// const SUPABASE_TABLE_NAME = "documents";
// const CLEAR_SUPABASE_TABLE_CONTENTS = true;

// // Gemini embedding model
// const EMBEDDING_MODEL_NAME = "gemini-embedding-001";

// // Get __dirname equivalent in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // --- Ingestion Logic ---
// export async function ingestDocuments() {
//   const docsDirPath = path.join(__dirname, SOURCE_DOCUMENTS_DIR);

//   console.log(`Ingesting documents from directory: ${docsDirPath}`);

//   // Store all documents to insert
//   const allDocumentsToInsert = [];

//   try {
//     // 1. Check if directory exists
//     if (!fs.existsSync(docsDirPath) || !fs.lstatSync(docsDirPath).isDirectory()) {
//       throw new Error(`Source documents directory not found at ${docsDirPath}.`);
//     }

//     // Read all files
//     const files = fs.readdirSync(docsDirPath);

//     if (files.length === 0) {
//       console.log(`No files found in ${docsDirPath}.`);
//       return;
//     }

//     console.log(`Found ${files.length} files to process.`);

//     // Clear table if enabled
//     if (CLEAR_SUPABASE_TABLE_CONTENTS) {
//       console.log(`Clearing existing documents from table '${SUPABASE_TABLE_NAME}'...`);

//       const { error: deleteError } = await supabase.from(SUPABASE_TABLE_NAME).delete().neq("id", -1);

//       if (deleteError) {
//         console.warn(`Warning: Could not clear existing documents: ${deleteError.message}`);
//       } else {
//         console.log("Existing documents cleared.");
//       }
//     }

//     // Process files
//     for (const filename of files) {
//       const filePath = path.join(docsDirPath, filename);

//       console.log(`Processing file: ${filename}...`);

//       // Read content
//       const fileContent = fs.readFileSync(filePath, "utf-8");

//       console.log(`- Read ${fileContent.length} characters.`);

//       try {
//         // Get the embedding model
//         const result = await genAI.models.embedContent({
//           model: EMBEDDING_MODEL_NAME,
//           contents: [fileContent],
//         });

//         const embedding = result.embeddings[0].values;

//         allDocumentsToInsert.push({
//           content: fileContent,
//           embedding,
//           metadata: {
//             source: filename,
//           },
//         });

//         console.log(`- Embedded content from ${filename}`);
//       } catch (embedError) {
//         console.error(`- Failed to embed content from ${filename}: ${embedError.message}`);
//       }
//     }

//     if (allDocumentsToInsert.length === 0) {
//       console.log("No documents were successfully embedded.");
//       return;
//     }

//     console.log(`Prepared ${allDocumentsToInsert.length} documents for insertion.`);

//     // Upload to Supabase
//     console.log(`Uploading documents to Supabase table '${SUPABASE_TABLE_NAME}'...`);

//     const { error: insertError } = await supabase.from(SUPABASE_TABLE_NAME).insert(allDocumentsToInsert);

//     if (insertError) {
//       console.error("Error inserting documents:", insertError);

//       throw new Error(`Supabase insert failed: ${insertError.message}`);
//     }

//     console.log(`Successfully inserted ${allDocumentsToInsert.length} documents.`);

//     console.log("--- Ingestion Complete! ---");
//   } catch (error) {
//     console.error("--- Ingestion Failed! ---");
//     console.error(error);

//     process.exit(1);
//   }
// }

import { genAI, supabase } from "./config.js";
import { EMBEDDING_MODEL_NAME, CHUNK_OVERLAP, CHUNK_SIZE } from "./constants.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { simpleTextSplitter } from "./utils.js";

// --- Configuration ---
const SOURCE_DOCUMENTS_DIR = "docs";
const SUPABASE_TABLE_NAME = "documents"; // Table created in Supabase
const CLEAR_SUPABASE_TABLE_CONTENTS = true;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Ingestion Logic ---
export async function ingestDocuments() {
  const docsDirPath = path.join(__dirname, SOURCE_DOCUMENTS_DIR);
  console.log(`Ingesting documents from directory: ${docsDirPath}`);

  // *** NEW: Stores all documents to insert across all files ***
  const allDocumentsToInsert = [];

  try {
    // 1. Check if directory exists
    if (!fs.existsSync(docsDirPath) || !fs.lstatSync(docsDirPath).isDirectory()) {
      throw new Error(`Source documents directory not found at ${docsDirPath}. Please create it and add files.`);
    }

    // *** Read all files from the directory ***
    const files = fs.readdirSync(docsDirPath);

    if (files.length === 0) {
      console.log(`No files found in ${docsDirPath}. Nothing to ingest.`);
      return;
    }
    console.log(`Found ${files.length} files to process.`);

    if (CLEAR_SUPABASE_TABLE_CONTENTS) {
      console.log(`Clearing existing documents from table '${SUPABASE_TABLE_NAME}'...`);
      const { error: deleteError } = await supabase.from(SUPABASE_TABLE_NAME).delete().neq("id", -1); // Deletes all rows
      if (deleteError) {
        console.warn(`Warning: Could not clear existing documents: ${deleteError.message}`);
      } else {
        console.log("Existing documents cleared.");
      }
    }

    // *** Process each file ***
    let totalChunks = 0;

    for (const filename of files) {
      const filePath = path.join(docsDirPath, filename);
      console.log(`Processing file: ${filename}...`);

      // Read File Content
      const fileContent = fs.readFileSync(filePath, "utf-8");
      console.log(` - Read ${fileContent.length} characters.`);

      // split the large text into chunks
      const chunks = simpleTextSplitter(fileContent, CHUNK_SIZE, CHUNK_OVERLAP);

      if (chunks.length === 0) {
        console.log(` - No chunks generated for this file.`);
        continue; // Skip to next file
      }

      /**
       * Embed each chunk
       */
      console.log(`Embedding ${chunks.length} chunks of text`);
      let fileChunkCount = 0;
      for (const chunk of chunks) {
        fileChunkCount++;
        try {
          // Get the embedding model
          const result = await genAI.models.embedContent({
            model: EMBEDDING_MODEL_NAME,
            contents: [fileContent],
          });

          const embedding = result.embeddings[0].values;
          // *** Add metadata with source filename ***
          allDocumentsToInsert.push({
            content: chunk,
            embedding: embedding,
            metadata: { source: filename }, // Store filename here
          });
          console.log(`- Embedded chunk ${fileChunkCount} content from ${filename}`);
        } catch (embedError) {
          console.error(`   - Failed to embed content from ${filename}: ${embedError.message}. Skipping chunk.`);
        }
      }
    }

    console.log(`Total chunks generated across all files: ${totalChunks}`);

    if (allDocumentsToInsert.length === 0) {
      console.log("No documents were successfully embedded across all files. Aborting upload.");
      return;
    }

    console.log(`Total documents successfully prepared for insertion: ${allDocumentsToInsert.length}\n\n`);

    // 5. Store all collected documents in Supabase
    console.log(`Uploading ${allDocumentsToInsert.length} documents to Supabase table '${SUPABASE_TABLE_NAME}'...`);
    const { error: insertError } = await supabase.from(SUPABASE_TABLE_NAME).insert(allDocumentsToInsert); // Insert all collected documents

    if (insertError) {
      console.error("Error inserting documents into Supabase:", insertError);
      throw new Error(`Supabase insert failed: ${insertError.message}`);
    } else {
      console.log(`Successfully inserted ${allDocumentsToInsert.length} documents into Supabase.`);
    }

    console.log("--- Ingestion Complete! ---");
  } catch (error) {
    console.error("--- Ingestion Failed! ---");
    console.error("Error during ingestion process:", error);
    process.exit(1); // Exit with error code
  }
}
