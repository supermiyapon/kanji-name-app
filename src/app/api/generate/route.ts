import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたは日本語の漢字当て字（ateji）の専門家です。
外国人の名前をローマ字で受け取り、その名前に合う漢字の当て字を4パターン生成してください。

以下のJSON形式で回答してください。JSON以外のテキストは一切含めないでください。

{
  "candidates": [
    {
      "type": "簡潔型",
      "label": "Minimal",
      "kanji": "漢字",
      "reading": "カタカナ読み",
      "meaning": "各漢字の意味の説明",
      "concept": "この当て字に込められた想いやコンセプト",
      "description": "パターンの説明（なぜこの漢字を選んだか）"
    },
    {
      "type": "忠実型",
      "label": "Faithful",
      "kanji": "漢字",
      "reading": "カタカナ読み",
      "meaning": "各漢字の意味の説明",
      "concept": "この当て字に込められた想いやコンセプト",
      "description": "パターンの説明"
    },
    {
      "type": "バランス型",
      "label": "Balanced",
      "kanji": "漢字",
      "reading": "カタカナ読み",
      "meaning": "各漢字の意味の説明",
      "concept": "この当て字に込められた想いやコンセプト",
      "description": "パターンの説明"
    },
    {
      "type": "詩的型",
      "label": "Poetic",
      "kanji": "漢字",
      "reading": "カタカナ読み",
      "meaning": "各漢字の意味の説明",
      "concept": "この当て字に込められた想いやコンセプト",
      "description": "パターンの説明"
    }
  ]
}

各パターンのルール：
①簡潔型（Minimal）：2字以内。音を大まかに捉え、意味と印象を優先。日本人が見て自然に読める漢字を選ぶ。
②忠実型（Faithful）：音節をすべて漢字に対応させる。発音の再現を最優先する。
③バランス型（Balanced）：3字前後。音と意味のバランスが良い。日本人の名前に近い自然さを持つ。
④詩的型（Poetic）：字数自由。美しさや世界観を優先。タトゥーや芸術的用途に適した詩的で美しい組み合わせ。

重要な注意：
- 各漢字の読み（音読み・訓読み）が実際に存在する正しいものを使ってください
- 意味は簡潔かつ詩的に、英語で記述してください
- conceptには、その名前を持つ人への美しいメッセージを英語で込めてください
- descriptionは英語で記述してください
- meaningは英語で記述してください
- conceptは英語で記述してください`;

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter a name" },
        { status: 400 }
      );
    }

    const sanitized = name.trim().slice(0, 50);

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `次の名前の漢字当て字を4パターン生成してください: ${sanitized}`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse kanji candidates" },
        { status: 500 }
      );
    }

    const data = JSON.parse(jsonMatch[0]);

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("API Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
