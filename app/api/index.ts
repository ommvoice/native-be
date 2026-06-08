import "dotenv/config";
import express from "express";
import cors from "cors";
import { configureRoutes } from "./routes/index.js";
import { connectDB } from "./database/database.config.js";
import { setupSwagger } from "./docs/swagger.js";
import globalError from "./shared/errors/globalError.js";

const app = express();
const PORT = process.env["PORT"] ?? 3000;

// app.get("/posts", async (_req, res) => {
//   try {
//     const posts = await prisma.post.findMany();
//     res.json(posts);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch posts" });
//   }
// });

 await connectDB().catch((err) => {
    process.stderr.write("[createApp] DB connection failed\n");
    console.error("❌ Failed to connect to DB:", err);
    process.exit(1);
  });

setupSwagger(app);
app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api", configureRoutes());
app.use(globalError);
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
