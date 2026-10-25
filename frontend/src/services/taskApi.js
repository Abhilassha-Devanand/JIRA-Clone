import api from './api';

export const taskApi = {
  getProjectTasks: async (projectId, params = {}) => {
    const query = new URLSearchParams({ projectId, ...params }).toString();
    const response = await api.get(`/tasks?${query}`);
    return response.data;
  },

  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  updateTask: async (id, updateData) => {
    const response = await api.put(`/tasks/${id}`, updateData);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  addDependency: async (id, data) => {
    const response = await api.post(`/tasks/${id}/dependencies`, data);
    return response.data;
  },

  removeDependency: async (id, depTaskId) => {
    const response = await api.delete(`/tasks/${id}/dependencies/${depTaskId}`);
    return response.data;
  },
};

