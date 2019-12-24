import { App } from './app';

const app = new App();

app.run().then(() => process.exit(0));

// import Discord from 'discord.js';
// import fs from 'fs';
//
// const client = new Discord.Client();
// const commands = new Discord.Collection();
//
// const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter((file) => file.endsWith('.js'));
//
// client.on('error', () => {
//   console.log('Error!');
// });
//
// client.once('ready', () => {
//   console.log('Ready!');
//   client.user.setStatus('online');
// });
//
// client.login('NTI4ODIxNjA5MDU0NzMyMjkx.XewE7Q.EAtP5TJiIfznRU45z_zQ0qBnh_c');
