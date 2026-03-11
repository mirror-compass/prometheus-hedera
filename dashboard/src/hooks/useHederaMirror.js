import { useState, useEffect, useCallback } from "react";
import { MIRROR_NODE_URL } from "../utils/constants";

export function useMirrorQuery(path, refreshInterval = 15000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${MIRROR_NODE_URL}${path}`);
      if (!res.ok) throw new Error(`Mirror Node ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

export function useContractLogs(contractId) {
  return useMirrorQuery(`/contracts/${contractId}/results/logs?order=desc&limit=25`);
}

export function useTopicMessages(topicId) {
  return useMirrorQuery(`/topics/${topicId}/messages?order=desc&limit=25`);
}

export function useContractInfo(contractId) {
  return useMirrorQuery(`/contracts/${contractId}`);
}

export function useAccountTransactions(accountId) {
  return useMirrorQuery(`/transactions?account.id=${accountId}&order=desc&limit=25`);
}
