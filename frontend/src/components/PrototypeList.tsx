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
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">
        ボードゲームプロトタイプ一覧
      </h1>
      <div className="shadow-lg rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {prototypes.map((prototype) => (
            <li
              key={prototype.id}
              className="hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="p-4">{prototype.name}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PrototypeList;
