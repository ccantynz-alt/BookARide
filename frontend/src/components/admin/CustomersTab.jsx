import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Search, User, Mail, Phone, DollarSign, Calendar } from 'lucide-react';
import { Input } from '../ui/input';
import axios from 'axios';
import { toast } from 'sonner';

import { API } from '../../config/api';

export const CustomersTab = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCustomers(response.data.customers);
      setFilteredCustomers(response.data.customers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading customers...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Repeat Customers</p>
            <p className="text-3xl font-bold text-green-600">
              {customers.filter(c => c.total_bookings > 1).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Lifetime Value</p>
            <p className="text-3xl font-bold text-gold">
              ${customers.reduce((sum, c) => sum + c.total_spent, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.email} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedCustomer(selectedCustomer?.email === customer.email ? null : customer)}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {customer.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {customer.phone}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-4">
                    <div>
                      <p className="text-sm text-gray-600">Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{customer.total_bookings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-gold">${customer.total_spent.toFixed(2)}</p>
                    </div>
                  </div>
                  {customer.total_bookings > 1 && (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Repeat Customer
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Customer Details */}
              {selectedCustomer?.email === customer.email && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-bold text-gray-900 mb-4">Booking History</h4>
                  <div className="space-y-3">
                    {customer.bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{booking.service}</p>
                          <p className="text-sm text-gray-600">{booking.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${booking.price.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {customer.bookings.length > 5 && (
                      <p className="text-sm text-gray-600 text-center">
                        +{customer.bookings.length - 5} more bookings
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
