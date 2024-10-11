import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { User } from "../models/userSchema.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ParkingLot } from "../models/ParkingLotSchema.js"
import { Parking } from "../models/parkingSchema.js"
import { reviewSchema } from "../models/reviewSchema.js"


// create new parking / book parking lot
const bookParkingLot = asyncHandler(async (req, res) => {
    const { lat, long } = req.body;  
    const user_id = req.user._id;

    if (!lat || !long || !user_id) {
        throw new ApiError(400, "Invalid request: Missing required fields");
    }

    const parking = await Parking.findOne({ lat, long });

    if (!parking) {
        throw new ApiError(404, "No parking area found at the provided location");
    }

    const parkingLot = await ParkingLot.findOne({
        parking: parking._id,  
        isSlotBooked: false
    });

    if (!parkingLot) {
        throw new ApiError(404, "No free parking lot available at this location");
    }

    parkingLot.isSlotBooked = false;
    await parkingLot.save();

    res.status(200).json(new ApiResponse(200, parkingLot, "Parking lot is temporarily reserved"));
})


//get existing parking list



//update parking

const updateParking = asyncHandler(async(req , res)=>{
    
})


//delete parking


export{
    bookParkingLot,

}
