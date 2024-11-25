import React from 'react';

import { Prototype } from '../type';

interface ComponentCreationViewProps {
  prototype: Prototype;
}

const ComponentCreationView: React.FC<ComponentCreationViewProps> = ({
  prototype,
}) => {
  const components = ['Button', 'Input', 'Card'];

  const handleCreateComponent = (component: string) => {
    // WebSocketやFirebaseを使ってリアルタイムで他のユーザーに通知
    console.log(`Create component for prototype ${prototype.id}: ${component}`);
  };

  return (
    <div className="p-4 border-r">
      <h2 className="text-lg font-bold mb-4 text-center">{`${
        prototype.name ? `${prototype.name}` : 'コンポーネント作成'
      }`}</h2>
      <ul>
        {components.map((component) => (
          <li key={component} className="mb-2">
            <button
              onClick={() => handleCreateComponent(component)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {component} 作成
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ComponentCreationView;
