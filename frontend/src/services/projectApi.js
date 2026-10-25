import api from './api';

export const projectApi = {
  getWorkspaceProjects: async (workspaceId) => {
    const response = await api.get(`/projects?workspaceId=${workspaceId}`);
    return response.data;
  },

  getProject: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  updateProject: async (id, updateData) => {
    const response = await api.put(`/projects/${id}`, updateData);
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  addMember: async (projectId, memberData) => {
    const response = await api.post(`/projects/${projectId}/members`, memberData);
    return response.data;
  },

  removeMember: async (projectId, memberId) => {
    const response = await api.delete(`/projects/${projectId}/members/${memberId}`);
    return response.data;
  },
};
