import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stripeToken: {
        type: String,
        required: true
    },
    cardBrand: {
        type: String,
        required: true
    },
    cardLast4: {
        type: String,
        required: true
    },
    expMonth: {
        type: Number,
        required: true
    },
    expYear: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
}, { timestamps: true });

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);
export default PaymentMethod;
