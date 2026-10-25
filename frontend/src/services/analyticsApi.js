import api from './api';

export const analyticsApi = {
  getProjectRisk: async (projectId) => {
    const response = await api.get(`/analytics/projects/${projectId}/risk`);
    return response.data;
  },

  getProjectWorkload: async (projectId) => {
    const response = await api.get(`/analytics/projects/${projectId}/workload`);
    return response.data;
  },

  recommendAssignee: async (projectId, effort = 4) => {
    const response = await api.get(`/analytics/projects/${projectId}/recommend-assignee?effort=${effort}`);
    return response.data;
  },

  getPrioritizedTasks: async (projectId) => {
    const response = await api.get(`/analytics/projects/${projectId}/prioritized-tasks`);
    return response.data;
  },

  getDependencyInsights: async (projectId) => {
    const response = await api.get(`/analytics/projects/${projectId}/dependency-insights`);
    return response.data;
  },

  getProjectSummary: async (projectId) => {
    const response = await api.get(`/analytics/projects/${projectId}/summary`);
    return response.data;
  },

  getWorkspaceOverview: async (workspaceId) => {
    const response = await api.get(`/analytics/workspaces/${workspaceId}/overview`);
    return response.data;
  },
};
