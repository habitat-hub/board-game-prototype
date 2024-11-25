'use client';

import React, { useEffect, useState } from 'react';

import ComponentCreationView from '@/features/prototype/components/ComponentCreationView';
import ComponentMainView from '@/features/prototype/components/ComponentMainView';
import ComponentPropertyView from '@/features/prototype/components/ComponentPropertyView';
import { useParams } from 'next/navigation';
import { Prototype } from '@/features/prototype/type';

const EditPrototypePage: React.FC = () => {
  const { prototypeId } = useParams();
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [isCreationViewOpen, setIsCreationViewOpen] = useState(true);
  const [isPropertyViewOpen, setIsPropertyViewOpen] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${apiUrl}/api/prototypes/${prototypeId}`)
      .then((response) => response.json())
      .then((data) => setPrototype(data))
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, [prototypeId]);

  if (!prototype) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      <div
        className={`transition-width duration-300 ${
          isCreationViewOpen ? 'w-1/6' : 'w-10'
        }`}
      >
        <button
          onClick={() => setIsCreationViewOpen(!isCreationViewOpen)}
          className="bg-blue-500 text-white p-2"
        >
          {isCreationViewOpen ? '＜' : '＞'}
        </button>
        {isCreationViewOpen && <ComponentCreationView prototype={prototype} />}
      </div>
      <div
        className={`flex-1 transition-width duration-300 ${
          isCreationViewOpen && isPropertyViewOpen ? 'w-1/2' : 'w-full'
        }`}
      >
        <ComponentMainView />
      </div>
      <div
        className={`transition-width duration-300 ${
          isPropertyViewOpen ? 'w-1/6' : 'w-10'
        }`}
      >
        <div className="flex justify-end">
          <button
            onClick={() => setIsPropertyViewOpen(!isPropertyViewOpen)}
            className="bg-blue-500 text-white p-2"
          >
            {isPropertyViewOpen ? '＞' : '＜'}
          </button>
        </div>
        {isPropertyViewOpen && <ComponentPropertyView />}
      </div>
    </div>
  );
};

export default EditPrototypePage;
