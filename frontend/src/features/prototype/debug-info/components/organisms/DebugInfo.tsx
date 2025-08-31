'use client';

import React, { useState } from 'react';

import { Part, PartProperty } from '@/api/types';
import { useDebugMode } from '@/features/prototype/hooks/useDebugMode';
import { GameBoardMode } from '@/features/prototype/types';

import InfoTab from '../molecules/InfoTab';
import PerfTab from '../molecules/PerfTab';
import DataTab from '../molecules/DataTab';
import PartsTab from '../molecules/PartsTab';

const TABS = [
  { id: 'info' as const, label: 'Info' },
  { id: 'perf' as const, label: 'Perf' },
  { id: 'data' as const, label: 'Data' },
  { id: 'parts' as const, label: 'Parts' },
];

type TabId = typeof TABS[number]['id'];

interface DebugInfoProps {
  camera: {
    x: number;
    y: number;
    scale: number;
  };
  prototypeName: string;
  projectId: string;
  parts: Part[];
  properties: PartProperty[];
  mode: GameBoardMode;
}

const DebugInfo: React.FC<DebugInfoProps> = ({
  camera,
  prototypeName,
  projectId,
  parts,
  properties,
  mode,
}) => {
  const { showDebugInfo } = useDebugMode();
  const [activeTab, setActiveTab] = useState<TabId>('info');

  if (!showDebugInfo) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <InfoTab
            camera={camera}
            prototypeName={prototypeName}
            projectId={projectId}
            mode={mode}
          />
        );
      case 'perf':
        return <PerfTab />;
      case 'data':
        return <DataTab parts={parts} properties={properties} />;
      case 'parts':
        return <PartsTab parts={parts} properties={properties} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-kibako-black/80 text-kibako-white p-2.5 rounded-md font-mono text-sm z-[1000] w-96 max-h-[80vh] flex flex-col">
      <div className="flex border-b border-kibako-white border-opacity-20 mb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-1 py-1 text-[11px] cursor-pointer transition-colors text-center ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-kibako-white text-opacity-70 hover:text-opacity-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>

      <div className="text-[11px] mt-2 pt-2 border-t border-kibako-white border-opacity-20">
        Press Cmd+i (Mac) or Ctrl+i (Windows) to toggle debug panel
      </div>
    </div>
  );
};

export default DebugInfo;

