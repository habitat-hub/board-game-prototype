/* eslint-disable @typescript-eslint/no-var-requires */
// Jest設定ファイルはCommonJS形式が必要
// Next.jsのJest設定では、ES6 importは正しく動作しないため、CommonJS形式を使用
const nextJest = require('next/jest');

// Next.jsプロジェクトでJestを使用する際の標準的なセットアップ
// next/jestはNext.jsの設定（next.config.js、.envファイルなど）を自動的に読み込む
const createJestConfig = nextJest({
  // Next.jsアプリケーションのルートディレクトリを指定
  // next.config.jsや.envファイルを正しく読み込むために必要
  dir: './',
});

// Jestに渡すカスタム設定
const customJestConfig = {
  // テスト実行前にjest-domのカスタムマッチャーを設定するため
  // toBeInTheDocument()などのDOMテスト用のマッチャーが使用可能になる
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // React/DOM要素をテストするためにJSDOMブラウザ環境をシミュレート
  // windowオブジェクトやDOM APIが使用可能になる
  testEnvironment: 'jsdom',

  // TypeScriptのpath mappingに対応するため
  // @/で始まるインポートパスをsrc/ディレクトリにマッピング
  // これによりテストファイルでも絶対パスでのインポートが可能
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // テスト対象外のディレクトリを明示的に除外
  // .next/: Next.jsのビルド成果物（テスト不要）
  // node_modules/: 外部ライブラリ（通常テスト不要）
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};

// Next.jsの設定が非同期で読み込まれるため、createJestConfigを使用
// これによりNext.jsの設定とカスタム設定が適切にマージされる
module.exports = createJestConfig(customJestConfig);
