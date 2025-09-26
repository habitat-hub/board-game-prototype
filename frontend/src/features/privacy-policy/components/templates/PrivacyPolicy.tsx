import React from 'react';

// プレースホルダー値。正式リリース時に実際の情報へ差し替えてください。
const POLICY_CONTEXT = {
  serviceName: 'KIBAKO',
  operatorName: 'habitat-hub',
  representativeName: '代表者調整中',
  contactEmail: 'kibako-habitat-hub@googlegroups.com',
  contactAddress: '所在地調整中',
  lastUpdated: '2025年9月26日',
};

type PolicySection = {
  heading: string;
  description: string;
  bullets?: string[];
  note?: string;
};

const POLICY_SECTIONS: ReadonlyArray<PolicySection> = [
  {
    heading: '1. 基本方針',
    description: `${POLICY_CONTEXT.operatorName}（以下「当社」といいます。）は、${POLICY_CONTEXT.serviceName}をご利用いただく皆さまの個人情報を適切に保護・管理することを重大な責務と捉えています。本書は公開前のドラフトであり、正式版では実際の運用方針を反映した表現に置き換えてください。`,
  },
  {
    heading: '2. 取得する情報',
    description:
      '当社は、サービスの提供・改善に必要な範囲で以下の個人情報を取得する場合があります。実際に取得する項目やログの内容、取得手段を確認のうえ修正してください。',
    bullets: [
      'アカウント登録時にご提供いただく氏名、メールアドレス、パスワード等',
      'お問い合わせ対応やアンケートで取得する連絡先、利用状況などの任意情報',
      'クッキーやアクセス解析ツールを通じて収集されるアクセスログ、端末情報、ブラウザ情報',
      '有料プランの決済に必要となる決済サービス提供者へのトークン化情報',
    ],
    note: '取得根拠（本人同意、契約履行、法的義務等）を明示する場合は本セクションに追記してください。',
  },
  {
    heading: '3. 利用目的',
    description:
      '取得した情報は、次に掲げる目的の達成に必要な範囲内で利用します。運用実態に合わせて文言や目的を精査してください。',
    bullets: [
      '本サービスの提供、維持、改善および新機能の企画',
      'ユーザーサポート、重要なお知らせ、アンケート等の連絡',
      '利用状況の分析、機能改善に向けた統計処理、マーケティング施策の評価',
      '利用規約や法令違反への対応、紛争解決、セキュリティ強化',
    ],
  },
  {
    heading: '4. 第三者提供および委託',
    description:
      '当社は、法令に基づく場合および本人の同意を得た場合を除き、個人情報を第三者に提供しません。外部委託を行う場合は、委託先を適切に監督します。',
    bullets: [
      '決済事業者、メール配信サービス、クラウドインフラ等の委託先には、必要最小限の情報のみを共有します。',
      '海外事業者へ移転が生じる場合は、移転先の国名、保護措置の概要、利用者の権利を明記してください。',
    ],
    note: '実際の委託先や業務内容が決定している場合は個別に記載してください。',
  },
  {
    heading: '5. 安全管理体制',
    description:
      '当社は、個人情報の漏えい、滅失又は毀損を防止するため、技術的・組織的・物理的な安全管理措置を講じます。具体的な施策が定まっている場合は以下を土台に追記してください。',
    bullets: [
      'アクセス制御、権限管理、パスワードポリシーの整備',
      '暗号化、ログ監視、脆弱性診断など技術的対策の実施',
      '定期的な従業者教育、委託先に対する契約上の保護義務の付与',
    ],
  },
  {
    heading: '6. 利用者の権利',
    description:
      '利用者は、法令に基づき自己の個人情報について開示・訂正・利用停止・削除等を請求できます。申請窓口および手続を以下の通り定めます。',
    bullets: [
      '請求はお問い合わせ窓口までメールにてご連絡ください。',
      '本人確認のため、必要に応じて身分証の写し等の提出をお願いする場合があります。',
      '法令に基づき、請求に応じられない場合または回答に時間を要する場合があります。',
    ],
  },
  {
    heading: '7. クッキー等の利用',
    description:
      '本サービスでは、利便性向上や分析のためクッキーその他類似技術を利用することがあります。ブラウザ設定による無効化手順やオプトアウト方法を記載してください。',
  },
  {
    heading: '8. 外部サービスとの連携',
    description:
      'シングルサインオンや分析ツールなど外部サービスを利用する場合は、サービス名、提供先、連携する情報の範囲、提供時の条件を記載してください。',
  },
  {
    heading: '9. 改定について',
    description:
      '本ポリシーの内容は、法令の改正やサービス内容の変更に応じて改定することがあります。重要な変更を行う場合は、ウェブサイト上での掲示やメール通知等、適切な方法でお知らせします。',
  },
  {
    heading: '10. お問い合わせ窓口',
    description:
      '個人情報の取り扱いに関するご質問やご相談は、下記の窓口までご連絡ください。必要に応じて電話番号や問い合わせフォームのURLを追加してください。',
    bullets: [
      `${POLICY_CONTEXT.operatorName} 個人情報保護窓口`,
      `${POLICY_CONTEXT.contactAddress}`,
      `${POLICY_CONTEXT.contactEmail}`,
    ],
  },
];

