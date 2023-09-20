# Automating My Daily Tasks: How AI Helped Me Eliminate My Job

As a software engineer, I often get requests throughout the week from stakeholders to run queries on their database. Requests like

> How many users have logged in since August?

> What is the average number of bookmarks per user?

> Can I get a list of emails for the users who are single in my zipcode?

I tend to actually enjoy writing these SQL queries, but it can be a costly context-switch. Why not have AI do this for us? The goal here is to have a application where users can ask questions like:

> &gt; How many babies named John were born after 2000?

and get a response like:

> &gt; There were 6,000 babies born named John after 2000

Let's jump into it.

## The Data

First let's look at the dataset. You can use any dataset you want, but I'll be using the Popular Baby Names dataset [found here](https://www.ssa.gov/oact/babynames/limits.html). For my example I converted this into a SQLite database, but you can use any database you want.

| Name   | Gender | Count | Year |
| ------ | ------ | ----- | ---- |
| Liam   | M      | 20456 | 2022 |
| Noah   | M      | 18621 | 2022 |
| Oliver | M      | 15076 | 2022 |

## The Context

In order for OpenAI to understand the context of our question, we need to provide it with our database schema. I created this simple function to generate the schema as a string for us.

#### **`db.ts`**

```ts
import { Database } from "sqlite3";

const client = new Database("./data/baby_names.db");

// Queries the database
const query = <T>(sql: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    client.all(sql, (err, rows: T[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Returns the schema of the SQLite database as a string
const getSchema = async (): Promise<string> => {
  const result = await query<{
    sql: string;
  }>("SELECT sql FROM sqlite_schema;");
  return result.map((row) => row.sql).join("\n");
};

// Closes the connection to the database
const close = () => {
  client.close();
};

export const db = {
  client,
  getSchema,
  query,
  close,
};
```

```ts
console.log(await getSchema());
// CREATE TABLE baby_names (
//     Name TEXT,
//     Gender TEXT,
//     Count INTEGER,
//     Year INTEGER
// )
```

## The Question

Next, our users need to be able to ask the AI questions. I created this `getUserInput` function which will prompt the user for a question and call a callback.

#### **`get-user-input.ts`**

```ts
import * as readline from "readline";

const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const getUserInput = (
  callback: (userInput: string) => Promise<void>
) => {
  cli.question("What do you want to ask your data? ", async (str) => {
    const userInput: string = str.trim();

    await callback(userInput);

    cli.close();
  });
};
```

## Connecting to the OpenAI API

Now we need to connect to the OpenAI API. I created a simple `openai.ts` file to handle this for us.

#### **`openai.ts`**

```ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

## Putting it all together

Now we can put it all together. I created an `index.ts` file which will:

- Prompt the user for a question
- Send the question to the OpenAI API to generate the SQL command
- Run the SQL command on the database
- Send the results to OpenAI to generate the response
- Print the response

#### **`index.ts`**

```ts
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
```

## The result

Now we can run our application and ask it questions like:

```
What do you want to ask your data?
> What is the most popular baby name since 2000?
> The most popular baby name since 2000 is Jacob.
```

Want to run the application yourself? The repo can be found here: https://github.com/noahskorner/ai-powered-database-queries.git


**Disclaimer: Obviously, this is not production level code. We wouldn't want to run unfiltered queries against a live production database, but this is a cool example of how AI can be used to automate our daily tasks.**