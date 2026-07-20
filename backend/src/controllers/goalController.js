import Goal from '../models/Goal.js';

function getGoalPayload(body = {}) {
  return {
    title: body.title,
    description: body.description,
    category: body.category,
    target: body.target,
    current: body.current,
    progress: body.progress,
    status: body.status,
    dueDate: body.dueDate || null,
    completedAt: body.status === 'Completed' ? body.completedAt || new Date() : null,
  };
}

export const getGoals = async (req, res, next) => {
  // get userId from protect middleware
  // get all sessions that have that userId and return to frontend
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ goals });
  } catch (error) {
    return next(error);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const goal = await Goal.create({
      user: req.user._id,
      ...getGoalPayload(req.body),
    });

    return res.status(201).json({ goal });
  } catch (error) {
    return next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        ...getGoalPayload(req.body),
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    return res.status(200).json({ goal });
  } catch (error) {
    return next(error);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    return res.status(200).json({
      message: 'Goal deleted',
      id: req.params.id,
    });
  } catch (error) {
    return next(error);
  }
};
