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
      <ComponentCreationView prototype={prototype} />
      <ComponentMainView />
      <ComponentPropertyView />
    </div>
  );
};

export default EditPrototypePage;
