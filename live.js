const {
    createCanvas
} = require("canvas");
const ffmpeg = require("fluent-ffmpeg");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const {
    spawn
} = require("child_process");

const width = 640;
const height = 480;
const fps = 15;
// console.log(ffmpeg,'===')
//创建一个 canvas 并获取 2D 绘图上下文
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");


// 定义一个 generateFrame 函数，它会接收一个帧序号作为参数，然后绘制帧上的文本信息，包括帧序号和当前时间，将帧内容保存为一个 PNG 图片。

const generateFrame = async (frameNum) => {
    const time = moment().format("YYYY-MM-DD HH:mm:ss");
    const text = `frame: ${frameNum}, time: ${time}`
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText(text, 10, height / 2);
    const filename = `frame-${frameNum.toString().padStart(5, "0")}.png`;
    // const filepath = path.join(__dirname, "output", filename)
    // await saveFrame(filepath);
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


const timeToLive = async () => {
    const cmd = ffmpeg()
        .input('pipe:0')
        .inputFPS(fps)
        .videoCodec('libx264')
        .size(`${width}x${height}`)
        .format('image2pipe')
        .output('rtmp://10.18.190.146:1935') // 可以使用 B 站直播姬获取第三方推流地址
        .outputOptions([
            '-f flv',
            '-b:v 500k',
            '-preset ultrafast',
        ]);
    cmd.run();
    cmd.on('error', (err) => {
        console.log(`An error occurred: ${err.message}`);
    });
    cmd.on('end', () => {
        console.log('Processing finished !');
    });
    cmd.on('start', async (commandLine) => {
        console.log(`Spawned Ffmpeg with command: ${commandLine}`);
        const args = commandLine.split(' ').slice(1);
        const process = spawn('ffmpeg', args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: true,
        });
        process.on("exit", (code, signal) => {
            console.log(`child process exited with code ${code} and signal ${signal}`);
            if (process.stdin) {
                process.stdin.end();
            }
            if (process.stdout) {
                process.stdout.destroy();
            }
            if (process.stderr) {
                process.stderr.destroy();
            }
            if (!process.killed) {
                process.kill();
            }
        });
        process.stderr.on("data", (data) => {
            console.log(`stderr: ${data}`);
        });

        const sendFrame = async () => {
            generateFrame();
            const stream = canvas.createPNGStream();
            stream.pipe(process.stdin, {
                end: false
            });
            await new Promise((resolve) => setTimeout(resolve, 1000 / (fps / 2)));
            sendFrame();
        };
    });
}

timeToLive();