import api from './api';

export const commentApi = {
  getTaskComments: async (taskId) => {
    const response = await api.get(`/comments/tasks/${taskId}`);
    return response.data;
  },

  addComment: async (taskId, content) => {
    const response = await api.post(`/comments/tasks/${taskId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },
};
