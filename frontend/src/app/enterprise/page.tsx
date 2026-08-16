"use client";

import React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ShieldAlert, FileText } from "lucide-react";
import { ActionInbox } from "@/components/enterprise/ActionInbox";
import { AuditExplorer } from "@/components/enterprise/AuditExplorer";
import { usePendingEscrow } from "@/lib/hooks/usePendingEscrow";

export default function EnterpriseDashboard() {
  const { data: transactions } = usePendingEscrow();
  const pendingCount = transactions?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Organization Overview</h1>
        <p className="text-stone-500 text-sm mt-1">Monitor high-signal agent transactions and cryptographic compliance logs.</p>
      </div>

      <Tabs.Root defaultValue="inbox" className="flex flex-col">
        <Tabs.List className="flex border-b border-stone-200 mb-6 w-full">
          <Tabs.Trigger 
            value="inbox" 
            className="group flex items-center px-6 py-3 border-b-2 border-transparent data-[state=active]:border-stone-900 text-sm font-medium text-stone-500 data-[state=active]:text-stone-900 hover:text-stone-700 transition-colors focus:outline-none"
          >
            <ShieldAlert className="w-4 h-4 mr-2" />
            Action Inbox
            {pendingCount > 0 && (
              <span className="ml-2 bg-rose-100 text-rose-700 py-0.5 px-2 rounded-full text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="audit" 
            className="group flex items-center px-6 py-3 border-b-2 border-transparent data-[state=active]:border-stone-900 text-sm font-medium text-stone-500 data-[state=active]:text-stone-900 hover:text-stone-700 transition-colors focus:outline-none"
          >
            <FileText className="w-4 h-4 mr-2" />
            Immutable Audit Trail
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="inbox" className="focus:outline-none outline-none">
          <ActionInbox />
        </Tabs.Content>
        
        <Tabs.Content value="audit" className="focus:outline-none outline-none">
          <AuditExplorer />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
