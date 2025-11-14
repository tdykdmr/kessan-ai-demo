"use client";

import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [businessType, setBusinessType] = useState("決算1次チェック");

  const FUNCTION_URL = process.env.NEXT_PUBLIC_FUNCTION_ENDPOINT!;

  // メッセージ送信
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          businessType: businessType,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "回答が取得できませんでした。",
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "サーバー呼び出しでエラーが発生しました。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Enterで送信（Shift+Enterは改行）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // テンプレート質問
  const templates = [
    "決算1次チェックの全体プロセスを整理して",
    "固定資産の実務フローとAI活用ポイントを説明して",
    "税効果会計の主要論点を整理して",
  ];

  // HTMLエスケープ（Word用）
  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  // Word出力（.doc形式：中身はHTML）
  const exportWord = () => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    if (assistantMessages.length === 0) return;

    const content = assistantMessages
      .map((m, idx) => `【回答${idx + 1}】\n${m.content}`)
      .join("\n\n------------------------------\n\n");

    const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <pre style="font-family: Meiryo, 'MS PGothic', sans-serif; white-space: pre-wrap;">
${escapeHtml(content)}
          </pre>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kessan-ai-answer.doc";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Excel出力（.csv形式：Excelで開ける）
  const exportExcel = () => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    if (assistantMessages.length === 0) return;

    const header = ["No", "BusinessType", "Content"];
    const rows = assistantMessages.map((m, idx) => {
      const no = String(idx + 1);
      const bt = businessType;
      const content = m.content.replace(/"/g, '""').replace(/\r?\n/g, "\\n");
      return [`"${no}"`, `"${bt}"`, `"${content}"`].join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kessan-ai-answer.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-black">
      {/* サイドバー */}
      <aside className="w-64 bg-white border-r p-4 text-black">
        <h2 className="text-lg font-semibold mb-4">業務カテゴリ</h2>

        <div className="space-y-2">
          {["決算1次チェック", "固定資産", "税効果", "開示レビュー"].map(
            (t) => (
              <button
                key={t}
                onClick={() => setBusinessType(t)}
                className={`w-full text-left px-3 py-2 rounded-md border ${
                  businessType === t
                    ? "bg-blue-600 text-white"
                    : "bg-white text-black"
                }`}
              >
                {t}
              </button>
            )
          )}
        </div>

        <h2 className="text-lg font-semibold mt-6 mb-2">テンプレート</h2>

        <div className="space-y-2">
          {templates.map((tmp, i) => (
            <button
              key={i}
              onClick={() => setInput(tmp)}
              className="w-full text-left px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-black"
            >
              {tmp}
            </button>
          ))}
        </div>
      </aside>

      {/* チャットエリア */}
      <main className="flex flex-col flex-1 text-black">
        {/* ヘッダー */}
        <div className="p-4 border-b bg-white text-lg font-semibold text-black flex items-center justify-between">
          <span>決算AIアシスタント</span>
          <span className="text-sm text-gray-500">{businessType}</span>
        </div>

        {/* メッセージ表示領域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-black">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-3xl px-4 py-2 rounded-lg border whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-lg bg-gray-200 text-black border animate-pulse">
                ...
              </div>
            </div>
          )}
        </div>

        {/* 出力ボタン＋入力欄 */}
        <div className="p-4 bg-white border-t text-black">
          <div className="flex gap-2 mb-3">
            <button
              onClick={exportWord}
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              Wordで出力
            </button>
            <button
              onClick={exportExcel}
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              Excelで出力
            </button>
          </div>

          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border rounded-lg p-3 h-24 resize-none text-black"
              placeholder="質問を入力してください（Enterで送信、Shift+Enterで改行）..."
            />

            <button
              onClick={sendMessage}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              送信
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
