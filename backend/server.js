const express = require("express");
const cors = require("cors"); // corsをインポート
const app = express();
const PORT = 8080;

// プロトタイプルートをインポート
const prototypeRoutes = require("./routes/prototype");

// CORSを有効にする
app.use(cors());

// JSONボディのパースを有効にする
app.use(express.json());

// ルートを使用
app.use("/api/prototypes", prototypeRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
