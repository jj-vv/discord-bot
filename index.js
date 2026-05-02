const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

const PREFIX = '.';

const suspensions = new Map();
let suspensionIdCounter = 1;

client.on('guildMemberAdd', async (member) => {
  const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome');
  if (!channel) return;
  const embed = new EmbedBuilder()
    .setAuthor({ name: '[RLFF] Referee Department', iconURL: member.guild.iconURL() })
    .setTitle('Welcome')
    .setDescription(`<@${member.id}> Welcome to the **[RLFF] Referee Department**.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setImage('https://imgur.com/a/g94TmgW')
    .setColor(0xfdbf07);
  await channel.send({ embeds: [embed] });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'ping') return message.reply('Pong! Bot is alive.');

  if (command === 'userinfo') {
    const target = message.mentions.members.first() || message.member;
    const embed = new EmbedBuilder().setTitle('User Info').setThumbnail(target.user.displayAvatarURL({ dynamic: true })).addFields({ name: 'Username', value: target.user.tag, inline: true },{ name: 'ID', value: target.user.id, inline: true },{ name: 'Joined Server', value: target.joinedAt.toDateString(), inline: true },{ name: 'Account Created', value: target.user.createdAt.toDateString(), inline: true },{ name: 'Roles', value: target.roles.cache.map(r => r.name).filter(r => r !== '@everyone').join(', ') || 'None' }).setColor(0xfdbf07);
    return message.reply({ embeds: [embed] });
  }

  if (command === 'serverinfo') {
    const guild = message.guild;
    const embed = new EmbedBuilder().setTitle(guild.name).setThumbnail(guild.iconURL({ dynamic: true })).addFields({ name: 'Members', value: guild.memberCount.toString(), inline: true },{ name: 'Created', value: guild.createdAt.toDateString(), inline: true },{ name: 'Owner', value: '<@' + guild.ownerId + '>', inline: true }).setColor(0xfdbf07);
    return message.reply({ embeds: [embed] });
  }

  if (command === 'result') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('Only admins can post results.');
    const team1 = args[0], score1 = args[1], team2 = args[2], score2 = args[3];
    const notes = args.slice(4).join(' ') || 'No notes.';
    if (!team1 || !score1 || !team2 || !score2) return message.reply('Usage: .result TeamA 3 TeamB 1 notes');
    const channel = message.guild.channels.cache.find(ch => ch.name === 'results');
    if (!channel) return message.reply('Results channel not found!');
    const embed = new EmbedBuilder().setTitle('Match Result').setDescription('**' + team1 + '** ' + score1 + ' - ' + score2 + ' **' + team2 + '**').addFields({ name: 'Notes', value: notes }).setColor(0xfdbf07).setFooter({ text: 'Posted by ' + message.author.tag }).setTimestamp();
    await channel.send({ embeds: [embed] });
    return message.reply('Result posted!');
  }

  if (command === 'announce') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('Only admins can announce.');
    const text = args.join(' ');
    if (!text) return message.reply('Usage: .announce message');
    const channel = message.guild.channels.cache.find(ch => ch.name === 'results');
    if (!channel) return message.reply('Results channel not found!');
    const embed = new EmbedBuilder().setTitle('Announcement').setDescription(text).setColor(0xfdbf07).setFooter({ text: 'Posted by ' + message.author.tag }).setTimestamp();
    await channel.send({ embeds: [embed] });
    return message.reply('Announcement posted!');
  }

  if (command === 'kick') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('Only admins can kick.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Usage: .kick @user reason');
    const reason = args.slice(1).join(' ') || 'No reason';
    await target.kick(reason);
    return message.reply('Kicked ' + target.user.tag);
  }

  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('Only admins can ban.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Usage: .ban @user reason');
    const reason = args.slice(1).join(' ') || 'No reason';
    await target.ban({ reason });
    return message.reply('Banned ' + target.user.tag);
  }

  if (command === 'mute') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('Only admins can mute.');
    const target = message.mentions.members.first();
    const minutes = parseInt(args[1]) || 10;
    if (!target) return message.reply('Usage: .mute @user minutes');
    await target.timeout(minutes * 60 * 1000);
    return message.reply('Muted ' + target.user.tag + ' for ' + minutes + ' minutes.');
  }

  if (command === 'clear') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('Only admins can clear.');
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return message.reply('Usage: .clear 10');
    await message.channel.bulkDelete(amount + 1, true);
    const msg = await message.channel.send('Deleted ' + amount + ' messages.');
    setTimeout(() => msg.delete(), 3000);
  }

  if (command === 'role') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('Only admins can assign roles.');
    const target = message.mentions.members.first();
    const roleName = args.slice(1).join(' ');
    if (!target || !roleName) return message.reply('Usage: .role @user RoleName');
    const role = message.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return message.reply('Role not found.');
    await target.roles.add(role);
    return message.reply('Added role ' + roleName + ' to ' + target.user.tag);
  }
  if (command === 'suspend') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('Only admins can issue suspensions.');
    }

    const target = message.mentions.members.first();
    const type = args[1]?.toLowerCase();
    const permanent = args[2]?.toLowerCase();
    const reason = args.slice(3).join(' ');

    if (!target || !type || !permanent || !reason) {
      return message.reply('Usage: `.suspend @user strike/sack true/false reason`');
    }

    if (!['strike', 'sack'].includes(type)) {
      return message.reply('Type must be `strike` or `sack`.');
    }

    if (!['true', 'false'].includes(permanent)) {
      return message.reply('Permanent must be `true` or `false`.');
    }

    const userId = target.user.id;
    const currentOffenses = suspensions.get(userId) || 0;
    const newOffenses = currentOffenses + 1;
    suspensions.set(userId, newOffenses);

    const offenseText = newOffenses === 1 ? 'First' : newOffenses === 2 ? 'Second' : newOffenses === 3 ? 'Third' : `${newOffenses}th`;
    const suspensionId = suspensionIdCounter++;
    const typeText = type.charAt(0).toUpperCase() + type.slice(1);
    const permanentText = permanent.charAt(0).toUpperCase() + permanent.slice(1);

    const channel = message.guild.channels.cache.find(ch => ch.name === 'referee-strikes');
    if (!channel) return message.reply('referee-strikes channel not found!');

    const embed = new EmbedBuilder()
      .setTitle('Referee Suspension')
      .addFields(
        { name: 'Discord User', value: `${target} (${target.user.id})`, inline: false },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Offense', value: offenseText, inline: false },
        { name: 'Type', value: typeText, inline: false }
      )
      .setDescription(`-# Permanent: ${permanentText}\n-# Suspension ID: #${suspensionId}`)
      .setColor(type === 'sack' ? 0xff0000 : 0xfdbf07)
      .setFooter({ text: `Issued by ${message.author.tag}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    return message.reply(`✅ Suspension #${suspensionId} issued for ${target.user.tag} (${offenseText} offense).`);
  }
});

// Stats channels - update every 5 minutes
async function updateStats() {
  const guild = client.guilds.cache.first();
  if (!guild) return;

  await guild.members.fetch();

  const membersChannel = guild.channels.cache.find(ch => ch.name.startsWith('👥'));
  if (membersChannel) {
    await membersChannel.setName(`👥 Members: ${guild.memberCount}`);
  }

  const refereeRole = guild.roles.cache.find(r => r.name === 'RLFF | Referee');
  if (refereeRole) {
    const refChannel = guild.channels.cache.find(ch => ch.name.startsWith('🟡'));
    if (refChannel) {
      await refChannel.setName(`🟡 Referees: ${refereeRole.members.size}`);
    }
  }
}

client.once('ready', () => {
  console.log('Bot is online as ' + client.user.tag);
  updateStats();
  setInterval(updateStats, 5 * 60 * 1000); // every 5 minutes
});

const http = require('http');
http.createServer((req, res) => res.end('Bot is alive!')).listen(3000);

client.login(process.env.TOKEN);