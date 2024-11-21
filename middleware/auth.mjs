import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export default (req, res, next) => {
    // Look/pull token from the header
    const token = req.header('x-auth-token');

//if token isn't found

if(!token) {
    return res.status (401).json({error: [{msg: 'No Token, Auth Denied'}]})
}
 
try {
    //jwt token Verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

 // Add user from payload to request object
    req.user = decoded.user;

    next()

} catch (err) {
    console.error(err);
    res.status (401).json({error: [{msg: 'Invalid Token'}]})
}

};
