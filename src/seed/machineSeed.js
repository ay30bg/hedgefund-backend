const mongoose = require("mongoose");
require("dotenv").config();

const Machine = require("../models/Machine");

const machines = [
  {
    name: "Flash Speed Power Pumping Machine",
    price: 10,
    profit: 0.0264,
    duration: 21,
    img: "/pp1.png",
  },
  {
    name: "Godspeed Power Pumping Machine",
    price: 20,
    profit: 0.0529,
    duration: 21,
    img: "/pp4.png",
  },
  {
    name: "Surge Power Pumping Machine",
    price: 35,
    profit: 0.0925,
    duration: 21,
    img: "/pp5.png",
  },
  {
    name: "Speedy Power Pumping Machine",
    price: 50,
    profit: 0.1322,
    duration: 21,
    img: "/pp6.png",
  },
  {
    name: "Light Speed Pumping Machine",
    price: 100,
    profit: 0.2645,
    duration: 21,
    img: "/pp8.png",
  },
  {
    name: "Sound Speed Power Pumping Machine",
    price: 500,
    profit: 1.3224,
    duration: 21,
    img: "/pp9.png",
  },
  {
    name: "Sonic Power Pumping Machine",
    price: 1000,
    profit: 2.6445,
    duration: 21,
    img: "/pp10.png",
  },
  {
    name: "Spark Power Pumping Machine",
    price: 5000,
    profit: 13.2242,
    duration: 21,
    img: "/pp11.png",
  },
];

const seedMachines = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("🔥 Connected to MongoDB");

    // ⚠️ Optional: clear old data
    await Machine.deleteMany();

    console.log("🧹 Old machines cleared");

    // insert new machines
    await Machine.insertMany(machines);

    console.log("✅ Machines seeded successfully");

    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedMachines();
