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
    console.log("generateGrocerySuggestion event:", JSON.stringify(event));

    const body: RequestBody =
      event.arguments ??
      (typeof event.body === "string" ? JSON.parse(event.body) : event.body) ??
      {};

    console.log("generateGrocerySuggestion body:", JSON.stringify(body));

    const prompt = `
あなたは家庭の買い物リスト提案アシスタントです。
以下の条件から、買うべき食材を提案してください。

作りたいメニュー: ${body.menuName || "指定なし"}
現在入力された食材・候補: ${(body.ingredients ?? []).join("、") || "指定なし"}
ジャンル: ${body.category || "指定なし"}

不足しそうな食材を中心に、買うものを5〜10個提案してください。

必ず次のJSONだけを返してください。
{
  "title": "買い物提案タイトル",
  "description": "短い説明",
  "items": ["買うもの1", "買うもの2", "買うもの3"]
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
    const rawText = responseJson.content?.[0]?.text ?? "";

    console.log("Bedrock generated text:", rawText);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        rawText,
      }),
    };
  } catch (e) {
    console.error("generateGrocerySuggestion error:", e);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "買うもの提案の生成に失敗しました。",
      }),
    };
  }
};
