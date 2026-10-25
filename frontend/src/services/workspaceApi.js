import api from './api';

export const workspaceApi = {
  getWorkspaces: async () => {
    const response = await api.get('/workspaces');
    return response.data;
  },

  getWorkspace: async (id) => {
    const response = await api.get(`/workspaces/${id}`);
    return response.data;
  },

  createWorkspace: async (data) => {
    const response = await api.post('/workspaces', data);
    return response.data;
  },

  updateWorkspace: async (id, data) => {
    const response = await api.put(`/workspaces/${id}`, data);
    return response.data;
  },

  deleteWorkspace: async (id) => {
    const response = await api.delete(`/workspaces/${id}`);
    return response.data;
  },

  addMember: async (workspaceId, memberData) => {
    const response = await api.post(`/workspaces/${workspaceId}/members`, memberData);
    return response.data;
  },

  removeMember: async (workspaceId, userId) => {
    const response = await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
    return response.data;
  },
};
