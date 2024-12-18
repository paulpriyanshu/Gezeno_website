const mongoose = require("mongoose")

const connectdb = async()=>{
    try{
    const connect = await mongoose.connect('mongodb+srv://priyanshupaul003:oAsGAjErBlExDHoa@cluster0.42q18en.mongodb.net/')
    //console.log("database is connected")
    }catch(err){
     //console.log(err);
     process.exit(1);
    }
}
    
module.exports = connectdb; 