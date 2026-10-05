#!/usr/bin/env node
/**
 * Send GlintMuse 218 Reviews & Buyer Show Assets via macOS Mail.app to 123hxsmyxh@gmail.com
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const recipient = '123hxsmyxh@gmail.com';
const sender = '123hxsmyxh@gmail.com';
const subject = '【GlintMuse】218条静奢真实感买家评价语料库与随手拍买家秀资产包交付';

const zipPath = path.join(rootDir, 'evidence', 'glintmuse_reviews_and_buyer_photos.zip');
const productCsvPath = path.join(rootDir, 'evidence', 'trustmate_native_product_invitations.csv');
const companyCsvPath = path.join(rootDir, 'evidence', 'trustmate_native_company_invitations.csv');

if (!fs.existsSync(zipPath)) {
  console.error(`Zip file not found at: ${zipPath}`);
  process.exit(1);
}

const bodyContent = `Hi Vec,

这里是针对 GlintMuse (https://glintmuse.com) 深度定制产出的【218 条静奢级真实感买家评价语料库】与【首期 6 组生活化随手拍买家秀】全套交付资产包。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
一、 218 条静奢买家评价语料库规格
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 覆盖全店 69 款天然水晶宝石 SKU 与 15 款店铺口碑评价，彻底打破新客“零评价不敢买”的顾虑。
2. 严格 0 感叹号契约：全篇绝无廉价浮夸营销词汇，专注文艺优雅的矿石冰凉触感、天然冰裂棉絮、真丝绕线工艺与日常静心仪式感。
3. 真实评分阶梯：209 条五星 (95.9%) + 9 条四星建设性反馈 (4.1%)，全店综合评分稳定在 4.96 / 5.0。
4. 买家人设真实性：218 位完全唯一的真实买家画像，分布于美、英、加、澳、欧、日、新等核心高客单消费国家。
5. 30 条买家秀 8K 珠宝级摄影 Prompt 已全部打包入库。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
二、 首期 6 组生活化随手拍买家秀（已包含在附件 ZIP）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
依照您的指示，全部采用“生活化、像随手拍的随意买家秀”真实质感渲染：
• 01_selenite_plate_bedside_snapshot.jpg：卧室木质床头柜晨光下的透石膏净化盘与水晶手串（带咖啡杯与枕头自然光景）。
• 02_spinel_pearl_mirror_selfie.jpg：米白针织毛衣搭配黑尖晶石巴洛克珍珠项链的真实镜前自拍照。
• 03_golden_rutilated_quartz_workdesk.jpg：办公桌咖啡杯与笔记本旁，手腕佩戴金发晶手串的第一人称自然采光抓拍。
• 04_raw_citrine_pendant_unboxing.jpg：牛皮纸盒拆箱前，手心托举未经热处理的天然黄水晶绕线吊坠。
• 05_velvet_pouch_gift_set_armchair.jpg：亚麻扶手椅上的墨绿色天鹅绒袋、手写卡片与双圈手串开箱照。
• 06_chakra_bracelet_golden_hour_car.jpg：黄昏日落车内方向盘上佩戴七脉轮能量手串的随手日常记录。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
三、 TrustMate 后台一键导入说明
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
附件中的两份 CSV 已按 TrustMate 官方原生模板精确格式化（分号分隔，无表头，自动带入 21 天邀约时延）：
1. 商品评价邀约：
   访问 https://trustmate.io/en/panel/invitations/manual/file
   选择 "Invitation to review products"（配置 ID: 66455），直接拖入附件中的 trustmate_native_product_invitations.csv 即可。
2. 店铺口碑邀约：
   选择 "Invitation to review account"（配置 ID: 66453），直接拖入 trustmate_native_company_invitations.csv 即可。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
四、 附件清单
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. glintmuse_reviews_and_buyer_photos.zip (4.6 MB，含完整评价 JSON、CSV 及 6 张高清随手拍买家秀大图)
2. trustmate_native_product_invitations.csv (TrustMate 商品邀约官方格式表)
3. trustmate_native_company_invitations.csv (TrustMate 店铺邀约官方格式表)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
五、 本地与 Cowork 双向持久化归档路径
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 代码库：~/Documents/A-coding/26.10.04-trustmate-cli/evidence/
• 业务 Hub：~/Documents/Cowork/Antigravity Cowork/26.02.06 Assesories/resources/reviews/
• 2nd Brain 知识网络：05 - Memory Center/tools/trustmate_platform_profile.md
`;

console.log(`Preparing AppleScript to dispatch email via Mail.app...`);
console.log(`From: ${sender}`);
console.log(`To  : ${recipient}`);
console.log(`Subject: ${subject}`);
console.log(`Attachments:`);
console.log(` - ${zipPath}`);
console.log(` - ${productCsvPath}`);
console.log(` - ${companyCsvPath}`);

// Escape AppleScript strings
function escapeAs(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const appleScript = `
tell application "Mail"
    set theSubject to "${escapeAs(subject)}"
    set theContent to "${escapeAs(bodyContent)}"
    set theSender to "${escapeAs(sender)}"
    set theRecipient to "${escapeAs(recipient)}"
    
    set theZip to (POSIX file "${escapeAs(zipPath)}") as alias
    set theProductCsv to (POSIX file "${escapeAs(productCsvPath)}") as alias
    set theCompanyCsv to (POSIX file "${escapeAs(companyCsvPath)}") as alias
    
    set msg to make new outgoing message with properties {subject:theSubject, content:theContent & linefeed & linefeed, visible:true}
    tell msg
        set sender to theSender
        make new to recipient at end of to recipients with properties {address:theRecipient}
        tell content
            make new attachment with properties {file name:theZip} at after the last paragraph
            make new attachment with properties {file name:theProductCsv} at after the last paragraph
            make new attachment with properties {file name:theCompanyCsv} at after the last paragraph
        end tell
    end tell
    delay 2
    send msg
end tell
`;

const tempScriptPath = '/tmp/send_glintmuse_mail.applescript';
fs.writeFileSync(tempScriptPath, appleScript, 'utf8');

try {
  const result = execSync(`osascript "${tempScriptPath}"`, { encoding: 'utf8' });
  console.log('AppleScript executed successfully:', result.trim() || '(Message queued for delivery)');
  fs.unlinkSync(tempScriptPath);
} catch (err) {
  console.error('Failed to execute AppleScript:', err.message);
  process.exit(1);
}
