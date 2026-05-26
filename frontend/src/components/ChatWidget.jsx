import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { 
  MessageSquare, 
  X, 
  Send, 
  ChevronLeft, 
  Circle, 
  User, 
  Paperclip, 
  FileText, 
  Maximize2, 
  Minimize2, 
  Loader2 
} from 'lucide-react';
import api from '../api/axios';

const ChatWidget = () => {
  const { user } = useAuthStore();
  const {
    client,
    connected,
    activeChannel,
    channels,
    isOpen,
    typingUsers,
    onlineUsers,
    setIsOpen,
    connectUser,
    disconnectUser,
    setActiveChannel,
    loadChannels
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleChatFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setIsUploadingAttachment(false);
      if (response.data.success) {
        setAttachment({
          url: response.data.url,
          name: response.data.fileName,
          type: response.data.fileType,
          size: response.data.fileSize
        });
      } else {
        setUploadError(response.data.message || 'Attachment upload failed.');
      }
    } catch (err) {
      setIsUploadingAttachment(false);
      console.error('Chat file upload failed:', err);
      setUploadError(err.response?.data?.message || 'Error uploading file.');
    }
  };

  // Connect user to Stream Chat once authenticated
  useEffect(() => {
    if (user) {
      connectUser(user);
    } else {
      disconnectUser();
    }
  }, [user]);

  // Load message history when active channel changes
  useEffect(() => {
    if (!activeChannel) {
      setMessages([]);
      return;
    }

    // Set initial message state
    setMessages(activeChannel.state.messages || []);

    // Listen to new messages within this specific channel
    const handleNewMessage = (event) => {
      setMessages((prev) => {
        // Prevent duplicate append
        if (prev.find((m) => m.id === event.message.id)) return prev;
        return [...prev, event.message];
      });
      // Scroll to bottom
      scrollToBottom();
    };

    const handleMessageRead = () => {
      // Reload message state to clear unread counts
      setMessages([...activeChannel.state.messages]);
    };

    activeChannel.on('message.new', handleNewMessage);
    activeChannel.on('message.read', handleMessageRead);

    // Initial scroll
    setTimeout(scrollToBottom, 100);

    return () => {
      activeChannel.off('message.new', handleNewMessage);
      activeChannel.off('message.read', handleMessageRead);
    };
  }, [activeChannel]);

  // Scroll message thread to the bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Trigger typing indicators on keypress
  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (activeChannel) {
      // Broadcast typing key stroke to channel
      activeChannel.keyStroke();

      // Clear any pending timeout
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      // Stop typing broadcast after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        // Stream Chat handles keystroke stops automatically
      }, 2000);
    }
  };

  // Dispatch message submit event
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachment) || !activeChannel) return;

    try {
      const textToSend = messageText;
      const attachmentsToSend = [];

      if (attachment) {
        attachmentsToSend.push({
          type: attachment.type.startsWith('image/') ? 'image' : 'file',
          asset_url: attachment.url,
          image_url: attachment.type.startsWith('image/') ? attachment.url : undefined,
          title: attachment.name,
          file_size: attachment.size
        });
      }

      setMessageText('');
      setAttachment(null); // Clear attachment slot

      await activeChannel.sendMessage({ 
        text: textToSend,
        attachments: attachmentsToSend
      });
      
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      console.error('Failed sending message:', error);
    }
  };

  // Helper to extract the other user details from channel object
  const getOtherMember = (channel) => {
    if (!client || !channel) return { name: 'Chat Member' };
    const members = Object.values(channel.state.members);
    const other = members.find((m) => m.user.id !== client.userID);
    return other ? other.user : { name: 'Chat Member' };
  };

  if (!user || !connected) return null;

  const currentTypingUser = activeChannel ? typingUsers[activeChannel.id] : null;

  return (
    <div className={`${isFullScreen ? 'fixed inset-0 z-[100] w-screen h-screen' : 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50'} font-sans transition-all duration-300`}>
      {/* COLLAPSED FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            loadChannels();
          }}
          className="flex items-center justify-center w-14 h-14 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all relative border border-slate-200 dark:border-slate-800"
        >
          <MessageSquare size={24} />
          {/* Unread channels indicator */}
          {channels.some((c) => c.state.unreadCount > 0) && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
              !
            </span>
          )}
        </button>
      )}

      {/* EXPANDED INTERACTIVE GLASSMORPHIC WINDOW */}
      {isOpen && (
        <div className={`${isFullScreen ? 'w-full h-full rounded-none' : 'w-[calc(100vw-32px)] sm:w-[420px] h-[550px] rounded-3xl'} bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col overflow-hidden animate-fade-in transition-all duration-300`}>
          
          {/* HEADER */}
          <div className="px-5 py-4 bg-slate-950 dark:bg-slate-950/80 text-white flex items-center justify-between border-b border-slate-800">
            {activeChannel ? (
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => {
                    setActiveChannel(null);
                    setAttachment(null);
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden font-black text-xs flex-shrink-0">
                  {getOtherMember(activeChannel).image ? (
                    <img src={getOtherMember(activeChannel).image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    getOtherMember(activeChannel).name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs leading-none truncate max-w-[150px]">
                    {getOtherMember(activeChannel).name}
                  </h4>
                  <div className="flex items-center gap-1 mt-1">
                    <Circle
                      size={8}
                      className={
                        getOtherMember(activeChannel).online || onlineUsers[getOtherMember(activeChannel).id]
                           ? 'fill-emerald-500 text-emerald-500'
                          : 'fill-slate-500 text-slate-500'
                      }
                    />
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {getOtherMember(activeChannel).online || onlineUsers[getOtherMember(activeChannel).id]
                        ? 'Online Now'
                        : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-amber-400" />
                <h4 className="font-black text-xs uppercase tracking-wider">System Messages</h4>
              </div>
            )}

            <div className="flex items-center gap-1">
              {/* Fullscreen Mode Button */}
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                title={isFullScreen ? "Exit full screen" : "Expand to full screen"}
              >
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsFullScreen(false);
                  setAttachment(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* CHAT CHANNELS LIST VIEW */}
          {!activeChannel && (
            <div className="flex-grow overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
              {channels.length > 0 ? (
                channels.map((channel) => {
                  const other = getOtherMember(channel);
                  const isUnread = channel.state.unreadCount > 0;
                  const lastMessage = channel.state.messages[channel.state.messages.length - 1];

                  return (
                    <div
                      key={channel.id}
                      onClick={() => setActiveChannel(channel)}
                      className={`p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isUnread ? 'bg-slate-50/50 dark:bg-slate-800/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden font-black text-sm text-slate-700 dark:text-slate-200">
                            {other.image ? (
                              <img src={other.image} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              other.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <Circle
                            size={9}
                            className={`absolute bottom-0 right-0 ${
                              other.online || onlineUsers[other.id]
                                ? 'fill-emerald-500 text-emerald-500'
                                : 'fill-slate-400 text-slate-400'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <h5 className={`text-xs truncate ${isUnread ? 'font-black text-slate-950 dark:text-white' : 'font-semibold'}`}>
                            {other.name}
                          </h5>
                          <p className={`text-xxs mt-0.5 truncate max-w-[200px] ${isUnread ? 'text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-400'}`}>
                            {lastMessage ? lastMessage.text : 'Click to start conversation'}
                          </p>
                        </div>
                      </div>

                      {isUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 px-6 space-y-3 text-slate-400">
                  <User className="mx-auto" size={32} />
                  <p className="text-xs">No active chat logs logged in your directory.</p>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE CHANNEL MESSAGE THREAD */}
          {activeChannel && (
            <>
              <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-950/40">
                {messages.map((msg, index) => {
                  const isMe = msg.user.id === client.userID;
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-tr-none'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {/* Rendering Rich Attachments (Images, Documents) */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-2 mb-1.5 max-w-sm">
                            {msg.attachments.map((att, attIdx) => {
                              const isImg = att.type === 'image' || att.mime_type?.startsWith('image/') || att.image_url;
                              if (isImg) {
                                return (
                                  <a 
                                    key={attIdx} 
                                    href={att.image_url || att.asset_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800 hover:scale-[1.01] transition-transform duration-200"
                                  >
                                    <img 
                                      src={att.image_url || att.asset_url} 
                                      alt={att.title || "Chat attachment"} 
                                      className="w-full max-h-56 object-cover"
                                    />
                                  </a>
                                );
                              } else {
                                return (
                                  <a 
                                    key={attIdx} 
                                    href={att.asset_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold transition-all"
                                  >
                                    <FileText size={18} className="text-amber-500 flex-shrink-0" />
                                    <div className="min-w-0 text-left">
                                      <div className="truncate text-[10px] max-w-[180px] font-bold">{att.title || "Shared Document"}</div>
                                      <div className="text-[8px] text-slate-400 mt-0.5">Click to view/download</div>
                                    </div>
                                  </a>
                                );
                              }
                            })}
                          </div>
                        )}
                        
                        {/* Rendering Message Text */}
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* TYPING INDICATOR STATUS POP */}
              {currentTypingUser && (
                <div className="px-5 py-1.5 bg-slate-50 dark:bg-slate-950/40 text-[10px] text-slate-400 font-semibold italic">
                  ✍ {currentTypingUser} is typing...
                </div>
              )}

              {/* ATTACHMENT PREVIEW TRAY */}
              {attachment && (
                <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs animate-slide-up">
                  <div className="flex items-center gap-2 min-w-0">
                    {attachment.type.startsWith('image/') ? (
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white flex-shrink-0 shadow-sm">
                        <img src={attachment.url} alt="Upload preview" className="w-full h-full object-cover animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <FileText size={18} className="text-amber-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="truncate font-semibold text-[10px] text-slate-700 dark:text-slate-200 block max-w-[200px]">
                        {attachment.name}
                      </span>
                      <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider mt-0.5">Ready to send</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 rounded-md transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* UPLOAD ERROR BANNER */}
              {uploadError && (
                <div className="px-4 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border-t border-rose-500/25">
                  ⚠️ {uploadError}
                </div>
              )}

              {/* MESSAGE TEXT ENTRY FIELD */}
              <form
                onSubmit={handleSendMessage}
                className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2"
              >
                {/* File Attachment Input Trigger */}
                <label className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors flex-shrink-0 relative flex items-center justify-center">
                  {isUploadingAttachment ? (
                    <Loader2 size={16} className="animate-spin text-amber-500" />
                  ) : (
                    <Paperclip size={16} />
                  )}
                  <input 
                    type="file" 
                    onChange={handleChatFileUpload} 
                    className="hidden" 
                    disabled={isUploadingAttachment}
                  />
                </label>

                <input
                  type="text"
                  placeholder="Draft dynamic response sequence..."
                  value={messageText}
                  onChange={handleInputChange}
                  className="flex-grow px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs outline-none focus:ring-1 focus:ring-amber-500/50 text-slate-800 dark:text-slate-100"
                />
                
                <button
                  type="submit"
                  disabled={!messageText.trim() && !attachment}
                  className="p-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
