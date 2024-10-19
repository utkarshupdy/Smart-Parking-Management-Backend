// import { required } from 'joi';
// import { required } from 'joi';
import mongoose from 'mongoose';

const parkingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    lat: {
        type: String,
        required: true
    },
    long: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    user: {  // Owner who created the parking location
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lots: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ParkingLot'  // Array of parking lots related to this parking location
    }]
    ,
    ip:[{
        type: String,
        required: true
    }]
});

export default mongoose.model('Parking', parkingSchema);