const FAQ_ITEMS: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: '公開前に必ず確認すべき項目は何ですか？',
    answer:
      '取得する情報、利用目的、安全管理措置、第三者提供の有無など、実際の運用内容と乖離がないかをご確認ください。法務・セキュリティ担当によるレビューも推奨します。',
  },
  {
    question: '第三者提供や委託がある場合、どのように記載すべきですか？',
    answer:
      '提供先の名称、所在地、提供する情報の範囲、提供目的、利用者の権利行使方法を明文化してください。海外移転の場合は適切な保護措置に関する説明も必要です。',
  },
];

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16 text-kibako-primary">
      <header className="space-y-4">
        <p className="text-sm text-kibako-secondary">
          最終更新日: {POLICY_CONTEXT.lastUpdated}
        </p>
        <h1 className="text-3xl font-bold tracking-wide">
          プライバシーポリシー（ダミー版）
        </h1>
        <p className="text-sm leading-relaxed text-kibako-secondary">
          このページは正式公開前のドラフトです。必ず最新の運用体制に合わせて内容を見直し、確定した情報を反映してから公開してください。
        </p>
        <dl className="grid gap-3 text-sm text-kibako-secondary md:grid-cols-2">
          <div>
            <dt className="font-semibold text-kibako-primary">運営者</dt>
            <dd>{POLICY_CONTEXT.operatorName}</dd>
          </div>
          <div>
            <dt className="font-semibold text-kibako-primary">代表者</dt>
            <dd>{POLICY_CONTEXT.representativeName}</dd>
          </div>
          <div>
            <dt className="font-semibold text-kibako-primary">所在地</dt>
            <dd>{POLICY_CONTEXT.contactAddress}</dd>
          </div>
          <div>
            <dt className="font-semibold text-kibako-primary">お問い合わせ</dt>
            <dd>
              <a
                href={`mailto:${POLICY_CONTEXT.contactEmail}`}
                className="font-mono text-kibako-primary underline decoration-dotted underline-offset-4"
              >
                {POLICY_CONTEXT.contactEmail}
              </a>
            </dd>
          </div>
        </dl>
      </header>

      <section className="rounded-2xl border border-kibako-secondary/30 bg-kibako-secondary/5 p-6">
        <h2 className="text-lg font-semibold text-kibako-primary">概要</h2>
        <p className="mt-3 text-sm leading-relaxed text-kibako-secondary">
          当社は、利用者の皆さまからお預かりする個人情報を適切に取り扱うため、関連法令およびガイドラインを遵守し、安全管理体制を構築します。本ドラフトは文責の確認と公開準備を円滑に進めるためのテンプレートです。
        </p>
      </section>

      <div className="space-y-10">
        {POLICY_SECTIONS.map((section) => (
          <section key={section.heading} className="space-y-4">
            <h2 className="text-xl font-semibold text-kibako-primary">
              {section.heading}
            </h2>
            <p className="leading-relaxed text-kibako-secondary">
              {section.description}
            </p>
            {section.bullets && (
              <ul className="mt-2 list-disc space-y-2 pl-6 text-sm leading-relaxed text-kibako-secondary">
                {section.bullets.map((bullet, index) => (
                  <li key={`${section.heading}-${index}`}>{bullet}</li>
                ))}
              </ul>
            )}
            {section.note && (
              <p className="text-xs text-kibako-secondary/80">{section.note}</p>
            )}
          </section>
        ))}
      </div>

      <section className="rounded-2xl bg-kibako-secondary/10 p-6 text-sm leading-relaxed text-kibako-secondary">
        <h2 className="text-lg font-semibold text-kibako-primary">
          公開前チェックリスト
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>
            すべてのプレースホルダーが実際の情報に置き換えられているか確認しましたか？
          </li>
          <li>
            社内の関係部署（法務、情報セキュリティ、プロダクト責任者等）の承認を取得しましたか？
          </li>
          <li>
            利用規約やクッキーポリシーと内容が矛盾していないか再確認しましたか？
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-kibako-secondary/20 p-6 text-sm leading-relaxed text-kibako-secondary">
        <h2 className="text-lg font-semibold text-kibako-primary">
          FAQ（公開準備のヒント）
        </h2>
        <div className="mt-4 space-y-4">
          {FAQ_ITEMS.map((faq, index) => (
            <div key={`faq-${index}`} className="space-y-1">
              <p className="font-semibold text-kibako-primary">
                Q. {faq.question}
              </p>
              <p className="text-kibako-secondary">A. {faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-xs text-kibako-secondary/80">
        <p>
          本ドラフトは一般的な構成例です。実際の法的助言が必要な場合は、専門家に相談したうえで最終版を確定してください。
        </p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
