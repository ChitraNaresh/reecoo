const mongoose=require("mongoose")

const appointmentsSchema=new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    doctorId:{
        type:String,
        required:true
    },
    doctorInfo:{
        type:Object,
        required:true
    },
    userInfo:{
        type:Object,
        required:true
    },
    date:{
        type:String,
        required:true
    },
    time:{
        type:String,
        required:true
    },
    status:{
        type:String,
        required:true,
        default:"pending"
    },  
},{
    timestamps:true
})

const appointmentModel=mongoose.model("appointments",appointmentsSchema)
module.exports=appointmentModel