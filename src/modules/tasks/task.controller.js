export const taskController = {
  // Create a new task
  createTask: async (req, res) => {
    try {
      const { title, description, status, workspaceId } = req.body;
      const userId = req.user.id; // Assuming user ID is available in the request object

      // Implement logic to create a task in the database
      const task = await Task.create({
        title,
        description,
        status,
        workspaceId,
        ownerId: userId,
      });

      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create task.' });
    }
  },

  // Get all tasks for a user
  getUserTasks: async (req, res) => {
    try {
      const userId = req.user.id; // Assuming user ID is available in the request object

      // Implement logic to retrieve tasks for the user from the database
      const tasks = await Task.find({ ownerId: userId });
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve tasks.' });
    }
  },

  // Get details of a specific task
  getTaskById: async (req, res) => {
    try {
      const taskId = req.params.id;
      const userId = req.user.id; // Assuming user ID is available in the request object

      // Implement logic to retrieve a specific task by ID and ensure it belongs to the user
      const task = await Task.findOne({ _id: taskId, ownerId: userId });

      if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      res.status(200).json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve task.' });
    }
  },

  // Update task information
  updateTask: async (req, res) => {
    try {
      const taskId = req.params.id;
      const { title, description, status } = req.body;
      const userId = req.user.id; // Assuming user ID is available in the request object

      // Implement logic to update task information in the database
      const updatedTask = await Task.findOneAndUpdate(
        { _id: taskId, ownerId: userId },
        { title, description, status },
        { new: true }
      );

      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      res.status(200).json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update task.' });
    }
  },

  // Delete a task
  deleteTask: async (req, res) => {
    try {
      const taskId = req.params.id;
      const userId = req.user.id; // Assuming user ID is available in the request object

      // Implement logic to delete a task from the database
      const deletedTask = await Task.findOneAndDelete({ _id: taskId, ownerId: userId });

      if (!deletedTask) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      res.status(200).json({ message: 'Task deleted successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete task.' });
    }
  },
};