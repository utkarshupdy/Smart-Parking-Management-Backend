import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import {registerUser,
    userList,
    login,
    logoutUser ,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails
} from "../controllers/user.js"

const router = Router()


// router.route("/**** ").post(verifyJWT, *****) DO ROUTING LIKE THAT
//USER ROUTER WORK DONE
router.route("/register").post(registerUser)

router.route("/login").post(login)

router.route("/logout").post(verifyJWT , logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT , changeCurrentPassword)

router.route("/current-user").get(verifyJWT , getCurrentUser)

router.route("/all-user-list").get(userList)

router.route("/update-account").patch(verifyJWT , updateAccountDetails)


export default router
