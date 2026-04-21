// // ================= IMPORTS =================
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();

// // Routes
// const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");
// const balanceRoutes = require("./routes/balanceRoutes");
// const marketRoutes = require("./routes/marketRoutes");
// const machineRoutes = require("./routes/machineRoutes");

// // ================= APP INIT =================
// const app = express();

// // ================= TRUST PROXY =================
// app.set("trust proxy", 1);

// // ================= CORS =================
// const allowedOrigins = [
//   "http://localhost:3000",
//   "https://hedgefund-power.vercel.app",
// ];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       return callback(new Error("CORS blocked"));
//     },
//     methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true
//   })
// );

// // ================= GLOBAL MIDDLEWARE =================
// app.use(express.json({ limit: "10mb" }));

// // Optional logger (very useful)
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// // ================= ROOT =================
// app.get("/", (req, res) => {
//   res.json({ message: "Hedgefund Power API is running 🚀" });
// });

// // ================= ROUTES =================
// app.use("/api/auth", authRoutes);
// app.use("/api/user", userRoutes);
// app.use("/api/balance", balanceRoutes);
// app.use("/api/market", marketRoutes);
// app.use("/api/machines", machineRoutes);

// // ================= 404 HANDLER =================
// app.use((req, res, next) => {
//   res.status(404).json({ message: "Route not found" });
// });

// // ================= GLOBAL ERROR HANDLER =================
// app.use((err, req, res, next) => {
//   console.error("SERVER ERROR:", err.message);

//   res.status(err.statusCode || 500).json({
//     message: err.message || "Something went wrong",
//     ...(process.env.NODE_ENV === "development" && {
//       stack: err.stack
//     })
//   });
// });

// // ================= MONGODB =================
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("✅ MongoDB Connected");
//   } catch (err) {
//     console.error("❌ MongoDB Connection Error:", err.message);
//     process.exit(1);
//   }
// };

// // Better reconnect handling (no infinite spam loop)
// mongoose.connection.on("disconnected", () => {
//   console.warn("⚠️ MongoDB disconnected. Attempting reconnect...");
// });

// // ================= START SERVER =================
// const PORT = process.env.PORT || 5000;

// connectDB().then(() => {
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//   });
// });

// ================= IMPORTS =================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const balanceRoutes = require("./routes/balanceRoutes");
const marketRoutes = require("./routes/marketRoutes");
const machineRoutes = require("./routes/machineRoutes");

// ✅ SEED FUNCTION (OPTION 2)
const seedMachinesIfEmpty = require("./seed/machineSeed");

// ================= APP INIT =================
const app = express();

// ================= TRUST PROXY =================
app.set("trust proxy", 1);

// ================= CORS =================
const allowedOrigins = [
  "http://localhost:3000",
  "https://hedgefund-power.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS blocked"));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ================= GLOBAL MIDDLEWARE =================
app.use(express.json({ limit: "10mb" }));

// Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ================= ROOT =================
app.get("/", (req, res) => {
  res.json({ message: "Hedgefund Power API is running 🚀" });
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/machines", machineRoutes);

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.message);

  res.status(err.statusCode || 500).json({
    message: err.message || "Something went wrong",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
});

// ================= MONGODB =================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

// Optional reconnect logging
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected. Attempting reconnect...");
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // 🔥 AUTO SEED (ONLY IF EMPTY)
  await seedMachinesIfEmpty();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
