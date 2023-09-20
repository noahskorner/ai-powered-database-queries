import { Database } from "sqlite3";

const client = new Database("./data/baby_names.db");

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

const getSchema = async (): Promise<string> => {
  const result = await query<{
    sql: string;
  }>("SELECT sql FROM sqlite_schema;");
  return result.map((row) => row.sql).join("\n");
};

const close = () => {
  client.close();
};

export const db = {
  client,
  getSchema,
  query,
  close,
};
