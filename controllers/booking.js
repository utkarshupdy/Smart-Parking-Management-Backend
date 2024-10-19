import {asyncHandler} from '../utils/asyncHandler.js';
import { Booking } from '../models/bookingSchema.js';
import ParkingLot from '../models/ParkingLotSchema.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import { processPayment } from './paymentMethod.js';
import axios from 'axios'; // For making internal API requests
import cron from 'node-cron';
// npm install node-cron


// create booking
const createBooking = asyncHandler(async (req, res) => {
    const { vehicle_company, vehicle_model, plate_number, car_color, slot_start_time, slot_end_time, parkingLotId, token } = req.body;
    const user_id = req.user._id;

    if (!parkingLotId || !slot_start_time || !slot_end_time || !token) {
        throw new ApiError(400, "Required fields missing for booking or payment.");
    }

    const parkingLot = await ParkingLot.findOne({ _id: parkingLotId, isSlotBooked: false });
    if (!parkingLot) {
        throw new ApiError(404, "Parking lot is not available or already booked");
    }

    const startTime = new Date(slot_start_time);
    const endTime = new Date(slot_end_time);
    const durationInMinutes = (endTime - startTime) / 60000;
    const price = durationInMinutes * 0.5;

    try {
        const paymentResult = await processPayment({
            price,
            name: `Parking Booking for ${vehicle_company} ${vehicle_model}`
        }, token);

        if (paymentResult.success) {
            parkingLot.isSlotBooked = true;
            parkingLot.user = user_id;
            await parkingLot.save();
            const booking = new Booking({
                vehicle_company,
                vehicle_model,
                plate_number,
                car_color,
                slot_start_time,
                slot_end_time,
                price,
                parkinglot_id: parkingLotId,
                user_id
            });

            const savedBooking = await booking.save();
            res.status(200).json(new ApiResponse(200, savedBooking, "Booking confirmed successfully!"));
        } else {
            throw new ApiError(400, "Payment failed. Please try again.");
        }
    } catch (error) {
        console.error('Payment API error: ', error);
        throw new ApiError(500, "Payment service error");
    }
});


//get existing booking list
const getExistingBookingList = asyncHandler(async (req, res) => {
    const userId = req.user._id; 
    const userType = req.user.type;
    let bookings;

    if (userType === 'user') {
        bookings = await Booking.find({ user_id: userId }).populate({
            path: 'parkinglot_id',
            populate: { path: 'parking' }
        });

        if (!bookings.length) {
            throw new ApiError(404, "No bookings found for the user.");
        }

        return res.status(200).json(new ApiResponse(200, bookings, "User bookings retrieved successfully."));
    } 
    else if (userType === 'owner') {
        const parkingLots = await ParkingLot.find({ user: userId }); 
        const parkingIds = parkingLots.map(lot => lot.parking); 

        bookings = await Booking.find({ parkinglot_id: { $in: parkingIds } }).populate({
            path: 'parkinglot_id',
            populate: { path: 'Parking' }
        });

        if (!bookings.length) {
            throw new ApiError(404, "No bookings found for the owner's parking lots.");
        }

        return res.status(200).json(new ApiResponse(200, bookings, "Owner bookings retrieved successfully."));
    } else {
        throw new ApiError(400, "Admin Access Blocked ");
    }
});


//update booking
// const updateBooking = asyncHandler(async(req , res)=>{
//     const user_id = req.user._id;
//     const type = req.user.type;

//     if(type != "user"){
//         throw new ApiError(404 , "You are not allowed to perform this action")
//     }

//     const {bookingId , new_slot_time} = req.body

//     const booking = await Booking.findById(bookingId)
//     if(!booking){
//         throw new ApiError(404 , "Booking not found");
//     }

//     const prev_slot_end_time = new Date(booking.slot_end_time);
//     const new_slot_end_time = new Date(new_slot_time);
//     const amt = booking.amount ;

//     const add_amount = ((new_slot_end_time - prev_slot_end_time)/60000)*0.5 ;

//     try {
//         const paymentResponse = await axios.post('http://localhost:5000/api/payment', {
//             amount: add_amount,
//             user_id
//         });

//         if(paymentResponse.data.success){
//             // Update booking details
//             booking.slot_end_time = new_slot_end_time;
//             booking.price = amt + add_amount;
//             await booking.save();

//             res
//             .status(200)
//             .json(new ApiResponse(200, booking, "Booking updated successfully!"));
//         } 
//         else{
//             throw new ApiError(400, "Payment failed. Please try again.");
//         }
//     } catch (error) {
//         console.error('Payment API error: ', error);
//         throw new ApiError(500, "Payment service error");
//     }
// })
// update booking function
const updateBooking = asyncHandler(async (req, res) => {

    const user_id = req.user._id;
    const type = req.user.type;

    if (type !== "user") {
        throw new ApiError(404, "You are not allowed to perform this action");
    }

    const { bookingId, new_slot_time, token } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    const prev_slot_end_time = new Date(booking.slot_end_time);
    const new_slot_end_time = new Date(new_slot_time);

    const add_amount = ((new_slot_end_time - prev_slot_end_time) / 60000) * 0.5;
    const totalAmount = booking.price + add_amount;

    try {
        // Process Stripe payment for the additional amount
        const paymentResult = await processPayment({
            price: add_amount,
            name: `Extend Parking Booking for ${booking.vehicle_company} ${booking.vehicle_model}`,
        }, token);

        if (paymentResult.success) {
            // Update booking details
            booking.slot_end_time = new_slot_end_time;
            booking.price = totalAmount;
            await booking.save();

            res.status(200).json(new ApiResponse(200, booking, "Booking updated successfully!"));
        } else {
            throw new ApiError(400, "Payment failed. Please try again.");
        }
    } catch (error) {
        console.error('Payment API error: ', error);
        throw new ApiError(500, "Payment service error");
    }
});





//delete expired booking
const deleteExpiredBookings = async () => {
    try {
        const now = new Date();
        const result = await Booking.deleteMany({ slot_end_time: { $lt: now } });
        console.log(`Deleted ${result.deletedCount} expired bookings`);
    } 
    catch (error) {
        console.error("Error deleting expired bookings: ", error);
    }
};

cron.schedule('0 * * * *', deleteExpiredBookings);

// delete particular booking by user
const deleteIndividualBooking =  asyncHandler(async(req , res)=>{
    const user_id = req.user._id ;
    const type = req.user.type;

    if(type != "user"){
        throw new ApiError(400 , "You are not authorised to perform this action");
    }

    const { bookingId } = req.body;

    const booking = await Booking.findOneAndDelete({ _id: bookingId, user_id });

    if(!booking){
        throw new ApiError(400 , "Booking with this Id Not Found or It may be deleted")
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200 , "Booking deleted Successfully"))

})

//delete all bookings by user

const deleteAllBookings = asyncHandler(async(req , res)=>{
    const user_id = req.user._id ;
    const type = req.user.type;

    if(type != "user"){
        throw new ApiError(400 , "You are not authorised to perform this action");
    }

    const result = await Booking.deleteMany({user_id});

    if(result.deletedCount === 0){
        throw new ApiError(404 , "No Booking Found for this user")
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , "All Bookings deleted successfully"));

})


export { 
    createBooking ,
    getExistingBookingList,
    deleteIndividualBooking,
    deleteAllBookings,
    updateBooking,


};
