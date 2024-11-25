'use client';

import Link from 'next/link';
import React, { useState } from 'react';

const CreatePrototypeForm: React.FC = () => {
  const [name, setName] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/prototypes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        setName('');
        alert('プロトタイプが作成されました！');
      } else {
        alert('プロトタイプの作成に失敗しました。');
      }
    } catch (error) {
      console.error('Error creating prototype:', error);
      alert('エラーが発生しました。');
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto mt-10 p-4 bg-white shadow-md rounded-lg"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          新しいプロトタイプを作成
        </h2>
        <div className="mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="プロトタイプ名"
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
        >
          作成
        </button>
      </form>
      <div className="text-center mt-4">
        <Link
          href="/prototypes"
          className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          戻る
        </Link>
      </div>
    </>
  );
};

export default CreatePrototypeForm;
