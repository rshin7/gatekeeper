const { Client, DMChannel, MessageEmbed } = require("discord.js");
const { config } = require("dotenv");
const mysql = require("mysql");

var API_KEY = '74b80a88a8c045030aa0d7e4b075692a-87c34c41-2cc336f2'; 
var DOMAIN = 'gkbot.net'; 

const mgMail = require("mailgun-js")({apiKey: API_KEY, domain: DOMAIN});

const client = new Client({
    disableEveryone: true
});

const ALPHANUM =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

config ({
    path: __dirname + "/.env"
});

var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
})

const usedCommandRecently = new Set();


con.connect(err => {
    if(err) throw err;
    console.log(`----------------------------------`);
    console.log("Connected to Database.");
});

client.on("ready", () => {
    console.log(`${client.user.username} is Online.`);
    console.log('v' + process.env.GK_VERSION)
    console.log(`----------------------------------`);
    client.user.setActivity("gkbot.net", {
        type: "LISTENING"
      });
})
client.on("message", async message => {

    const prefix = "!";

    if (!message.content.startsWith(prefix) || !message.guild || message.author.bot) return;


    const args = message.content.slice(prefix.length).split(' ');
    const cmd = args.shift().toLowerCase();

    if (cmd === 'gkemail') {
        
        con.query(`SELECT whitelist FROM whitelist WHERE server_id = '${message.guild.id}'`, (err, rows) => { // find server submitted whitelist
            if (rows.length > 0) {

            let db_whitelist = new Array(rows[0].whitelist);
            

            if (!db_whitelist.some(word => message.content.includes(word))) {
                message.author
                .createDM()
                .then(DMChannel =>
                    DMChannel
                    .send(
                        "This email is not valid for verification."
                        ).catch(reason => console.log(reason))
                )
                .catch(reason => console.log(reason));
            } else { // Passes whitelist
                if(usedCommandRecently.has(message.author.id)) {
                    message.reply('Gatekeeper has e-mailed you before - please wait.');
                    console.log(usedCommandRecently);
                } else {
                    let code = makeid(6).toUpperCase();
                    let email_address = args[0];
                    let server = message.guild.name;
    
                    sql = `INSERT INTO main (server_id, user_id, auth_code, email) VALUES ('${message.guild.id}', '${message.author.id}', '${code}', '${args[0]}')`
                    con.query(sql, console.log);
    
                    // SEND E-MAIL
                    // sendEmail(server, email_address, code)
    
                    // DEBUGGING PURPOSE
                    console.log(args[0]); // Input Email
                    console.log(code); // Random Verification Code 
                    console.log("Server ID: " + message.guild.id); // Server ID
                    console.log("User ID: " + message.author.id); // User ID
        
                    const embed = new MessageEmbed()
                        .setTitle('Gatekeeper - Email Verification Bot')
                        .setColor(0xff0000)
                        .setURL('https://www.gkbot.net/')
                        .addFields(
                            { name: message.guild.name, value: 'Check your email for your verification code and further instructions. Please check your spam/junk folders if your code is not in your inbox!!' },
                        )
                        .setFooter('Powered by Gatekeeper');
                  
                    message.author
                      .createDM()
                      .then(dmchannel =>
                        dmchannel
                          .send(embed)
                          .catch(reason => console.log(reason))
                      )
                      .catch(reason => console.log(reason));
                    usedCommandRecently.add(message.author.id);
                    
                    setTimeout(() => {
                        usedCommandRecently.delete(message.author.id)
                    }, 3600000) // one hour cooldown
                    
                    message.delete();
                    return;
                }
            } 
            } else {
                message.reply('That email domain is not on the whitelist. Visit https://www.gkbot.net for more info.');
            }
        });

    } else if (cmd === 'gkverify') {
        if(!args.length) return;
        
        user_input = args[0];

        con.query(`SELECT auth_code FROM main WHERE server_id = '${message.guild.id}' AND user_id = '${message.author.id}'`, (err, results) => {
            if(err) throw err;
            if (results.length > 0) {
                console.log('server_id: ' + message.guild.id);
                console.log('user_id: ' + message.author.id)
                let db_code = results[0].auth_code;
                console.log('usr code: ' + user_input);
                console.log('db code: ' + db_code);

                if(user_input === db_code) { // User submitted verification equals to one in database
                    con.query(`SELECT role_id FROM whitelist WHERE server_id = '${message.guild.id}'`, (err, rows) => { // find server submitted role_id
                        if(err) throw err;
                        let db_roleid = rows[0].role_id;
                        message.member.roles.add(db_roleid); 
                        // var role = message.guild.roles.cache.find(role => role.name === "Verified"); <- Alternative way
                        console.log("perfect match");
                        message.delete();
                        return;
                    })
                } else {
                    console.log("bad match");
                    return;
                }
            } else {
                // message.reply("Whitelists for this server may not set up yet.");
                return;
            }

        });
    } else if (cmd === 'gkwhitelist') { // Administrator Command
        if (!message.member.hasPermission("ADMINISTRATOR") || !args.length) {
            message.reply("Ran into a problem. Either your parameters are wrong, or you're not the Server Administrator.");
            // console.log('User is not Admin OR invalid parameters.');
            return;
        } else {
            const email_notallowed = ["@yahoo.com", "@protonmail.com", "@gmail.com", "@hotmail.com"];
            if (email_notallowed.some(word => message.content.includes(word))) {
                message.reply("Sorry but our service is not for the verification of free email providers.");
                return;
            }

            user_whitelist = args[0];
            user_role = args[1];


            sql = `SELECT * FROM whitelist WHERE server_id = '${message.guild.id}'`
            
            con.query(sql, function(err, results) {
                if (err) throw err;
                numRows = results.length;
                if (numRows = null) {
                    console.log('has it already');
                } else { // hasit
                    sql = `INSERT INTO whitelist (server_id, whitelist, role_id) VALUES ('${message.guild.id}', '${user_whitelist}', '${user_role}')`
                    con.query(sql, console.log);
                }
            });
            message.reply("Succesfully added your whitelist rule. Please note you may only have one domain whitelisted.")
        }

    } else if (cmd == 'gkhelp') {
        const embed = new MessageEmbed()
        .setTitle('Gatekeeper - Email Verification Bot')
        .setColor(0xff0000)
        .setURL('https://www.gkbot.net/')
        .addFields(
            { name: '!gkwhitelist [@domain] [roleID]', value: 'Adds desired domain and roleID to our whitelist. Can only add one domain (for now).' },
            { name: '!gkemail [email]', value: 'Sends a verification code to the given email.' },
            { name: '!gkverify [code]', value: 'Checks if inputted code matches one generated by Gatekeeper.' },
        )
        .setFooter('Powered by Gatekeeper v' + process.env.GK_VERSION);
        message.channel.send(embed);
    }

});

client.login(process.env.DTOKEN);

sendEmail = (server, email_address, code) =>
  mgMail.messages()
    .send({
      from: 'noreply@gkbot.net',
      subject: 'Gatekeeper Verification Code for ' + server,
      to: email_address,
      html: 'Discord Server: '+ server +'<br />Your verification code is: ' + code + ' <br /> Verify your account by typing in !gkverify [code] back in the server. <br /> <br />Note: This inbox is NOT monitored. For help visit our website or contact your server mods.' + '<br />Powered by <a href="https://www.gkbot.net/">Gatekeeper - Discord Server Email Verification Bot</a>'
    })
    .then(
      () => {},
      error => {
        console.log(error);
      }
    );

makeid = length =>
  [...Array(length)]
    .map(() => ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length)))
    .join("");