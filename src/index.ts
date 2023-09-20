import path from "path";
require("dotenv").config({ path: path.resolve(__dirname + "/../.env") });
import { openai } from "./openai";
import { db } from "./db";
import { getUserInput } from "./get-user-input";

getUserInput(async (userInput: string) => {
  // Get the schema of the database
  const schema = await db.getSchema();

  // Use the OpenAI API to create the SQL query
  const createQueryResult = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `Given the following SQL tables, your job is to write queries given a user's request.
        Return only the SQL string.
        Gender is either a 'M' or and 'F'.
        Name is always the first name.
        Year is in the format YYYY. \n
        ${schema}`,
      },
      { role: "user", content: userInput },
    ],
  });
  const query = createQueryResult.choices[0].message.content;

  if (query == null) {
    throw new Error("No query was returned from OpenAI.");
  }

  // Query the database
  const result = await db.query(query);

  // Use the OpenAI API to create a response to the user
  const createResponseResult = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 1,
    messages: [
      {
        role: "system",
        content: `Your job is to take a users question; the JSON response from the database, and return a response to the user. 
          Example: "The average age is 32."`,
      },
      { role: "user", content: userInput },
      { role: "user", content: JSON.stringify(result) },
    ],
  });

  // Log out the response
  console.log(`> ${createResponseResult.choices[0].message.content}`);

  // Close the database connection
  await db.close();
});
