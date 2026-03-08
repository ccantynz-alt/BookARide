import React, { useState, useEffect, useCallback } from 'react';
import { Facebook, Send, Calendar, MessageSquare, TrendingUp, Settings, Link2, Unlink, RefreshCw, Trash2, ExternalLink, Clock, Users, Eye, ThumbsUp, MessageCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '../../config/api';

export default function FacebookTab({ getAuthHeaders, handleLogout }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [insights, setInsights] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [postMessage, setPostMessage] = useState('');
  const [postLink, setPostLink] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [posting, setPosting] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/facebook/status`, getAuthHeaders());
      setStatus(res.data);
    } catch (err) {
      if (err.response?.status === 401) { handleLogout(); return; }
      setStatus({ connected: false, configured: false });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleLogout]);

  const fetchPosts = useCallback(async () => {
    if (!status?.connected) return;
    setLoadingPosts(true);
    try {
      const res = await axios.get(`${API}/facebook/posts`, getAuthHeaders());
      setPosts(res.data.posts || []);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoadingPosts(false);
    }
  }, [status, getAuthHeaders, handleLogout]);

  const fetchMessages = useCallback(async () => {
    if (!status?.connected) return;
    setLoadingMessages(true);
    try {
      const res = await axios.get(`${API}/facebook/messages`, getAuthHeaders());
      setMessages(res.data.messages || []);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoadingMessages(false);
    }
  }, [status, getAuthHeaders, handleLogout]);

  const fetchInsights = useCallback(async () => {
    if (!status?.connected) return;
    try {
      const res = await axios.get(`${API}/facebook/insights`, getAuthHeaders());
      setInsights(res.data.insights || []);
    } catch (err) {
      // Insights may fail for new pages
    }
  }, [status, getAuthHeaders]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    if (status?.connected) {
      fetchPosts();
      fetchMessages();
      fetchInsights();
    }
  }, [status?.connected, fetchPosts, fetchMessages, fetchInsights]);

  const handleConnect = async () => {
    try {
      const res = await axios.get(`${API}/facebook/oauth-url`, getAuthHeaders());
      window.location.href = res.data.url;
    } catch (err) {
      if (err.response?.status === 401) { handleLogout(); return; }
      toast.error(err.response?.data?.detail || 'Failed to start Facebook connection');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your Facebook page? Auto-replies will stop.')) return;
    try {
      await axios.post(`${API}/facebook/disconnect`, {}, getAuthHeaders());
      toast.success('Facebook page disconnected');
      setStatus({ connected: false, configured: true });
      setPosts([]);
      setMessages([]);
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const handleToggleAutoReply = async () => {
    try {
      const res = await axios.post(`${API}/facebook/toggle-auto-reply`, {}, getAuthHeaders());
      setStatus(prev => ({ ...prev, auto_reply_enabled: res.data.auto_reply_enabled }));
      toast.success(`Auto-reply ${res.data.auto_reply_enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Failed to toggle auto-reply');
    }
  };

  const handleCreatePost = async () => {
    if (!postMessage.trim()) { toast.error('Enter a message for your post'); return; }
    setPosting(true);
    try {
      let scheduled_time = null;
      if (scheduleDate) {
        scheduled_time = Math.floor(new Date(scheduleDate).getTime() / 1000);
        // Must be at least 10 min in the future
        if (scheduled_time < Date.now() / 1000 + 600) {
          toast.error('Scheduled time must be at least 10 minutes in the future');
          setPosting(false);
          return;
        }
      }
      const res = await axios.post(`${API}/facebook/posts`, {
        message: postMessage,
        link: postLink || null,
        scheduled_time,
      }, getAuthHeaders());
      toast.success(res.data.message);
      setPostMessage('');
      setPostLink('');
      setScheduleDate('');
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post from your Facebook page?')) return;
    try {
      await axios.delete(`${API}/facebook/posts/${postId}`, getAuthHeaders());
      toast.success('Post deleted');
      fetchPosts();
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
        <span>Loading Facebook integration...</span>
      </div>
    );
  }

  // Not connected — show connection UI
  if (!status?.connected) {
    return (
      <div className="space-y-6">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Facebook className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Your Facebook Business Page</h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Manage your Facebook page directly from your admin dashboard. Auto-reply to Messenger messages,
              create and schedule posts, and monitor page analytics — all in one place.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto text-left">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <MessageSquare className="w-6 h-6 text-blue-500 mb-2" />
                <h3 className="font-semibold text-sm">Messenger Auto-Reply</h3>
                <p className="text-xs text-gray-500">Instantly respond to customer inquiries with booking links</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <Send className="w-6 h-6 text-green-500 mb-2" />
                <h3 className="font-semibold text-sm">Post & Schedule</h3>
                <p className="text-xs text-gray-500">Create posts and schedule them directly from here</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <TrendingUp className="w-6 h-6 text-purple-500 mb-2" />
                <h3 className="font-semibold text-sm">Page Insights</h3>
                <p className="text-xs text-gray-500">Track page reach, engagement, and follower growth</p>
              </div>
            </div>
            {!status?.configured ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg mx-auto">
                <p className="text-yellow-800 text-sm font-medium">Facebook App credentials not configured</p>
                <p className="text-yellow-700 text-xs mt-1">Set <code>FACEBOOK_APP_ID</code> and <code>FACEBOOK_APP_SECRET</code> environment variables to enable this feature.</p>
              </div>
            ) : (
              <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                <Facebook className="w-5 h-5 mr-2" />
                Connect Facebook Page
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connected — show management dashboard
  const sections = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'posts', label: 'Posts', icon: Send },
    { id: 'messenger', label: 'Messenger', icon: MessageSquare },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-4">
      {/* Connected Page Header */}
      <Card className="border-blue-200">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {status.page_picture ? (
              <img src={status.page_picture} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Facebook className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm">{status.page_name}</h3>
              <p className="text-xs text-gray-500">{status.page_category} &middot; Connected {status.connected_at ? new Date(status.connected_at).toLocaleDateString() : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Connected
            </span>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status.auto_reply_enabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              <MessageSquare className="w-3 h-3" /> Auto-reply {status.auto_reply_enabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === s.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <s.icon className="w-4 h-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {insights.length > 0 ? insights.map((metric, i) => (
              <Card key={i}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">{metric.title || metric.name}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {metric.values?.[0]?.value ?? '-'}
                  </p>
                </CardContent>
              </Card>
            )) : (
              <>
                <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 mb-1">Page Impressions</p><p className="text-2xl font-bold text-blue-600">-</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 mb-1">Engaged Users</p><p className="text-2xl font-bold text-green-600">-</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 mb-1">Page Fans</p><p className="text-2xl font-bold text-purple-600">-</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 mb-1">Page Views</p><p className="text-2xl font-bold text-orange-600">-</p></CardContent></Card>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-500" /> Recent Posts
                </h3>
                {posts.length === 0 ? (
                  <p className="text-gray-400 text-sm">No posts yet</p>
                ) : posts.slice(0, 5).map((post, i) => (
                  <div key={i} className="border-b last:border-0 py-2">
                    <p className="text-sm line-clamp-2">{post.message || '(No text)'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span><ThumbsUp className="w-3 h-3 inline" /> {post.likes?.summary?.total_count || 0}</span>
                      <span><MessageCircle className="w-3 h-3 inline" /> {post.comments?.summary?.total_count || 0}</span>
                      <span>{new Date(post.created_time).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" /> Recent Messages
                </h3>
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-sm">No messages yet</p>
                ) : messages.filter(m => m.direction === 'incoming').slice(0, 5).map((msg, i) => (
                  <div key={i} className="border-b last:border-0 py-2">
                    <p className="text-xs font-medium">{msg.sender_name}</p>
                    <p className="text-sm line-clamp-1">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(msg.received_at).toLocaleString()}
                      {msg.auto_replied && <span className="ml-2 text-green-600">Auto-replied</span>}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Posts */}
      {activeSection === 'posts' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Send className="w-4 h-4" /> Create Post
              </h3>
              <Textarea
                placeholder="What's on your mind? Write your Facebook post here..."
                value={postMessage}
                onChange={e => setPostMessage(e.target.value)}
                rows={4}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Link URL (optional)"
                  value={postLink}
                  onChange={e => setPostLink(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <Input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    placeholder="Schedule (optional)"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {scheduleDate ? `Will be scheduled for ${new Date(scheduleDate).toLocaleString()}` : 'Will publish immediately'}
                </p>
                <Button onClick={handleCreatePost} disabled={posting} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {posting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  {scheduleDate ? 'Schedule Post' : 'Publish Post'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Page Posts</h3>
                <Button variant="outline" size="sm" onClick={fetchPosts} disabled={loadingPosts}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${loadingPosts ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
              {posts.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No posts found</p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post, i) => (
                    <div key={i} className="border rounded-lg p-3 flex gap-3">
                      {post.full_picture && (
                        <img src={post.full_picture} alt="" className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{post.message || '(Shared content)'}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span><ThumbsUp className="w-3 h-3 inline" /> {post.likes?.summary?.total_count || 0}</span>
                          <span><MessageCircle className="w-3 h-3 inline" /> {post.comments?.summary?.total_count || 0}</span>
                          <span>{new Date(post.created_time).toLocaleString()}</span>
                          {!post.is_published && <span className="text-orange-500"><Clock className="w-3 h-3 inline" /> Scheduled</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {post.permalink_url && (
                          <a href={post.permalink_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleDeletePost(post.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messenger */}
      {activeSection === 'messenger' && (
        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Messenger Auto-Reply</h3>
                <p className="text-xs text-gray-600">Automatically respond to customer messages with booking information</p>
              </div>
              <button onClick={handleToggleAutoReply} className="flex items-center gap-2">
                {status.auto_reply_enabled ? (
                  <ToggleRight className="w-10 h-10 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-400" />
                )}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Message Log</h3>
                <Button variant="outline" size="sm" onClick={fetchMessages} disabled={loadingMessages}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${loadingMessages ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
              {messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No messages yet. Messages will appear here once customers contact you via Messenger.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        msg.direction === 'outgoing'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className={`text-xs font-medium mb-1 ${msg.direction === 'outgoing' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {msg.direction === 'outgoing' ? 'BookaRide (Auto)' : msg.sender_name}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.direction === 'outgoing' ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(msg.received_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Auto-Reply Templates</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-600 mb-1">Greeting (hi, hello, kia ora...)</p>
                  <p className="text-sm text-gray-700">Hi [name]! Thanks for reaching out to BookaRide NZ. We provide premium airport transfers, city rides, and long-distance shuttles. Get an instant quote at bookaride.co.nz/book-now</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-xs font-medium text-green-600 mb-1">Pricing (how much, quote, cost...)</p>
                  <p className="text-sm text-gray-700">For instant pricing, visit bookaride.co.nz/book-now and enter your pickup and dropoff addresses. Our prices are fixed — no surge, no surprises!</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-600 mb-1">Default (all other messages)</p>
                  <p className="text-sm text-gray-700">Thanks for your message! Our team typically responds within 1 hour during business hours (8am-8pm NZST). For instant pricing, visit bookaride.co.nz/book-now</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights */}
      {activeSection === 'insights' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Page Insights
              </h3>
              {insights.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Insights will appear once your page has activity.</p>
                  <p className="text-gray-400 text-xs mt-1">Page analytics typically take 24-48 hours to populate.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((metric, i) => (
                    <Card key={i} className="bg-gray-50">
                      <CardContent className="p-4">
                        <p className="text-xs text-gray-500 mb-1">{metric.title || metric.name}</p>
                        <p className="text-sm text-gray-600 mb-2">{metric.description}</p>
                        <div className="space-y-1">
                          {(metric.values || []).map((v, j) => (
                            <div key={j} className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">{new Date(v.end_time).toLocaleDateString()}</span>
                              <span className="font-bold text-blue-600">{v.value?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings */}
      {activeSection === 'settings' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" /> Facebook Integration Settings
              </h3>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Connected Page</p>
                    <p className="text-xs text-gray-500">{status.page_name} (ID: {status.page_id})</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Messenger Auto-Reply</p>
                    <p className="text-xs text-gray-500">Automatically respond to incoming Messenger messages</p>
                  </div>
                  <button onClick={handleToggleAutoReply}>
                    {status.auto_reply_enabled ? (
                      <ToggleRight className="w-8 h-8 text-blue-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-medium text-sm text-red-800 mb-2">Danger Zone</h4>
                <p className="text-xs text-red-600 mb-3">Disconnecting will stop all auto-replies and remove page access. You can reconnect at any time.</p>
                <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100" onClick={handleDisconnect}>
                  <Unlink className="w-4 h-4 mr-2" /> Disconnect Facebook Page
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Setup Guide</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>1. Meta App Setup:</strong> Create a Meta App at developers.facebook.com, add the Messenger product, and set your webhook URL to <code className="bg-gray-100 px-1 rounded">https://bookaride.co.nz/api/facebook/webhook</code></p>
                <p><strong>2. Webhook Verification:</strong> Use the verify token from your <code className="bg-gray-100 px-1 rounded">FACEBOOK_VERIFY_TOKEN</code> environment variable</p>
                <p><strong>3. Permissions:</strong> Subscribe to <code className="bg-gray-100 px-1 rounded">messages</code> webhook events on your Meta App</p>
                <p><strong>4. App Review:</strong> For public use, submit your app for review with the <code className="bg-gray-100 px-1 rounded">pages_messaging</code> permission</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
