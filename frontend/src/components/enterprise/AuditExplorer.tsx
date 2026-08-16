"use client";

import React, { useState } from "react";
import { ShieldCheck, Shield, AlertCircle, FileSearch } from "lucide-react";
import { format } from "date-fns";
import { useAuditLogs } from "@/lib/hooks/useAuditLogs";

export function AuditExplorer() {
  const { data: logs, isLoading, isError } = useAuditLogs();
  
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifiedStatus, setVerifiedStatus] = useState<Record<string, boolean>>({});

  const handleVerify = (eventId: string) => {
    setVerifying(eventId);
    // Simulate cryptographic verification delay
    setTimeout(() => {
      setVerifying(null);
      setVerifiedStatus((prev) => ({ ...prev, [eventId]: true }));
      
      // Reset the flash after 5 seconds to allow verifying again
      setTimeout(() => {
        setVerifiedStatus((prev) => ({ ...prev, [eventId]: false }));
      }, 5000);
    }, 1500);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm min-h-[300px]">
      <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
        <h2 className="text-sm font-semibold text-stone-900 flex items-center">
          <FileSearch className="w-4 h-4 mr-2 text-stone-500" />
          Immutable Audit Trail
        </h2>
        <span className="text-xs text-stone-500 font-mono tracking-tight bg-white px-2 py-1 border border-stone-200 rounded-md">
          {isLoading ? "LOADING..." : `${logs?.length || 0} SECURE LOGS`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-stone-200">
              <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Event ID</th>
              <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Timestamp</th>
              <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Action Type</th>
              <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Actor</th>
              <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">SHA-256 Hash</th>
              <th className="py-3 px-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-4"><div className="h-4 bg-stone-200 rounded w-24" /></td>
                  <td className="py-3 px-4"><div className="h-4 bg-stone-200 rounded w-32" /></td>
                  <td className="py-3 px-4"><div className="h-5 bg-stone-200 rounded w-28" /></td>
                  <td className="py-3 px-4"><div className="h-4 bg-stone-200 rounded w-24" /></td>
                  <td className="py-3 px-4"><div className="h-4 bg-stone-200 rounded w-48" /></td>
                  <td className="py-3 px-4"><div className="h-6 bg-stone-200 rounded w-24 ml-auto" /></td>
                </tr>
              ))
            )}
            
            {!isLoading && isError && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-rose-500">
                  Failed to fetch audit logs. Check your connection.
                </td>
              </tr>
            )}

            {!isLoading && !isError && logs?.map((log) => {
              const isVerifying = verifying === log.eventId;
              const isVerified = verifiedStatus[log.eventId];

              return (
                <tr key={log.eventId} className="hover:bg-stone-50 transition-colors">
                  <td className="py-3 px-4 text-13 font-mono text-stone-700 whitespace-nowrap">
                    {log.eventId}
                  </td>
                  <td className="py-3 px-4 text-13 text-stone-500 whitespace-nowrap">
                    {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-stone-100 text-stone-600 border border-stone-200">
                      {log.actionType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-13 text-stone-700 whitespace-nowrap">
                    {log.actor}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[11px] font-mono text-stone-500 truncate max-w-[200px]" title={log.sha256Hash}>
                      {log.sha256Hash}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isVerified ? (
                      <div className="inline-flex items-center text-xs font-medium text-emerald-600 animate-fade-in">
                        <ShieldCheck className="w-4 h-4 mr-1.5" />
                        Untampered
                      </div>
                    ) : (
                      <button
                        onClick={() => handleVerify(log.eventId)}
                        disabled={isVerifying}
                        className={`inline-flex items-center justify-center text-xs px-3 py-1.5 rounded-md border transition-all ${
                          isVerifying 
                            ? "bg-stone-100 border-stone-200 text-stone-400 cursor-wait" 
                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 shadow-sm"
                        }`}
                      >
                        {isVerifying ? (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                            Verify Hash
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {!isLoading && logs?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-stone-500">
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
