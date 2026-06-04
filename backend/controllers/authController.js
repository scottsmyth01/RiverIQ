import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import transporter from '../config/nodemailer.js';

export const registerUser = async (req, res) => {
  // get fields from the request body
  const { name, email, password } = req.body;

  // if any fields aren't filled in then send a 400
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'All fields are required' });
  }

  // try to find user in the database with the supplied email
  try {
    const user = await User.findOne({ email });

    // if this user is already in the database, that is, their email already exists, send a 400
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists' });
    }

    // if new user - create a hased password based on the users password that was sent
    const hashedPassword = await bcrypt.hash(password, 10);

    // create a new user in the database
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // create a token and sign it using the users _.id field, coming from the new user database object
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // send cookie with the following settings
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // sending welcome email to user
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Welcome to RiverIQ!',
      text: 'Welcome to RiverIQ. Your account has been successfully created.',
    };

    try {
      // send email using nodemailer
      await transporter.sendMail(mailOptions);

      // if email fails, then we should get this message in the console.
    } catch (emailError) {
      console.error('Welcome email failed:', emailError.message);
    }
    // if the mail gets successfully sent then sent a 200 to the user
    return res.json({ success: true, message: 'Registration Successful' });

    // if there are any error then log them here
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  // get email and password from the request body
  const { email, password } = req.body;

  // if either field is not entered then return a 400
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'All fields are required' });
  }

  // Find user in the database using their email
  try {
    const user = await User.findOne({ email });

    // if user is not in the database then send a 400
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid credentials' });
    }

    // see if the password is correct via bcrypt compare function (compare hashed value)
    const pwMatch = await bcrypt.compare(password, user.password);

    // if the password doesn't match then send a 400
    if (!pwMatch) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid credentials' });
    }

    // if the user is legit then create a jwt token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // send cookie to the user with a value of the jwt token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // if all passes then send a 200 and login successful message
    return res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // clear cookie in the browser
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });
    // if cookie cleared then send a 200, else send error message
    return res.json({ success: true, message: 'Logout Successful' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// send verification OTP to the users email
export const sendOneTimeCode = async (req, res) => {
  try {
    // get user from database.
    // if user field 'accountVerified' is true then we skip this.
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (user.accountVerified) {
      return res.json({
        success: false,
        message: 'Account is already verified.',
      });
    }

    // generate one time password
    const OTP = String(Math.floor(100000 + Math.random() * 900000));
    user.oneTimeCode = OTP;
    user.oneTimeCodeExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // send one time password to the user
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Here is your one time password.',
      text: `Your one time password is ${OTP}. Verify your account using this code. `,
    };

    // send email
    await transporter.sendMail(mailOptions);

    // send success message
    res.json({ success: true, message: 'Verification code sent.' });

    // if any error occurs then send a 400 and error message
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.json({ success: false, message: 'Missing details' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ sucess: false, message: 'User not found' });
    }

    if (user.oneTimeCode === '' || user.oneTimeCode !== otp) {
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    if (user.oneTimeCodeExpiry < Date.now()) {
      return res.json({ success: false, message: 'OTP expired.' });
    }

    user.accountVerified = true;
    user.oneTimeCode = '';
    user.oneTimeCodeExpiry = 0;

    await user.save();
    return res.json({ sucess: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
