const express = require('express')
const authRoutes = require('./controller/users');
const product = require('./controller/product')
const cart = require('./controller/cart')
const search = require('./controller/search')
const limiter = require('./middleware/ratelimit')
const connectdb = require('./libs/dbconnection');
const passport = require('passport');
const image=require('./controller/bucket')
const cors=require('cors')
require('dotenv').config()



// const swaggerUi = require('swagger-ui-express');
// const swaggerJSDoc = require('swagger-jsdoc');
// const swaggerSpec = require('./config/swaggerconf');
const corsOptions = {
    origin: '*', // Change this to your frontend's URL in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies or authorization headers
};
const app = express()

const port = 8080


connectdb()
app.use(cors(corsOptions))
require('./libs/passport');
app.use(passport.initialize());


app.use(express.json());
app.use(limiter);

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/', authRoutes);
app.use('/api/', product);
app.use('/api/',cart)
app.use('/api',search)
app.use('/api/',image)

console.log(process.env.EMAIL_USERNAME)
app.get('/getdata',(req,res)=>{
    res.json({msg:"hello"})
})

app.listen(port,()=>{
    console.log('app is running',port)
})