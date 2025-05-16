const User = require("../../models/User");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (user.password !== password) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    res.json({
      msg: "Login successful",
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.register = async (req, res) => {
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

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new User({
      username,
      password,
      fullname,
      email,
      phone,
      address,
      dob,
      gender,
      roleid,
    });

    await user.save();

    res.json({
      msg: "User registered successfully",
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
