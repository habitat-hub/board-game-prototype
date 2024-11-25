import Link from 'next/link';
import React, { useState } from 'react';

const ComponentMainView: React.FC = () => {
  const [components, setComponents] = useState<string[]>([]);

  const handleAddComponent = (component: string) => {
    setComponents((prev) => [...prev, component]);
  };

  return (
    <div className="flex-1 p-4">
      <div className="mb-4">
        <Link
          href="/prototypes"
          className="text-blue-500 hover:text-blue-700 hover:underline"
        >
          プロトタイプ一覧へ
        </Link>
      </div>
      <div className="border p-4">
        {components.map((component, index) => (
          <div key={index} className="mb-2">
            {component}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComponentMainView;
