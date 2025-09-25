import React from 'react';

const UPDATED_AT = '2025年9月24日';
const CONTACT_EMAIL = 'kibako-habitat-hub@googlegroups.com';

type TermsSection = {
  readonly heading: string;
  readonly body: string;
  readonly points?: readonly string[];
};

const TERMS_SECTIONS: ReadonlyArray<TermsSection> = [
  {
    heading: '第1条（本規約の適用）',
    body: 'KIBAKO（以下、「本サービス」といいます。）の利用にあたり、本規約は利用者と運営者との間で適用される基本的な条件を定めるものです。本サービスの画面上で「同意する」等の意思表示を行った時点で、本規約に同意したものとみなされます。',
  },
  {
    heading: '第2条（利用登録）',
    body: '本サービスの一部機能を利用するには、所定の方法でアカウント登録が必要です。登録申請を受けた場合でも、運営者は登録の可否を独自に判断し、必要に応じて登録をお断りすることがあります。',
    points: [
      '登録情報は最新かつ正確な内容を入力してください。',
      '虚偽または第三者の情報を用いた登録は禁止します。',
      '未成年者が利用する場合は、親権者等の同意を得てください。',
    ],
  },
  {
    heading: '第3条（アカウント情報の管理）',
    body: '利用者は、メールアドレスやパスワードなどの認証情報を自己の責任で厳重に管理するものとします。認証情報の漏えいにより生じた損害について、運営者は故意または重過失がある場合を除き責任を負いません。',
  },
  {
    heading: '第4条（禁止事項）',
    body: '利用者は、本サービスの利用に際して次の行為を行ってはなりません。',
    points: [
      '法令または公序良俗に違反する行為',
      '第三者の権利を侵害する行為や誹謗中傷、嫌がらせ',
      '本サービスの運営を妨げる目的でのアクセス、リバースエンジニアリング、不正アクセス、スパムなどの行為',
      'その他運営者が不適切と判断する行為',
    ],
  },
  {
    heading: '第5条（サービス提供の変更・中断）',
    body: '運営者は、システム保守、外部サービスのトラブル、天災地変その他不可抗力の事由により、本サービスの全部または一部を事前の告知なく変更・中断・終了することがあります。これにより利用者に生じた損害について、運営者は責任を負いません。',
  },
  {
    heading: '第6条（免責および準拠法）',
    body: '本規約の解釈には日本法を準拠法とし、本サービスに起因または関連して利用者と運営者の間で紛争が生じた場合には、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。',
  },
];

const TermsOfService: React.FC = () => {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16 text-kibako-primary">
      <header>
        <p className="text-sm text-kibako-secondary">
          最終更新日: {UPDATED_AT}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-wide">
          利用規約（ダミー）
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-kibako-secondary">
          本ページはダミーの利用規約サンプルです。正式な公開前に、法務確認のうえ貴社に適した内容へ差し替えてください。
        </p>
      </header>

      <section className="rounded-2xl border border-kibako-secondary/30 bg-kibako-secondary/5 p-6">
        <h2 className="text-lg font-semibold">ダミー規約について</h2>
        <p className="mt-3 text-sm leading-relaxed text-kibako-secondary">
          本文はあくまで占位用のテンプレートであり、法的効力を意図したものではありません。運営体制、提供機能、課金モデルなどに応じて条項を増減し、必要に応じてプライバシーポリシー等の別文書も整備してください。
        </p>
      </section>

      <div className="space-y-10">
        {TERMS_SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-kibako-primary">
              {section.heading}
            </h2>
            <p className="mt-4 leading-relaxed text-kibako-secondary">
              {section.body}
            </p>
            {section.points && (
              <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-kibako-secondary">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <section className="rounded-2xl bg-kibako-secondary/10 p-6 text-sm leading-relaxed text-kibako-secondary">
        <h2 className="text-lg font-semibold text-kibako-primary">
          お問い合わせ
        </h2>
        <p className="mt-3">
          利用規約に関するお問い合わせやフィードバックは、以下のメールアドレスまでご連絡ください。
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-3 inline-block font-mono text-kibako-primary underline decoration-dotted underline-offset-4"
        >
          {CONTACT_EMAIL}
        </a>
      </section>
    </div>
  );
};

export default TermsOfService;
