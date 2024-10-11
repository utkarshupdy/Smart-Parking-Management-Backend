import mongoose , { Schema}from 'mongoose'

const paymentMethodSchema = new mongoose.Schema({
    cash: {
        type: Boolean,
        required: true
    },
    interac: {
        type: String,
    }
})


export default PaymentMethod =  mongoose.model("PaymentMethod", paymentMethodSchema)