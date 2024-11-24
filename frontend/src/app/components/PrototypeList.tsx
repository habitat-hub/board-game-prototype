'use client';

import React, { useState, useEffect } from 'react';

interface Prototype {
  id: number;
  name: string;
}

const PrototypeList: React.FC = () => {
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${apiUrl}/api/prototypes`)
      .then((response) => response.json())
      .then((data) => setPrototypes(data))
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, []);

  return (
    <div>
      <h1>ボードゲームプロトタイプ一覧</h1>
      <ul>
        {prototypes.map((prototype) => (
          <li key={prototype.id}>{prototype.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default PrototypeList;
