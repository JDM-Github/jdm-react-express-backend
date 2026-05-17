import express from "express";
import cors from "cors";
import { testRouter } from "./routes/test.routes";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/test", testRouter);

// Health check
app.get("/", (_req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});