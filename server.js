const express = require("express");
// const dbConfig=require("./config/dbConfig")
const dbConfig=require("./dbConfig")
const cors=require("cors")

const app = express();
app.use(cors())
require("dotenv").config()
app.use(express.json())
// const userRoute=require("./routes/userRoute")
const userRoute=require("./userRoute")
app.use("/api/user",userRoute)
app.use("/api/admin",userRoute)
app.use("/api/doctor",userRoute)
const port = process.env.PORT || 5001;



app.listen(port, () => console.log(`Listening on port ${port}`));
