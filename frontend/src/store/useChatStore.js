import { create } from 'zustand';
import { StreamChat } from 'stream-chat';
import api from '../api/axios';
import { useAuthStore } from './useAuthStore';

export const useChatStore = create((set, get) => ({
  client: null,
  connected: false,
  activeChannel: null,
  channels: [],
  isOpen: false,
  typingUsers: {},
  onlineUsers: {},

  // Set chat panel open state
  setIsOpen: (isOpen) => set({ isOpen }),

  // Initialize and connect user to Stream Chat
  connectUser: async (user, token) => {
    if (get().client && get().connected) return;

    try {
      // Fetch stream token from backend
      const response = await api.get('/api/auth/stream-token');
      const { token: streamToken, apiKey, userId } = response.data;

      const chatClient = StreamChat.getInstance(apiKey);

      // Connect the user to the stream client
      await chatClient.connectUser(
        {
          id: userId,
          name: user.name,
          image: user.role === 'worker' ? user.workerProfile?.profileImageUrl : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
        },
        streamToken
      );

      set({ client: chatClient, connected: true });

      // Start listening to global events (presence, typing, messages)
      get().setupEventListeners(chatClient);

      // Load initial channels list
      await get().loadChannels();
    } catch (error) {
      console.error('Failed connecting to Stream Chat:', error);
    }
  },

  // Disconnect from Stream Chat
  disconnectUser: async () => {
    const { client } = get();
    if (client) {
      try {
        await client.disconnectUser();
      } catch (err) {
        console.error('Failed to disconnect stream chat:', err);
      }
    }
    set({ client: null, connected: false, activeChannel: null, channels: [] });
  },

  // Load list of channels for the logged-in user
  loadChannels: async () => {
    const { client } = get();
    if (!client) return;

    try {
      const filter = { members: { $in: [client.userID] } };
      const sort = [{ last_message_at: -1 }];
      const options = { watch: true, state: true };

      const userChannels = await client.queryChannels(filter, sort, options);
      set({ channels: userChannels });
    } catch (error) {
      console.error('Failed loading channels:', error);
    }
  },

  // Set the current channel for chat and mark messages as read
  setActiveChannel: async (channel) => {
    if (channel) {
      await channel.markRead();
    }
    set({ activeChannel: channel });
  },

  // Setup 1-to-1 conversation with another user
  createOrGetChannel: async (otherUserId, otherUserName) => {
    let { client } = get();
    if (!client) {
      const user = useAuthStore.getState().user;
      if (user) {
        await get().connectUser(user);
        client = get().client;
      }
    }

    if (!client) {
      console.error('Chat client is not connected!');
      return;
    }

    try {
      // 1-to-1 private channel ID structure: member1-member2 sorted alphabetically to prevent duplicates
      const members = [client.userID, otherUserId].sort();
      const channelId = `chat-${members[0]}-${members[1]}`;

      const channel = client.channel('messaging', channelId, {
        members,
        name: `Chat with ${otherUserName}`,
      });

      await channel.create();
      await channel.watch();

      // Refresh channels list
      await get().loadChannels();

      // Open chat UI and active this channel
      set({ activeChannel: channel, isOpen: true });
    } catch (error) {
      console.error('Failed to instantiate chat channel:', error);
    }
  },

  // Listen to presence updates, typing, and message events
  setupEventListeners: (chatClient) => {
    if (!chatClient) return;

    // Listen to user online/offline presence changes
    chatClient.on('user.presence.changed', (event) => {
      const { user } = event;
      if (user) {
        set((state) => ({
          onlineUsers: {
            ...state.onlineUsers,
            [user.id]: user.online,
          },
        }));
      }
    });

    // Listen to typing events
    chatClient.on('typing.start', (event) => {
      if (event.user && event.user.id !== chatClient.userID) {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [event.channel_id]: event.user.name,
          },
        }));
      }
    });

    chatClient.on('typing.stop', (event) => {
      if (event.user) {
        set((state) => {
          const updatedTyping = { ...state.typingUsers };
          delete updatedTyping[event.channel_id];
          return { typingUsers: updatedTyping };
        });
      }
    });

    // Listen to new message events to reload channel feeds dynamically
    chatClient.on('message.new', () => {
      get().loadChannels();
    });
  },
}));
