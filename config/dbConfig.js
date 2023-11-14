const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://ChitraNaresh18:ChitraNaresh18@cluster1.ahdanvp.mongodb.net/Booking");

const connection = mongoose.connection;
console.log(process.env.MONGO_URL,11)

connection.on("connected", () => {
  console.log("MongoDB is conneted");
});

connection.on("error", (error) => {
  console.log("Error is MongoDB connection", error);
});

module.exports = mongoose;
