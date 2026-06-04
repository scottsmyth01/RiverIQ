import User from '../models/userModel.js';

const successMsg = (message) => {
  return { success: true, message: message };
};
const errorMsg = (message) => {
  return { success: false, message: message };
};

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.json(errorMsg('User not found'));
    }

    res.json({
      success: true,
      userData: {
        name: user.name,
        accountVerified: user.accountVerified,
      },
    });
  } catch (error) {
    return res.json(errorMsg(error.message));
  }
};
