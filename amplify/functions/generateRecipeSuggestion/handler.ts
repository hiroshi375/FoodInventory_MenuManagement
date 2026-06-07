// amplify/functions/generateRecipeSuggestion/handler.ts
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: "ap-northeast-1",
});

type RequestBody = {
  menuName?: string;
  ingredients?: string[];
  category?: string;
};

export const handler = async (event: any) => {
  try {
    console.log("generateRecipeSuggestion event:", JSON.stringify(event));
    const body: RequestBody =
      event.arguments ??
      (typeof event.body === "string" ? JSON.parse(event.body) : event.body) ??
      {};
    console.log("generateRecipeSuggestion body:", JSON.stringify(body));
    const prompt = `
あなたは家庭料理のレシピ提案アシスタントです。
以下の条件から、レシピ案を1つ作成してください。

食べたいメニュー: ${body.menuName || "指定なし"}
使いたい食材: ${(body.ingredients ?? []).join("、") || "指定なし"}
ジャンル: ${body.category || "指定なし"}

必ず次のJSONだけを返してください。
{
  "title": "レシピ名",
  "description": "短い説明",
  "category": "ジャンル",
  "ingredients": ["材料1", "材料2"],
  "steps": ["手順1", "手順2", "手順3"]
}
`;

    const command = new InvokeModelCommand({
      modelId: "jp.anthropic.claude-haiku-4-5-20251001-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }],
          },
        ],
      }),
    });

    const response = await client.send(command);

    console.log(
      "Bedrock response metadata:",
      JSON.stringify(response.$metadata),
    );

    const responseText = new TextDecoder().decode(response.body);
    console.log("Bedrock response text:", responseText);

    const responseJson = JSON.parse(responseText);
    console.log("Bedrock response json:", JSON.stringify(responseJson));

    const text = responseJson.content?.[0]?.text ?? "";
    console.log("Bedrock generated text:", text);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        rawText: text,
      }),
    };
  } catch (e) {
    console.error("generateRecipeSuggestion error:", e);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "レシピ提案の生成に失敗しました。",
      }),
    };
  }
};
