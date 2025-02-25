const express = require('express')
const authRoutes = require('./controller/users');
const product = require('./controller/product')
const order = require('./controller/order')
// const search = require('./controller/search')
const limiter = require('./middleware/ratelimit')
const connectdb = require('./libs/dbconnection');
// const passport = require('passport');

const homepage=require('./controller/home')
const offers=require('./controller/offer')
const image=require('./controller/bucket')
const coupons=require('./controller/coupon')
const cors=require('cors');
// const order = require('./models/order');
require('dotenv').config()

const app = express()

const port = 8080


connectdb()
app.use(cors());


// require('./libs/passport');
// app.use(passport.initialize());


app.use(express.json());
console.log("arrived here")
// app.use(limiter);

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api',homepage);
app.use('/api/users', authRoutes);
app.use('/api/products', product);
app.use('/api',offers)
app.use('/api/orders',order)
app.use('/api',image)
app.use('/api',coupons)


//console.log(process.env.EMAIL_USERNAME)
app.get('/getdata',(req,res)=>{
    res.json({msg:"hello"})
})

app.listen(port,()=>{
    console.log('app is running',port)
})