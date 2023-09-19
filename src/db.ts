import { Database } from "sqlite3";

const client = new Database("./data/baby_names.db");

const query = (sql: string): Promise<unknown[]> => {
  return new Promise((resolve, reject) => {
    client.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const close = () => {
  client.close();
};

export const db = {
  client,
  query,
  close
};
