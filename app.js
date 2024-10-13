import express from 'express'
import cookieParser from 'cookie-parser' 
import cors from 'cors'  
import {urlencoded} from 'express'      


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN   ,                  
    credentials: true,  
}))  

app.use(express.json({
    limit:"20kb"   
}))

app.use(express.urlencoded({
    extended: true,  
    limit:"16kb"
}))
app.use(express.static("public")) 

app.use(cookieParser())



 import userRouter from './routes/userRoutes.js' 
 import parkingRouter from './routes/parkingRoutes.js'
 import bookingRouter from './routes/bookingRoutes.js'

 
 app.use("/api/v1/users/user" , userRouter)
 
 app.use("/api/v1/users/parkings" , parkingRouter)


 app.use("/api/v1/users/bookings" , bookingRouter)
 // http://localhost:8000/api/v1/users/register    


export {app} 