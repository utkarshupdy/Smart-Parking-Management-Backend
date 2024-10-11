import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    vehicle_company: {
        type: String,
        required: true,
    },
    vehicle_model: {
        type: String,
        required: true,
    },
    plate_number: {
        type: String,
        required: true,
    },
    car_color: {
        type: String,
        required: true,
    },
    confirm_booking: {
        type: String,
        required: true,
        enum: ['approved', 'rejected', 'pending'],
        default: 'pending',
    },
    parkinglot_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParkingLot', 
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    slot_start_time: {
        type: Date,
        required: true,
    },
    slot_end_time: {
        type: Date,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

export const Booking = mongoose.model('Booking', bookingSchema);
