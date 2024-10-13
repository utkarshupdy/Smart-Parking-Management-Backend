import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import {
    createParking ,
    bookParkingLot,
    updateParking,
    getCurrentParkingList,
    deleteParking
 } from "../controllers/parking.js"

const router = Router()


// router.route("/**** ").post(verifyJWT, *****) DO ROUTING LIKE THAT
//USER ROUTER WORK DONE
router.route("/create-parking").post(verifyJWT , createParking)

router.route("/book-parking-lot").post(verifyJWT , bookParkingLot)

router.route("/update-parking").post(verifyJWT , updateParking)

router.route("/get-current-parking-list").post(verifyJWT , getCurrentParkingList)

router.route("/delete-parking").post(verifyJWT , deleteParking)

export default router