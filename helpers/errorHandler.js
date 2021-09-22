function errorHAndler(err,req,res,next){
    if(err.name==='UnauthorizedError')
        {
          return  res.status(401).json({message:'user is not authorized'})
        }
    

    if(err.name==='ValidationError')
        {return res.status(401).json({message:err})
        }
        return res.status(401).json({message:err})
    }
    module.exports=errorHAndler