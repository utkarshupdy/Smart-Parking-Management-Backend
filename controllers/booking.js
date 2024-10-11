import asyncHandler from 'express-async-handler';
import { Booking } from '../models/bookingModel.js';
import { ParkingLot } from '../models/parkingLotModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import axios from 'axios'; // For making internal API requests

// create booking
const createBooking = asyncHandler(async (req, res) => {
    const { vehicle_company, vehicle_model, plate_number, car_color, slot_start_time, slot_end_time } = req.body;
    const parkingLotId = req.body.parkingLotId; 
    const user_id = req.user._id;

    if (!parkingLotId || !slot_start_time || !slot_end_time) {
        throw new ApiError(400, "Required fields missing for booking");
    }

    // Step 1: Check if the selected parking lot is still free
    const parkingLot = await ParkingLot.findOne({ _id: parkingLotId, isSlotBooked: false });
    if (!parkingLot) {
        throw new ApiError(404, "Parking lot is not available or already booked");
    }

    const startTime = new Date(slot_start_time);
    const endTime = new Date(slot_end_time);
    const durationInMinutes = (endTime - startTime) / 60000;
    const price = durationInMinutes * 0.5;

    // Step 3: Call internal API to make payment
    try {
        const paymentResponse = await axios.post('http://localhost:5000/api/payment', {
            amount: price,
            user_id
        });

        if (paymentResponse.data.success) {
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
})

//get existing booking list



//update booking




//delete booking






export { createBooking };
