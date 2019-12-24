// import fs from 'fs';
// import { NewableConsoleCommand } from './';
//
// const commandsFolder = `${__dirname}/commands`;
// const commandFiles = fs.readdirSync(commandsFolder).filter((file) => file.endsWith('.ts'));
//
// const cmds: NewableConsoleCommand[] = [];
//
// export async function loadCommands() {
//   if (cmds.length > 0) {
//     return cmds;
//   }
//
//   const promises = [];
//
//   for (const file of commandFiles) {
//     promises.push(import(`${commandsFolder}/${file}`));
//   }
//
//   const results = (await Promise.all(promises)).map((command: any) => command.default);
//
//   cmds.push(...results);
//
//   return cmds;
// }
