import { fetchAuditLogsFromDatabase } from './audit.service.js';

export const auditController = {
  getAuditLogs: async (req, res) => {
    try {
      // Fetch audit logs from the database
      const logs = await fetchAuditLogsFromDatabase();
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};

// Mock function to simulate fetching audit logs from a database
async function fetchAuditLogsFromDatabase() {
  return [
    { id: 1, action: 'User deleted task', timestamp: '2024-06-01T12:00:00Z' },
    { id: 2, action: 'User changed role', timestamp: '2024-06-02T15:30:00Z' },
  ];
}