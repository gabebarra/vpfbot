import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { NewMessage, NewMessageEvent } from 'telegram/events/index.js';
import { promises as fs } from 'fs';
import { apiId, apiHash, stringSession, phoneNumber } from './credentials.js';
import input from 'input';
import { uuid } from 'uuidv4';

import sqlite3 from 'sqlite3';

(async () => {
  const client = new TelegramClient(
    new StringSession(stringSession),
    apiId,
    apiHash,
    {
      connectionRetries: 10,
    },
  );
  await client.start({
    // phoneNumber: '+5564999859851',
    //password: async () => await input.text("Please enter your password: "),
    // phoneCode: async () =>
    //   await input.text('Please enter the code you received: '),
    // onError: (err) => console.log(err),
  });
  console.log('You should now be connected.');
  //console.log(client.session.save()); // Save this string to avoid logging in again

  async function onMessage(event) {
    const filter = ['diariodetorcedor', 'diariodeinfos'];

    const chat = await event.message.getChat();
    const username = chat.username;
    const update = event.message;

    if (filter.includes(username) && update.media != null) {
      if (update.media.video) {
        const media = await client.downloadMedia(update, {
          progressCallback: console.log,
        });

        const path = '../media/' + uuid() + '.mp4';

        await fs.writeFile(path, media);

        const caption = update.message;

        let db = new sqlite3.Database('../media/db.sqlite3');

        db.run(
          `INSERT INTO media(path, caption, is_sent) VALUES(?, ?, ?)`,
          [path, caption, 0],
          function (err) {
            if (err) {
              return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been inserted with rowid ${this.lastID}`);
          },
        );

        db.close();
      }
    }
  }

  client.addEventHandler(onMessage, new NewMessage({}));
})();
