import mongoose , { Schema}from 'mongoose'

const reviewSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        required: true,
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})


export default Review = mongoose.model("Review", reviewSchema)