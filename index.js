import { retrieveSimilarDocs } from "./retrieveSimilarDocs.js";
import { ingestDocuments } from "./upsertDocuments.js";
import "dotenv/config";
import { combineDocuments, getRagPrompt } from "./utils.js";
import { generateResponse } from "./config.js";

const query = "How many houses were damaged during the great fire of london?";

async function main(query) {
  //retrieve docs that contain content relevant to the query
  const retrievedDocs = await retrieveSimilarDocs(query);
  // console.log(retrievedDocs);

  //create a prompt including context docs to send to the model

  const contextString = combineDocuments(retrievedDocs);

  //create a prompt including context docs to send to the model
  const prompt = getRagPrompt(contextString, query);

  // //send prompt to model to generate response
  const response = await generateResponse(prompt);

  for await (const chunk of response) {
    console.log(chunk.text);
  }

  // console.log(response.output_text);

  // function to ingest documents from the local directory to supabase. Uncomment and run once to populate your database with documents before running the main function to retrieve similar docs based on a query.
  // await ingestDocuments();
}

main(query);
