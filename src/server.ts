import express from "express";
import connectToDatabase from "./db/db.js";

const app = express();
const port = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello World 123!");
  console.log("Response sent");
});

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
    process.exit(1); // Exit the process if database connection fails
  });
