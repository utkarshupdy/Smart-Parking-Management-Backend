import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import ParkingLot from "../models/ParkingLotSchema.js"
import Parking from "../models/parkingSchema.js"
import { Booking } from "../models/bookingSchema.js"




// create parking with parking lots by owner (having tyoe as owner in db)

const createParking = asyncHandler(async (req, res) => {
    const { name, address, city, lat, long, capacity , ip } = req.body;
    const user_id = req.user._id; // Owner's user ID

    if(req.user.type !== "owner"){
        throw new ApiError(400 , "Access Denied!! Authorised Access Only")
    }

    if (!name || !address || !city || !lat || !long || !capacity) {
        throw new ApiError(400, "All fields are required to create parking");
    }

    const parking = new Parking({
        name,
        address,
        city,
        lat,
        long,
        capacity,
        user: user_id, // Owner of this parking
        ip,

    });

    await parking.save();

    const parkingLots = [];
    for (let i = 0; i < capacity; i++) {
        parkingLots.push(new ParkingLot({ parking: parking._id })); 
    }

    // Save all parking lots and link them to the parking
    const savedLots = await ParkingLot.insertMany(parkingLots);
    parking.lots = savedLots.map(lot => lot._id);
    await parking.save();

    res.status(201).json(new ApiResponse(201, parking, "Parking created successfully"));
});



//  book parking lot by user
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
const getCurrentParkingList = asyncHandler(async (req, res) => {
    const userId = req.user._id; 
    const userType = req.user.type; 
    let parkingLots;

    if (userType === 'user') {
        parkingLots = await ParkingLot.find({ user: userId }).populate('parking', 'name address city lat long'); 

        if (!parkingLots.length){
            throw new ApiError(404, "No parking lots booked by the user.");
        }

        return res
        .status(200)
        .json(new ApiResponse(200, parkingLots, "Parking lots booked by the user retrieved successfully."));


    } else if (userType === 'owner') {
        const parking = await Parking.find({ user: userId }).populate('lots', 'isSlotBooked'); 

        if (!parking.length) {
            throw new ApiError(404, "No parking lots found for the owner.");
        }

        // Flatten the lots array from parking
        const allParkingLots = parking.flatMap(parking => parking.lots);

        return res
        .status(200)
        .json(new ApiResponse(200, allParkingLots, "Parking lots associated with the owner retrieved successfully."));
    } else {
        throw new ApiError(400, "Invalid user type.");
    }
});




//update parking

const updateParking = asyncHandler(async (req, res) => {
    const { parkingLotsList } = req.body; // Yolo output list

    if (!Array.isArray(parkingLotsList) || parkingLotsList.length === 0) {
        throw new ApiError(400, "Invalid request: No parking lots provided");
    }

    for (const lot of parkingLotsList) {
        const { lotId, isBooked } = lot;

        const parkingLot = await ParkingLot.findById(lotId);
        if (!parkingLot) {
            throw new ApiError(404, `Parking lot with ID ${lotId} not found`);
        }

        if (isBooked === 0 && parkingLot.isSlotBooked === true) {
            parkingLot.isSlotBooked = false;
            await parkingLot.save();

            await Booking.deleteOne({ parkingLot: parkingLot._id });
        }

        else if (isBooked === 1 && parkingLot.isSlotBooked === false) {
            parkingLot.isSlotBooked = true;
            await parkingLot.save();
        }
    }

    res.status(200).json({ message: "Parking lots updated successfully" });
});




//delete parking

const deleteParking = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const person = req.user.type;

        if(person != "owner"){
            throw new ApiError(400 , "You are not authorised to do this action. ")
        }
        const parking = await Parking.findOne({ user: userId }); 

        if (!parking) {
            return res.status(404).json({ error: "Parking not found for this owner." });
        }

        await ParkingLot.deleteMany({ parking: parking._id });

        await Parking.findByIdAndDelete(parking._id);

        res.json({ message: "Parking and its lots deleted successfully." });
    } catch (error) {
        console.error("Error deleting parking:", error);
        res.status(500).json({ error: "Server error" });
    }
});



export{

    createParking,
    bookParkingLot,
    updateParking,
    getCurrentParkingList,
    deleteParking,

}
