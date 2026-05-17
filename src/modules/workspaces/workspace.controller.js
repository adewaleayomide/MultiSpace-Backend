import { workspaceService } from './workspace.service.js';

export const workspaceController = {
  // Create a new workspace
  createWorkspace: async (req, res) => {
    try {
      const { name, description } = req.body;
      const userId = req.user.id; // Assuming user ID is available in the request object

      // Call the service layer to create a workspace
      const workspace = await workspaceService.createWorkspace({
        name,
        description,
        ownerId: userId,
      });

      res.status(201).json(workspace);
    } catch (error) {
      console.error('Error creating workspace:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get all workspaces for the authenticated user
  getUserWorkspaces: async (req, res) => {
    try {
      const userId = req.user.id; // Assuming user ID is available in the request object

      // Call the service layer to get workspaces for the user
      const workspaces = await workspaceService.getUserWorkspaces(userId);

      res.status(200).json(workspaces);
    } catch (error) {
      console.error('Error fetching user workspaces:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get details of a specific workspace
  getWorkspaceById: async (req, res) => {
    try {
      const workspaceId = req.params.id;
      const userId = req.user.id; // Assuming user ID is available in the request object

      // Call the service layer to get workspace details
      const workspace = await workspaceService.getWorkspaceById(workspaceId, userId);

      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found' });
      }

      res.status(200).json(workspace);
    } catch (error) {
      console.error('Error fetching workspace details:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Update workspace information
  updateWorkspace: async (req, res) => {
    try {
      const workspaceId = req.params.id;
      const { name, description } = req.body;
      const userId = req.user.id; // Assuming user ID is available in the request object

      // Call the service layer to update workspace information
      const updatedWorkspace = await workspaceService.updateWorkspace(workspaceId, {
        name,
        description,
        userId,
      });

      if (!updatedWorkspace) {
        return res.status(404).json({ message: 'Workspace not found or unauthorized' });
      }

      res.status(200).json(updatedWorkspace);
    } catch (error) {
      console.error('Error updating workspace:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Delete a workspace
  deleteWorkspace: async (req, res) => {
    try {
      const workspaceId = req.params.id;
      const userId = req.user.id; // Assuming user ID is available in the request object

      // Call the service layer to delete the workspace
      const deleted = await workspaceService.deleteWorkspace(workspaceId, userId);

      if (!deleted) {
        return res.status(404).json({ message: 'Workspace not found or unauthorized' });
      }

      res.status(200).json({ message: 'Workspace deleted successfully' });
    } catch (error) {
      console.error('Error deleting workspace:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};
