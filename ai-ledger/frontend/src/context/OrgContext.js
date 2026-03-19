import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/config/api';
import { useAuth } from '@/context/AuthContext';

const OrgContext = createContext(null);

export function OrgProvider({ children }) {
  const { currentOrg, isAuthenticated } = useAuth();

  const [orgData, setOrgData] = useState(null);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [taxCodes, setTaxCodes] = useState([]);
  const [baseCurrency, setBaseCurrency] = useState('NZD');
  const [fiscalYear, setFiscalYear] = useState({ startMonth: 4, endMonth: 3 });
  const [loading, setLoading] = useState(false);

  const fetchOrgData = useCallback(async (orgId) => {
    setLoading(true);
    try {
      const [orgRes, accountsRes, taxRes] = await Promise.all([
        api.get(`/organizations/${orgId}`),
        api.get(`/organizations/${orgId}/accounts`),
        api.get(`/organizations/${orgId}/tax-codes`),
      ]);

      setOrgData(orgRes.data);
      setChartOfAccounts(accountsRes.data || []);
      setTaxCodes(taxRes.data || []);
      setBaseCurrency(orgRes.data.baseCurrency || 'NZD');
      setFiscalYear(
        orgRes.data.fiscalYear || { startMonth: 4, endMonth: 3 }
      );
    } catch (err) {
      console.error('Failed to load organization data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentOrg?.id) {
      fetchOrgData(currentOrg.id);
    } else {
      setOrgData(null);
      setChartOfAccounts([]);
      setTaxCodes([]);
      setBaseCurrency('NZD');
      setFiscalYear({ startMonth: 4, endMonth: 3 });
    }
  }, [isAuthenticated, currentOrg?.id, fetchOrgData]);

  const refreshAccounts = useCallback(async () => {
    if (!currentOrg?.id) return;
    try {
      const { data } = await api.get(`/organizations/${currentOrg.id}/accounts`);
      setChartOfAccounts(data || []);
    } catch (err) {
      console.error('Failed to refresh chart of accounts:', err.message);
    }
  }, [currentOrg?.id]);

  const refreshTaxCodes = useCallback(async () => {
    if (!currentOrg?.id) return;
    try {
      const { data } = await api.get(`/organizations/${currentOrg.id}/tax-codes`);
      setTaxCodes(data || []);
    } catch (err) {
      console.error('Failed to refresh tax codes:', err.message);
    }
  }, [currentOrg?.id]);

  const value = {
    orgData,
    chartOfAccounts,
    taxCodes,
    baseCurrency,
    fiscalYear,
    loading,
    refreshAccounts,
    refreshTaxCodes,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}

export default OrgContext;
