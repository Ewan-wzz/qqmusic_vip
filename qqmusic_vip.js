import plugin from '../../lib/plugins/plugin.js';
import { segment } from "oicq";
import fetch from "node-fetch";
import lodash from 'lodash';
import QRCode from 'qrcode';
import { createCanvas } from 'canvas';
//实现QQ音乐VIP点歌功能
//author:Ewan-wzz
//仅娱乐使用，非盈利
//构造请求头

const header = {
    "Accept": "*/*",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0",
    "Sec-Fetch-Dest": "empty",
    "Host": "ovooa.muban.plus",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
    "Connection": "keep-alive",
    "Cookie": "PHPSESSID=2ci8e8iahtn1dgkp8g57p1g417",
    "Upgrade-Insecure-Requests": "1"
}


//1.定义命名规则
export class qqmusic extends plugin {
    constructor(){
        super({
            /**功能名称*/
            name: 'QQ音乐点歌',
            dsc: '简单开发示例',
      	    /** https://oicqjs.github.io/oicq/#events */
      	    event: 'message',
      	    /** 优先级，数字越小等级越高 */
      	    priority: 50000,
            rule: [
                {
                    /**命令正则匹配*/
                    reg: "^#*点歌(.*)$",
                    /**执行方法*/
                    fnc: 'qqmusic'
                }
            ]
        })
    }
    //2.执行方法
    async qqmusic(e) {
        /** e.msg 用户的命令消息 */
        logger.info('[用户命令]', e.msg)
        /**var reg = "(?<=歌*).*$";*/
        const name = e.msg.match(/歌.*/);
        /** 接口地址 */
        let apiurl = `http://ovooa.muban.plus/API/QQ_Music_new/?msg=${name}&n=1&br=3`;
        /** 调用接口获取数据 */
        let response = await fetch(apiurl,{headers:header}).catch((err) => logger.error(err));
        /** 判断接口是否请求成功 */

        if (!response) {
            logger.error('[点歌] 接口请求失败')
            return await this.reply('点歌接口请求失败，请重试或更换接口')
        }

        /** 接口结果，json字符串转对象 */
        let res = await response.json();

        //提取返回的歌曲信息
        let picture = segment.image(res.data.picture);
        let song = res.data.song;
        let singer = res.data.singer;
        let album = res.data.album;
        let url = res.data.music;

        //定义二维码内容和参数
        let qrCodeSize = 200;
        let qrCodeText = `\n歌曲名：${song}\n歌手：${singer}\n所属专辑：${album}\n`;

        //生成二维码画布对象
        QRCode.toCanvas(createCanvas(qrCodeSize,qrCodeSize),`${url}`,(error,canvas)=>
        {
            if (error){
                console.error(error);
                return;
            }
            // 将canvas转换成二进制数据流
            const buffer = canvas.toBuffer();
            const imageSegment = segment.image(buffer);

            // 发出消息
            let msg = [
                segment.at(e.user_id),
                picture,
                segment.text(qrCodeText),
                "扫码即可播放哦～",
                imageSegment
            ];
            e.reply(msg);
            return true; //返回true阻挡消息不再往下
        });
    }
}
