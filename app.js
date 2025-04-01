const express = require("express");
const { Client, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { generateImage } = require("./gemini_image_processor");
const ngrok = require('ngrok');
const fs = require('fs').promises;
require("dotenv").config();

const app = express();
const port = 3000;

const client = new Client();

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", async (message) => {
  if (message.hasMedia) {
    const media = await message.downloadMedia();
    if (media) {
      const filename = "received_image.jpg"; //asumsi format jpg
      await fs.writeFile(filename, media.data, 'base64');
      const prompt = message.body.replace("gambar", "").trim();
      const result = await generateImage(prompt, "modified_image", media.data, media.mimetype);
      message.reply(result);
      try{
        const sendMedia = MessageMedia.fromFilePath("modified_image.png")
        client.sendMessage(message.from, sendMedia);
      } catch (e) {
        console.log(e);
      }
    }
  } else if (message.body) {
    message.reply("Silakan kirim gambar beserta deskripsi.");
  }
});

client.initialize();

(async function(){
    const url = await ngrok.connect({
        authtoken: process.env.YOUR_NGROK_AUTHTOKEN,
        addr: port
    });
    console.log("ngrok url: " + url)
})();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});