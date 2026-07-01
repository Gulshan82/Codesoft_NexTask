import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Fetch single task details
export const useTaskDetails = (taskId) => {
  const queryClient = useQueryClient();

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${taskId}`);
      return data;
    },
    enabled: !!taskId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (updatedData) => {
      const { data } = await api.put(`/tasks/${taskId}`, updatedData);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['project', data.project] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (projectId) => {
      const { data } = await api.delete(`/tasks/${taskId}`);
      return { data, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentText) => {
      const { data } = await api.post('/comments', { taskId, text: commentText });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const { data } = await api.delete(`/comments/${commentId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });

  return {
    task: taskQuery.data,
    isLoading: taskQuery.isLoading,
    isError: taskQuery.isError,
    updateTask: updateTaskMutation.mutateAsync,
    isUpdating: updateTaskMutation.isPending,
    deleteTask: deleteTaskMutation.mutateAsync,
    isDeleting: deleteTaskMutation.isPending,
    addComment: addCommentMutation.mutateAsync,
    isCommenting: addCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutateAsync,
  };
};

// Create task inside a project
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: async (newTaskData) => {
      const { data } = await api.post('/tasks', newTaskData);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', data.project] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  return {
    createTask: createTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
  };
};
