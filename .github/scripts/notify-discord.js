// 必要なモジュールをインポート
import * as github from "@actions/github";
import * as core from "@actions/core";
import fetch from "node-fetch";

try {
  // 通知タイプに応じて文言と色を切り替え
  const content =
    process.env.ACTION === "opened"
      ? ":new: New issue created"
      : ":white_check_mark: Issue closed";

  const color =
    process.env.ACTION === "opened"
      ? 16777215 // 白
      : 3066993; // 緑

  // コメントリスト取得
  const [owner, repo] = process.env.REPO.split("/");
  const issue_number = process.env.NUMBER;
  const comments = await github.rest.issues.listComments({
    owner,
    repo,
    issue_number,
  });
  const commentTexts = comments.data
    .map((c) => `- ${c.user.login}: ${c.body}`)
    .join("\n");

  // Discord 向けペイロードを作成
  const payload = {
    content: content,
    embeds: [
      {
        title: `#${process.env.NUMBER} ${process.env.TITLE}`,
        url: process.env.URL,
        color: color,
        description: `**Description:**\n${
          process.env.BODY || "No description."
        }\n\n**Comments:**\n${commentTexts || "No comments."}`,
      },
    ],
  };

  // Discord webhook に fetch API を使用してリクエストを送信
  const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord API responded with status: ${response.status}`);
  }

  console.log("Discord notification sent successfully");
} catch (error) {
  console.error("Failed to send Discord notification:", error);
  core.setFailed(error.message);
}
