require('dotenv').config();
const Discord = require("discord.js");
const { GatewayIntentBits } = require('discord.js');
const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const prefix = '!';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Check if the message author is not the bot itself
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'fetchlogs') {
    const channel = message.channel;

    // Fetch the messages in the channel
    const messages = await channel.messages.fetch();

    // Iterate over the messages and filter out those that don't have the dps.report link
    const logs = [];
    const uniqueLinks = []; // Create a new array to store unique links
    messages.forEach((message) => {
      if (message.content.includes('https://dps.report/')) {
        const links = message.content.match(/https:\/\/dps\.report\/\S+/g);
        links.forEach((link) => {
          const dateStart = link.indexOf('-') + 1;
          const dateEnd = link.indexOf('-', dateStart);
          const date = link.substring(dateStart, dateEnd);
          const formattedLink = `${link}\n`;
          if (!uniqueLinks.includes(link)) { // Check if the link has not been added to the array
            uniqueLinks.push(link); // Add the link to the array
            logs.push({ date, link: formattedLink });
          }
        });
      }
    });

    if (logs.length > 0) {
      const groupedLogs = groupLogsByDate(logs);
      const logsMessage = formatLogsMessage(groupedLogs);
      message.channel.send(logsMessage);
    } else {
      message.channel.send('No logs found.');
    }
  }
});

function groupLogsByDate(logs) {
  return logs.reduce((groupedLogs, log) => {
    const { date, link } = log;

    if (!groupedLogs[date]) {
      groupedLogs[date] = [];
    }

    groupedLogs[date].push(link);

    return groupedLogs;
  }, {});
}

function formatLogsMessage(groupedLogs) {
  const sortedDates = Object.keys(groupedLogs).sort();

  let message = '';

  sortedDates.forEach((date) => {
    const logs = groupedLogs[date];

    message += `${date.slice(4, 6)}.${date.slice(6, 8)}.${date.slice(0, 4)}\n`;
    message += logs.join('');

    if (sortedDates.indexOf(date) !== sortedDates.length - 1) {
      message += '\n';
    }
  });

  return message;
}
client.login(process.env.DISCORD_TOKEN);