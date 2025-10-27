import axios from "axios";

export const chatService = {
  updateChat: async (chatId, updates) => {
    try {
      // Ensure title is updated when question changes
      if (updates.question) {
        const title = updates.question.length > 50 ? updates.question.trim().substring(0, 50) + "..." : updates.question.trim();
        updates.title = title;
      }
      const { data } = await axios.patch(`/api/chats/${chatId}`, updates);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update chat');
    }
  },

  deleteChat: async (chatId) => {
    try {
      const { data } = await axios.delete(`/api/chats/${chatId}`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete chat');
    }
  }
};
