import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Send, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatusPill = ({ status }) => {
  const lower = (status || '').toLowerCase();
  const className = lower === 'sent' || lower === 'resolved'
    ? 'bg-emerald-100 text-emerald-700'
    : lower === 'failed'
      ? 'bg-red-100 text-red-700'
      : lower === 'skipped'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>{status}</span>;
};

export const CommsCenterTab = () => {
  const [logs, setLogs] = useState([]);
  const [retryQueue, setRetryQueue] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [templateDraft, setTemplateDraft] = useState('');
  const [templateMeta, setTemplateMeta] = useState({
    description: '',
    channel: '',
    event_type: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [retryingEventId, setRetryingEventId] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, queueRes, templatesRes] = await Promise.all([
        axios.get(`${API}/admin/notification-logs?limit=120`, getAuthHeaders()),
        axios.get(`${API}/admin/notification-retry-queue?limit=60`, getAuthHeaders()),
        axios.get(`${API}/admin/notification-templates`, getAuthHeaders()),
      ]);
      setLogs(logsRes.data.logs || []);
      setRetryQueue(queueRes.data.queue || []);
      const nextTemplates = templatesRes.data.templates || [];
      setTemplates(nextTemplates);
      if (!selectedTemplateKey && nextTemplates.length > 0) {
        const first = nextTemplates[0];
        setSelectedTemplateKey(first.key);
        setTemplateDraft(first.content || '');
        setTemplateMeta({
          description: first.description || '',
          channel: first.channel || '',
          event_type: first.event_type || '',
          is_active: first.is_active !== false,
        });
      }
    } catch (error) {
      console.error('Comms center load failed:', error);
      toast.error('Failed to load comms center');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.key === selectedTemplateKey),
    [templates, selectedTemplateKey]
  );

  useEffect(() => {
    if (!selectedTemplate) return;
    setTemplateDraft(selectedTemplate.content || '');
    setTemplateMeta({
      description: selectedTemplate.description || '',
      channel: selectedTemplate.channel || '',
      event_type: selectedTemplate.event_type || '',
      is_active: selectedTemplate.is_active !== false,
    });
  }, [selectedTemplateKey, selectedTemplate]);

  const retryEvent = async (eventId) => {
    setRetryingEventId(eventId);
    try {
      await axios.post(`${API}/admin/notifications/retry`, { event_id: eventId }, getAuthHeaders());
      toast.success('Notification retried successfully');
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Retry failed';
      toast.error(msg);
    } finally {
      setRetryingEventId(null);
    }
  };

  const saveTemplate = async () => {
    if (!selectedTemplateKey) return;
    setSavingTemplate(true);
    try {
      await axios.put(
        `${API}/admin/notification-templates/${selectedTemplateKey}`,
        {
          content: templateDraft,
          description: templateMeta.description,
          channel: templateMeta.channel,
          event_type: templateMeta.event_type,
          is_active: templateMeta.is_active,
        },
        getAuthHeaders()
      );
      toast.success('Template saved');
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Template save failed';
      toast.error(msg);
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Comms
        </Button>
      </div>

      <Tabs defaultValue="delivery-log" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="delivery-log">Delivery Log</TabsTrigger>
          <TabsTrigger value="retry-queue">Retry Queue</TabsTrigger>
          <TabsTrigger value="templates">Template Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="delivery-log">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Log (queued/sent/failed)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[560px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-gray-500">No notification events recorded yet.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {log.event_type} • {log.channel} • {log.booking_ref || 'N/A'} • {log.customer_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.recipient || 'No recipient'} • {log.provider || 'provider-unknown'} • {log.created_at}
                          </p>
                          {log.error && <p className="text-xs text-red-600 mt-1">Error: {log.error}</p>}
                        </div>
                        <StatusPill status={log.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retry-queue">
          <Card>
            <CardHeader>
              <CardTitle>Retry Queue + Manual Resend Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {retryQueue.length === 0 ? (
                <div className="text-sm text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  No failed notifications pending retry.
                </div>
              ) : (
                retryQueue.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 bg-red-50/30 border-red-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.event_type} • {item.channel} • {item.booking_ref || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.customer_name || 'Unknown'} • {item.recipient || 'No recipient'}
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          {item.error || 'Delivery failed'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Retries: {item.retry_count || 0}/{item.max_retries || 5}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => retryEvent(item.id)}
                        disabled={!item.can_retry || retryingEventId === item.id}
                      >
                        {retryingEventId === item.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1" />
                            Resend
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.key}
                    onClick={() => setSelectedTemplateKey(tpl.key)}
                    className={`w-full text-left p-2 rounded border text-sm ${
                      selectedTemplateKey === tpl.key
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    <p className="font-medium">{tpl.key}</p>
                    <p className="text-xs text-gray-500">{tpl.channel} / {tpl.event_type}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Template Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!selectedTemplate ? (
                  <div className="text-sm text-gray-500">Select a template to edit.</div>
                ) : (
                  <>
                    <Input
                      value={templateMeta.description}
                      onChange={(e) => setTemplateMeta((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Description"
                    />
                    <Textarea
                      rows={14}
                      value={templateDraft}
                      onChange={(e) => setTemplateDraft(e.target.value)}
                      placeholder="Template body"
                    />
                    <div className="flex items-center justify-between">
                      <label className="text-sm flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={templateMeta.is_active}
                          onChange={(e) => setTemplateMeta((prev) => ({ ...prev, is_active: e.target.checked }))}
                        />
                        Active template
                      </label>
                      <Button onClick={saveTemplate} disabled={savingTemplate}>
                        {savingTemplate ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Template'
                        )}
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Use placeholders like {'{booking_ref}'}, {'{customer_name}'}, {'{date}'}, {'{time}'}.
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommsCenterTab;
