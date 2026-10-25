import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { workspaceApi } from '../services/workspaceApi';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all user workspaces
  const fetchWorkspaces = useCallback(async (preferredId = null) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await workspaceApi.getWorkspaces();
      if (res.success && res.data?.workspaces) {
        const fetchedWorkspaces = res.data.workspaces;
        setWorkspaces(fetchedWorkspaces);

        if (fetchedWorkspaces.length > 0) {
          const targetId = preferredId || localStorage.getItem('activeWorkspaceId') || fetchedWorkspaces[0]._id;
          const matching = fetchedWorkspaces.find((w) => w._id === targetId) || fetchedWorkspaces[0];
          await fetchWorkspaceDetails(matching._id);
        } else {
          setCurrentWorkspace(null);
        }
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch single workspace details
  const fetchWorkspaceDetails = async (workspaceId) => {
    try {
      const res = await workspaceApi.getWorkspace(workspaceId);
      if (res.success && res.data?.workspace) {
        setCurrentWorkspace(res.data.workspace);
        localStorage.setItem('activeWorkspaceId', workspaceId);
      }
    } catch (err) {
      console.error('Failed to load workspace details:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
    }
  }, [isAuthenticated, fetchWorkspaces]);

  const switchWorkspace = async (workspaceId) => {
    setLoading(true);
    await fetchWorkspaceDetails(workspaceId);
    setLoading(false);
  };

  const createWorkspace = async ({ name, description }) => {
    const res = await workspaceApi.createWorkspace({ name, description });
    if (res.success && res.data?.workspace) {
      const newWs = res.data.workspace;
      await fetchWorkspaces(newWs._id);
      return newWs;
    }
    throw new Error(res.message || 'Failed to create workspace');
  };

  const updateWorkspace = async ({ name, description }) => {
    if (!currentWorkspace) return;
    const res = await workspaceApi.updateWorkspace(currentWorkspace._id, { name, description });
    if (res.success && res.data?.workspace) {
      await fetchWorkspaceDetails(currentWorkspace._id);
      setWorkspaces((prev) =>
        prev.map((w) => (w._id === currentWorkspace._id ? { ...w, name, description } : w))
      );
      return res.data.workspace;
    }
    throw new Error(res.message || 'Failed to update workspace');
  };

  const deleteWorkspace = async (workspaceId) => {
    const res = await workspaceApi.deleteWorkspace(workspaceId);
    if (res.success) {
      localStorage.removeItem('activeWorkspaceId');
      await fetchWorkspaces();
      return true;
    }
    throw new Error(res.message || 'Failed to delete workspace');
  };

  const inviteMember = async ({ email, role }) => {
    if (!currentWorkspace) return;
    const res = await workspaceApi.addMember(currentWorkspace._id, { email, role });
    if (res.success && res.data?.workspace) {
      await fetchWorkspaceDetails(currentWorkspace._id);
      return res.data.workspace;
    }
    throw new Error(res.message || 'Failed to invite member');
  };

  const removeMember = async (targetUserId) => {
    if (!currentWorkspace) return;
    const res = await workspaceApi.removeMember(currentWorkspace._id, targetUserId);
    if (res.success && res.data?.workspace) {
      await fetchWorkspaceDetails(currentWorkspace._id);
      return res.data.workspace;
    }
    throw new Error(res.message || 'Failed to remove member');
  };

  // Determine if logged-in user is admin of current workspace
  const isAdmin = Boolean(
    user &&
    currentWorkspace &&
    (currentWorkspace.owner?._id === user._id ||
      currentWorkspace.owner === user._id ||
      currentWorkspace.currentUserRole === 'Workspace Admin' ||
      currentWorkspace.members?.some(
        (m) => (m.user?._id || m.user) === user._id && m.role === 'Workspace Admin'
      ))
  );

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        loading,
        error,
        isAdmin,
        switchWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        inviteMember,
        removeMember,
        refreshWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
