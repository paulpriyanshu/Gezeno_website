const jwt = require('jsonwebtoken')

module.exports = async  function auth(req,res,next){
       let authheader = req.headers.Authorization || req.headers.authorization
       if (authheader && authheader.startsWith("Bearer")){
        token = authheader.split(" ")[1];
        try {
        
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            req.user = verified;
            next();
          } catch (error) {
            res.status(400).json({ message: 'Invalid Token' });
          }
        
    }
}