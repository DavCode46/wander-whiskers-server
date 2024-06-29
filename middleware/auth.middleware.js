import jwt from 'jsonwebtoken';
import ErrorModel from '../models/Error.model.js';

const authenticate = (req, res, next) => {
    const Authorization = req.headers.Authorization || req.headers.authorization

    if(Authorization && Authorization.startsWith('Bearer')) {
        const token = Authorization.split(' ')[1]
        jwt.verify(token, process.env.SECRET_TOKEN, (err, userInfo) => {
            if(err) return next(new ErrorModel('No autorizado', 403))
      
            req.user = userInfo
        
            next()
        })
    } else {
        return next(new ErrorModel('No autorizado', 403))
    }

    
}

export default authenticate;