import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import transporter from '../config/nodemailer.js';

const successMsg = (message) => {
  return { success: true, message: message };
};

const errorMsg = (message) => {
  return { success: false, message: message };
};

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const registerUser = async (req, res) => {
  // get fields from the request body
  const { name, email, password } = req.body;

  // if any fields aren't filled in then send a 400
  if (!name || !email || !password) {
    return res.status(400).json(errorMsg('All fields are required'));
  }

  // try to find user in the database with the supplied email
  try {
    const user = await User.findOne({ email });

    // if this user is already in the database, that is, their email already exists, send a 400
    if (user) {
      return res.status(400).json(errorMsg('User already exists'));
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
    const token = createToken(newUser._id);

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
    } catch (error) {
      res.json(errorMsg(error.message));
    }
    // if the mail gets successfully sent then sent a 200 to the user
    return res.json(successMsg('Registration Successful'));

    // if there are any error then log them here
  } catch (error) {
    res.json(errorMsg(error.message));
  }
};

export const login = async (req, res) => {
  // get email and password from the request body
  const { email, password } = req.body;

  // if either field is not entered then return a 400
  if (!email || !password) {
    return res.status(400).json(errorMsg('All fields are required'));
  }

  // Find user in the database using their email
  try {
    const user = await User.findOne({ email });

    // if user is not in the database then send a 400
    if (!user) {
      return res.status(400).json(errorMsg('Invalid credentials'));
    }

    // see if the password is correct via bcrypt compare function (compare hashed value)
    const pwMatch = await bcrypt.compare(password, user.password);

    // if the password doesn't match then send a 400
    if (!pwMatch) {
      return res.status(400).json(errorMsg('Invalid credentials'));
    }

    // if the user is legit then create a jwt token
    const token = createToken(user._id);

    // send cookie to the user with a value of the jwt token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // if all passes then send a 200 and login successful message
    return res.json(successMsg('Login successful'));
  } catch (error) {
    res.json(errorMsg(error.message));
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

    if (!userId) {
      return res.json(errorMsg('Missing user ID'));
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (user.accountVerified) {
      return res.json(errorMsg('Account is already verified.'));
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
      text: `Your one time code is ${OTP}. Verify your account using this code. `,
    };

    // send email
    await transporter.sendMail(mailOptions);

    // send success message
    res.json(successMsg('Verification code sent.'));

    // if any error occurs then send a 400 and error message
  } catch (error) {
    res.json(errorMsg(error.message));
  }
};

// verify the users email
export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.json(errorMsg('Missing details'));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.json(errorMsg('User not found'));
    }

    if (user.oneTimeCode === '' || user.oneTimeCode !== otp) {
      return res.json(errorMsg('Invalid OTP'));
    }

    if (user.oneTimeCodeExpiry < Date.now()) {
      return res.json(errorMsg('OTP expired.'));
    }

    user.accountVerified = true;
    user.oneTimeCode = '';
    user.oneTimeCodeExpiry = 0;

    await user.save();
    return res.json(successMsg('Email verified successfully'));
  } catch (error) {
    return res.json(errorMsg(error.message));
  }
};

// check if user is authenticated
export const isAuthenticated = async (req, res) => {
  try {
    return res.json(successMsg('Successfully authenticated'));
  } catch (error) {
    res.json(errorMsg(error.message));
  }
};

// send password reset one time code
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json(errorMsg('Email is required'));
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json(errorMsg('User not found'));
    }

    const OTP = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = OTP;
    user.resetOtpExpiredAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    // send one time password to the user
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Password Reset One Time Code',
      text: `Your one time password for resetting your password is ${OTP}. Use this code to proceed with resetting your password.`,
    };
    await transporter.sendMail(mailOptions);
    return res.json(successMsg('One time password sent to email'));
  } catch (error) {
    return res.json(errorMsg(error.message));
  }
};

// Reset user password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    res.json(errorMsg("'Email, OTP, and new password are required'"));
  }
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json(errorMsg('User not found'));
    }
    if (user.resetOtp === '' || user.resetOtp !== otp) {
      return res.json(errorMsg('Invalid OTP'));
    }
    if (user.resetOtpExpiredAt < Date.now()) {
      return res.json(errorMsg('OTP Expired'));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpiredAt = 0;
    await user.save();

    return res.json(successMsg('Password has been reset successfully'));
  } catch (error) {
    res.json(errorMsg(error.message));
  }
};
