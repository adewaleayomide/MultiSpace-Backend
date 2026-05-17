

export const notificationController = {
    getNotifications: async (req, res) => {
        try {
            const userId = req.user.id;
            // Fetch notifications for the user from the database
            const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
            res.json(notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const { notificationIds } = req.body;
            const userId = req.user.id;

            // Mark specified notifications as read in the database
            await Notification.updateMany(
                { _id: { $in: notificationIds }, userId },
                { $set: { read: true } }
            );

            res.json({ message: 'Notifications marked as read' });
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
};