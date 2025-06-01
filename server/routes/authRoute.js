const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authMiddleware2 = require('../middleware/auth')
const { registerUser, loginUser, uploadProfilePicture, updateUser, upload } = require('../controllers/authController');
const {getAllDoctors, getDoctorById} = require('../controllers/doctorController');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/doctor', getAllDoctors);
router.get('/doctor/:doctorId', getDoctorById);
router.post('/user/upload-profile-picture', authMiddleware2, upload.single('profilePicture'), uploadProfilePicture);
router.post('/user/update', authMiddleware2, updateUser);

module.exports = router;