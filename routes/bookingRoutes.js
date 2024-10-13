import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import {
    createBooking,
    getExistingBookingList,
    deleteAllBookings,
    deleteIndividualBooking,
    updateBooking
} from "../controllers/booking.js"

const router = Router()

router.route("/create-booking").post(verifyJWT , createBooking )


router.route("/get-existing-booking-list").post(verifyJWT , getExistingBookingList)


router.route("/delete-all-bookings").post(verifyJWT , deleteAllBookings )


router.route("/delete-individual-booking").post(verifyJWT , deleteIndividualBooking)


router.route("/update-booking").post(verifyJWT , updateBooking)



export default router;

