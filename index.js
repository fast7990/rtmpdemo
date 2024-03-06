/*
 * @Author: v-huangshaopeng v-huangshaopeng@360.cn
 * @Date: 2024-03-06 10:08:01
 * @LastEditors: v-huangshaopeng v-huangshaopeng@360.cn
 * @LastEditTime: 2024-03-06 14:38:34
 * @FilePath: \rtmpdemo\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const {
    createCanvas
} = require("canvas");
const ffmpeg = require("fluent-ffmpeg");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const width = 640;
const height = 480;
const fps = 15;
// console.log(ffmpeg,'===')
//创建一个 canvas 并获取 2D 绘图上下文
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");


// 定义一个 gerneateFrame 函数，它会接收一个帧序号作为参数，然后绘制帧上的文本信息，包括帧序号和当前时间，将帧内容保存为一个 PNG 图片。
const gerneateFrame = async (frameNum) => {
    const time = moment().format("YYYY-MM-DD HH:mm:ss");
    const text = `frame: ${frameNum}, time: ${time}`
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText(text, 10, height / 2);
    const filename = `frame-${frameNum.toString().padStart(5, "0")}.png`;
    const filepath = path.join(__dirname, "output", filename)
    await saveFrame(filepath);
    console.log(`frame ${frameNum} generated`);
};


// 定义一个 saveFrame 函数，它会将生成的 PNG 图片保存到指定的文件路径。
const saveFrame = (filepath) => {
    return new Promise((resolve, reject) => {
        const out = fs.createWriteStream(filepath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        out.on("finish", () => {
            resolve();
        });
    });
};
// 定义一个 generateVideo 函数，它会使用 ffmpeg 将生成的 PNG 图片合成一个 MP4 视频文件。
const generateVideo = () => {
    const cmd = ffmpeg()
        .input(path.join(__dirname, "output", "frame-%05d.png"))
        .inputFPS(fps)
        .videoCodec("libx264")
        .output(path.join(__dirname, "output", "output.mp4"))
        .on("start", () => {
            console.log("video generating...");
        })
        .on("progress", (progress) => {
            console.log(`video progress: ${progress.percent||0}%`);
        })
        .on("end", () => {
            console.log("video generated");
        })
        .on("error", (err) => {
            console.log("video error:", err);
        });
    cmd.run();
};
// 最后，我们定义一个 generateFrames 函数，它会生成 100 帧 PNG 图片，然后调用 generateVideo 函数生成视频。然后，调用 generateFrames 函数来执行整个流程。
const generateFrames = async () => {
    for (let i = 0; i < 100; i++) {
        await gerneateFrame(i)
    }
    generateVideo();
}
generateFrames()