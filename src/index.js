import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/database.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 3000;

connectDB()
.then(() => {
  app.listen(port, () => {
    console.log(`the app listening on port http://localhost:${port}`);
  });
})
.catch((error) => {
  console.log('mongodb connection error', error)
  process.exit(1)
})

console.log("Start of backend project");

