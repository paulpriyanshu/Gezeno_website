const express = require('express')
const authRoutes = require('./controller/users');
const product = require('./controller/product')
const cart = require('./controller/cart')
// const search = require('./controller/search')
const limiter = require('./middleware/ratelimit')
const connectdb = require('./libs/dbconnection');
// const passport = require('passport');

const homepage=require('./controller/home')
const image=require('./controller/bucket')
const cors=require('cors')
require('dotenv').config()

const app = express()

const port = 8080


connectdb()
app.use(cors())

connectdb()
require('./libs/passport');
// app.use(passport.initialize());


app.use(express.json());
console.log("arrived here")
// app.use(limiter);

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/',homepage);
app.use('/api/', authRoutes);
app.use('/api/', product);
app.use('/api/',cart)
// app.use('/api',search)
app.use('/api/',image)
console.log("arrived here2")

//console.log(process.env.EMAIL_USERNAME)
app.get('/getdata',(req,res)=>{
    res.json({msg:"hello"})
})

app.listen(port,()=>{
    console.log('app is running',port)
})