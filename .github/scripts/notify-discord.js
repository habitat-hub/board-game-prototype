(async () => {
  try {
    console.log("=== [Start Notify Discord Script] ===");

    // --- ENVログ ---
    console.log("ENV Variables:");
    console.log("  ACTION:", process.env.ACTION);
    console.log("  REPO:", process.env.REPO);
    console.log("  NUMBER:", process.env.NUMBER);
    console.log("  TITLE:", process.env.TITLE);
    console.log("  URL:", process.env.URL);
    console.log("  BODY:", (process.env.BODY || "").slice(0, 100) + "...");
    console.log(
      "  DISCORD_WEBHOOK_URL:",
      process.env.DISCORD_WEBHOOK_URL ? "[SET]" : "[MISSING]"
    );
    console.log(
      "  GITHUB_TOKEN:",
      process.env.GITHUB_TOKEN ? "[SET]" : "[MISSING]"
    );

    const content =
      process.env.ACTION === "opened"
        ? ":new: New issue created"
        : ":white_check_mark: Issue closed";

    const color =
      process.env.ACTION === "opened"
        ? 16777215 // 白
        : 3066993; // 緑

    const [owner, repo] = process.env.REPO.split("/");
    const issue_number = process.env.NUMBER;

    let commentTexts = "";

    try {
      const commentsUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/comments`;
      console.log("Fetching comments from:", commentsUrl);

      const headers = {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "notify-discord-script",
      };

      console.log("Request Headers to GitHub:");
      console.log(headers);

      const commentsRes = await fetch(commentsUrl, { headers });

      console.log("GitHub API Response Status:", commentsRes.status);

      if (commentsRes.ok) {
        const comments = await commentsRes.json();
        commentTexts = comments
          .map((c) => `- ${c.user.login}: ${c.body}`)
          .join("\n");

        console.log(`Fetched ${comments.length} comment(s).`);
      } else {
        const errorText = await commentsRes.text();
        console.error("GitHub API Error Body:", errorText);
        commentTexts = `(Failed to fetch comments: status ${commentsRes.status})`;
      }
    } catch (e) {
      console.error("Exception while fetching comments:", e);
      commentTexts = "(Error fetching comments)";
    }

    const descriptionText = `**Description:**\n${
      process.env.BODY || "No description."
    }\n\n**Comments:**\n${commentTexts || "No comments."}`;

    const payload = {
      content: content,
      embeds: [
        {
          title: `#${process.env.NUMBER} ${process.env.TITLE}`,
          url: process.env.URL,
          color: color,
          description: descriptionText,
        },
      ],
    };

    console.log("Payload to Discord:");
    console.dir(payload, { depth: null });

    const discordRes = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Discord API Response Status:", discordRes.status);

    if (!discordRes.ok) {
      const errorText = await discordRes.text();
      console.error("Discord API Error Body:", errorText);
      throw new Error(
        `Discord API responded with status: ${discordRes.status}`
      );
    }

    console.log("✅ Discord notification sent successfully");
    console.log("=== [End Notify Discord Script] ===");
  } catch (error) {
    console.error("❌ Failed to send Discord notification:", error);
    process.exit(1);
  }
})();
