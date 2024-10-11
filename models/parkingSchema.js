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
    lots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLot' }]
});

export default mongoose.model("Parking", parkingSchema);

