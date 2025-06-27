(async () => {
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
    let commentTexts = "";

    try {
      const commentsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/comments`,
        {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "notify-discord-script",
          },
        }
      );

      if (commentsRes.ok) {
        const comments = await commentsRes.json();
        commentTexts = comments
          .map((c) => `- ${c.user.login}: ${c.body}`)
          .join("\n");
      } else {
        commentTexts = "(Failed to fetch comments)";
      }
    } catch (e) {
      commentTexts = "(Error fetching comments)";
    }

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
    process.exit(1);
  }
})();
