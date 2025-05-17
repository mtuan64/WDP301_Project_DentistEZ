const User = require("../../models/User");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.register = async (req, res, next) => {
  try {
    const {
      username,
      password,
      fullname,
      email,
      phone,
      address,
      dob,
      gender,
      roleid,
    } = req.body;

    // Kiểm tra xem email hoặc username đã tồn tại chưa
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).send({ msg: "Người dùng đã tồn tại!" });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const newUser = new User({
      username,
      password: hashedPassword,
      fullname,
      email,
      phone,
      address,
      dateOfBirth: dob,
      gender,
      roleid,
    });

    await newUser.save();

    res.status(201).send({
      id: newUser._id,
      username: newUser.username,
      fullname: newUser.fullname,
      email: newUser.email,
      phone: newUser.phone,
      address: newUser.address,
      dateOfBirth: newUser.dateOfBirth,
      gender: newUser.gender,
      roleid: newUser.roleid,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    console.log("Request body:", req.body);

    if (!username || !password) {
      return res.status(400).json({ msg: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." });
    }

    // Tìm người dùng theo username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ msg: "Người dùng không tồn tại." });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ msg: "Mật khẩu không đúng." });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.roleid }, // hoặc user.role nếu bạn dùng enum
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Trả về token và thông tin người dùng
    res.status(200).json({
      msg: "Đăng nhập thành công.",
      token,
      user: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        roleid: user.roleid,
      }
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    res.status(500).json({ msg: "Đã có lỗi xảy ra. Vui lòng thử lại sau." });
  }
};