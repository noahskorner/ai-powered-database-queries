import { db } from "./db";

(async function main() {
  const result = await db.query("SELECT COUNT(*) FROM baby_names");

  console.log(result);

  await db.close();
})();
