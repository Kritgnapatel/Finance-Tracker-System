const SavingsGoal = require("./savingsGoal.model");

exports.addSavingsGoal = async (req, res, next) => {
    try {
        const { title, targetAmount, currentAmount, deadline, color } = req.body;
        const newGoal = await SavingsGoal.create({
            userId: req.user.id,
            title,
            targetAmount,
            currentAmount: currentAmount || 0,
            deadline: deadline || null,
            color: color || "#3b82f6"
        });
        res.status(201).json(newGoal);
    } catch (error) {
        next(error);
    }
};

exports.getSavingsGoals = async (req, res, next) => {
    try {
        const goals = await SavingsGoal.findAll({
            where: { userId: req.user.id }
        });
        res.json(goals);
    } catch (error) {
        next(error);
    }
};

exports.updateSavingsGoal = async (req, res, next) => {
    try {
        const { currentAmount } = req.body;
        const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!goal) return res.status(404).json({ message: "Goal not found" });

        goal.currentAmount = currentAmount;
        await goal.save();

        res.json(goal);
    } catch (error) {
        next(error);
    }
};

exports.deleteSavingsGoal = async (req, res, next) => {
    try {
        const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!goal) return res.status(404).json({ message: "Goal not found" });
        await goal.destroy();
        res.json({ message: "Goal removed" });
    } catch (error) {
        next(error);
    }
};
