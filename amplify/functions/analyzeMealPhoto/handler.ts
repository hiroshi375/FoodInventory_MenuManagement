import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Buffer } from "buffer";

declare const process: {
  env: {
    BUCKET_NAME?: string;
  };
};

const bedrockClient = new BedrockRuntimeClient({
  region: "ap-northeast-1",
});

const s3Client = new S3Client({
  region: "ap-northeast-1",
});

type RequestBody = {
  imageKey?: string;
};

const streamToUint8Array = async (stream: any): Promise<Uint8Array> => {
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

export const handler = async (event: any) => {
  try {
    console.log("analyzeMealPhoto event:", JSON.stringify(event));

    const body: RequestBody =
      event.arguments ??
      (typeof event.body === "string" ? JSON.parse(event.body) : event.body) ??
      {};

    console.log("analyzeMealPhoto body:", JSON.stringify(body));

    if (!body.imageKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "imageKey is required.",
        }),
      };
    }

    const bucketName = process.env.BUCKET_NAME;

    if (!bucketName) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "BUCKET_NAME is not set.",
        }),
      };
    }

    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: body.imageKey,
      }),
    );

    if (!s3Response.Body) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Image body is empty.",
        }),
      };
    }

    const imageBytes = await streamToUint8Array(s3Response.Body);
    const base64Image = Buffer.from(imageBytes).toString("base64");

    const prompt = `
あなたは食事写真の分析アシスタントです。
画像に写っている食事を分析し、メニュー名、説明、推定カロリー、三大栄養素を推定してください。

注意:
- 写真から分からない場合は、無理に断定せず「推定」として自然な値を入れてください。
- calories, protein, fat, carbs は数値で返してください。
- protein, fat, carbs の単位は g として扱います。
- 必ず次のJSONだけを返してください。

{
  "menuName": "メニュー名",
  "comment": "食事内容の説明",
  "calories": 0,
  "protein": 0,
  "fat": 0,
  "carbs": 0
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
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const response = await bedrockClient.send(command);

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
    console.error("analyzeMealPhoto error:", e);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "食事写真の解析に失敗しました。",
      }),
    };
  }
};
