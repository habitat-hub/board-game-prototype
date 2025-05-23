'use client';

export default function UnsupportedDevice() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">デバイス非対応</h1>
      <p className="mb-8">
        申し訳ありませんが、現在のところ当サービスはPCからのご利用のみに対応しています。
      </p>
      <p className="mb-8">PCからのアクセスをお願いいたします。</p>
    </div>
  );
}
