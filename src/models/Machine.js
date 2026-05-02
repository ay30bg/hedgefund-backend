 const mongoose = require("mongoose");

 const machineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
       required: true,
       unique: true
     },

     price: {
      type: Number,
      required: true
     },

     profit: {
       type: Number,
       required: true
     },

      duration: {
       type: Number,
       required: true
     },

     img: {
     type: String, // store image path or URL
      required: true
    }
   },
   { timestamps: true }
);

module.exports = mongoose.model("Machine", machineSchema);
