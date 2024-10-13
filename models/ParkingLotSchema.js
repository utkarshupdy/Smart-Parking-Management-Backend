import mongoose from 'mongoose';

const parkingLotSchema = new mongoose.Schema({
    isSlotBooked: {
        type: Boolean,
        default: false  
    },
    parking: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parking',
        required: true
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

export default mongoose.model('ParkingLot', parkingLotSchema);
