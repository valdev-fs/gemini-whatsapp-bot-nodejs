const { GoogleGenerativeAI, Part } = require("@google/generative-ai");
const fs = require("fs");
const mime = require("mime-types");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateImage(prompt, filename, imageData, mimeType) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation",
  });

  const generationConfig = {
    responseMimeType: "text/plain",
    responseModalities: ["image", "text"],
  };

  const imagePart = {
      inlineData: {
          data: imageData,
          mimeType: mimeType
      }
  };

  const parts = [
      { text: prompt },
      imagePart
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
  });

  const response = await result.response;

  if (
    response.candidates &&
    response.candidates[0].content &&
    response.candidates[0].content.parts &&
    response.candidates[0].content.parts[0].inlineData
  ) {
    const inlineData = response.candidates[0].content.parts[0].inlineData;
    const fileExtension = mime.extension(inlineData.mimeType);
    const filePath = `${filename}.${fileExtension}`;
    fs.writeFileSync(filePath, Buffer.from(inlineData.data, "base64"));
    return `File of mime type ${inlineData.mimeType} saved to: ${filePath}`;
  } else {
    return response.text();
  }
}

module.exports = { generateImage };