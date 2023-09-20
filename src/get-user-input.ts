import * as readline from 'readline';

const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const getUserInput = (callback: (userInput: string) => Promise<void>) => {
  cli.question('What do you want to ask your data?\n> ', async (str) => {
    const userInput: string = str.trim();

    await callback(userInput);

    cli.close();
  });
}
