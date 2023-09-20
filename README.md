# ai-powered-database-queries

## Prerequisites
This guide assumes you have already generated a OpenAI API key, which can be [found here](https://platform.openai.com/account/api-keys).

## Running the application
1. Create the env file and add your OpenAI API key
```sh
cp .env.example .env
```
2. Install dependencies
```sh
npm install
```

3. Run the application
```sh
npm run start
```

## Using your own database
Want to use your own SQLite database? Just replace the `./data/baby_names.db` path with the path to your database.

#### **`db.ts`**
```ts
const client = new Database("./data/baby_names.db");
```