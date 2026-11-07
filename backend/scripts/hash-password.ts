import readline from "readline/promises";
import { stdin, stdout } from "process";
import { hashPassword } from "../utils/auth";

async function main() {
  const terminal = readline.createInterface({ input: stdin, output: stdout });
  try {
    const password = await terminal.question("New admin password (12+ characters): ");
    if (password.length < 12 || password.length > 200) throw new Error("Password must be between 12 and 200 characters.");
    const confirmation = await terminal.question("Confirm password: ");
    if (password !== confirmation) throw new Error("Passwords do not match.");
    console.log("Store this hash in the existing owner's users.password field:");
    console.log(hashPassword(password));
  } finally {
    terminal.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Could not create password hash.");
  process.exitCode = 1;
});
