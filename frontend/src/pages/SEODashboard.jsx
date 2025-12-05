import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RefreshCw, Plus, Edit2, Trash2, Search, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const SEODashboard = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    page_path: '',
    page_name: '',
    title: '',
    description: '',
    keywords: '',
    canonical: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchPages();
  }, [navigate]);

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/seo/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPages(response.data.pages || []);
    } catch (error) {
      console.error('Error fetching SEO pages:', error);
      toast.error('Failed to load SEO pages');
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/seo/initialize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('SEO pages initialized successfully');
      fetchPages();
    } catch (error) {
      console.error('Error initializing SEO pages:', error);
      toast.error('Failed to initialize SEO pages');
    }
  };

  const handleInitializeAll = async () => {
    if (!window.confirm('This will create SEO for ALL pages including 27 suburbs. Continue?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/seo/initialize-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('All SEO pages initialized successfully (including all suburbs)!');
      fetchPages();
    } catch (error) {
      console.error('Error initializing all SEO pages:', error);
      toast.error('Failed to initialize all SEO pages');
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page.page_path);
    setFormData(page);
  };

  const handleCancel = () => {
    setEditingPage(null);
    setFormData({
      page_path: '',
      page_name: '',
      title: '',
      description: '',
      keywords: '',
      canonical: ''
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/seo/pages`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('SEO configuration saved successfully');
      handleCancel();
      fetchPages();
    } catch (error) {
      console.error('Error saving SEO page:', error);
      toast.error('Failed to save SEO configuration');
    }
  };

  const handleDelete = async (pagePath) => {
    if (!window.confirm('Are you sure you want to delete this SEO configuration?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API}/seo/pages/${encodeURIComponent(pagePath)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('SEO configuration deleted');
      fetchPages();
    } catch (error) {
      console.error('Error deleting SEO page:', error);
      toast.error('Failed to delete SEO configuration');
    }
  };

  const filteredPages = pages.filter(page =>
    page.page_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.page_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SEO Management</h1>
              <p className="text-gray-600 mt-1">Manage SEO settings for all pages</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleInitializeAll}
                className="bg-gold hover:bg-gold/90 text-black font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Initialize ALL Pages (34)
              </Button>
              <Button
                onClick={handleInitialize}
                variant="outline"
                className="border-gold text-gold hover:bg-gold/10"
              >
                Initialize Main Pages Only
              </Button>
              <Button
                onClick={() => navigate('/admin/dashboard')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search pages by name, path, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Page List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredPages.map((page) => (
            <Card key={page.page_path} className="border-2 border-gray-200 hover:border-gold/50 transition-colors">
              <CardContent className="p-6">
                {editingPage === page.page_path ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="page_name">Page Name</Label>
                        <Input
                          id="page_name"
                          name="page_name"
                          value={formData.page_name}
                          onChange={handleChange}
                          placeholder="e.g., Home, Services"
                        />
                      </div>
                      <div>
                        <Label htmlFor="page_path">Page Path</Label>
                        <Input
                          id="page_path"
                          name="page_path"
                          value={formData.page_path}
                          onChange={handleChange}
                          placeholder="e.g., /, /services"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="title">SEO Title (50-60 characters recommended)</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Page title for search engines"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Length: {formData.title.length} characters
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="description">Meta Description (150-160 characters recommended)</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Description that appears in search results"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Length: {formData.description.length} characters
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                      <Textarea
                        id="keywords"
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleChange}
                        placeholder="keyword1, keyword2, keyword3"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="canonical">Canonical URL</Label>
                      <Input
                        id="canonical"
                        name="canonical"
                        value={formData.canonical}
                        onChange={handleChange}
                        placeholder="e.g., /services"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button onClick={handleSave} className="bg-gold hover:bg-gold/90 text-black">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button onClick={handleCancel} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{page.page_name}</h3>
                          <a
                            href={page.page_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold hover:text-gold/80 text-sm flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Page
                          </a>
                        </div>
                        <p className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                          {page.page_path}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(page)}
                          variant="outline"
                          size="sm"
                          className="border-gold text-gold hover:bg-gold/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(page.page_path)}
                          variant="outline"
                          size="sm"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Title:</p>
                        <p className="text-gray-600">{page.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{page.title.length} characters</p>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Description:</p>
                        <p className="text-gray-600">{page.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{page.description.length} characters</p>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Keywords:</p>
                        <p className="text-gray-600">{page.keywords}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredPages.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">
                  {searchTerm ? 'No pages found matching your search.' : 'No SEO pages configured yet.'}
                </p>
                {!searchTerm && (
                  <Button onClick={handleInitialize} className="bg-gold hover:bg-gold/90 text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Initialize Default Pages
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SEODashboard;
