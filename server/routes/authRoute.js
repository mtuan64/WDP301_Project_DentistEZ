const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { registerUser, loginUser, uploadProfilePicture, updateUser, upload } = require('../controllers/authController');
const {getAllDoctors, getDoctorById} = require('../controllers/doctorController');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/doctor', getAllDoctors);
router.get('/doctor/:doctorId', getDoctorById);
router.post('/user/upload-profile-picture', authMiddleware, upload.single('profilePicture'), uploadProfilePicture);
router.post('/user/update', authMiddleware, updateUser);

module.exports = router;