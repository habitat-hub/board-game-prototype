import React from 'react';

const DonationTemplate: React.FC = () => {
  return (
    <main className="mx-auto max-w-2xl p-4 space-y-4">
      <h1 className="text-2xl font-bold">KIBAKO を支援する</h1>
      <p>
        KIBAKO
        はボードゲームのアイデアを試して直してまた遊ぶことができるオンラインサービス
        です。さらに発展させるため、日々機能の追加や改善に取り組んでいます。
      </p>
      <p>
        これからの開発を応援してくださる方は寄付をご検討ください。いただいたご支援は以下のような
        用途に大切に使わせていただきます。
      </p>
      <ul className="list-inside list-disc space-y-1">
        <li>新機能の開発や既存機能の改善</li>
        <li>サーバーやドメインなどの運営費</li>
        <li>外部 API やライブラリの利用料</li>
      </ul>
      <p>
        現在、寄付受付の準備を進めています。準備が整い次第、このページから寄付を
        行えるようになります。
      </p>
      <p>
        ご支援いただけると大変励みになります。今後とも KIBAKO
        をよろしくお願いいたします。
      </p>
    </main>
  );
};

export default DonationTemplate;
