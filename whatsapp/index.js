import wwebjs from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = wwebjs;

import sqlite3 from 'sqlite3';
import qrcode from 'qrcode-terminal';
//import { setIntervalAsync, clearIntervalAsync } from 'set-interval-async';
import SmartInterval from 'smartinterval';

//const receiver = '556499859851-1610905290@g.us';
const receiver = '120363273020068108@g.us'; // VPF 2024

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox'],
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
  },
});

client.initialize();

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('qr', qr);
});

client.on('ready', async () => {
  console.log('Client is ready!');
  console.log('whatsapp_id', client.info.wid.user);

  let interval = new SmartInterval(async () => {
    await sendMedia();
  }, 10000);

  interval.start();
});

async function sendMedia() {
  let db = new sqlite3.Database('../media/db.sqlite3', (err) => {
    if (err) {
      console.error(err.message);
    }
  });

  const sql = 'SELECT * FROM media WHERE is_sent = 0';
  db.serialize(() => {
    db.each(sql, async (err, row) => {
      if (err) {
        console.error(err.message);
      }
      const media = MessageMedia.fromFilePath(row.path);
      const caption = row.caption;

      await client.sendMessage(receiver, media, {
        caption: caption,
      });

      console.log('Mensagem enviada!');
      console.log(caption);
    });
    db.run('UPDATE media SET is_sent = 1 WHERE is_sent = 0', async (err) => {
      if (err) {
        console.error(err.message);
      }
    });
  });

  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
  });
}
