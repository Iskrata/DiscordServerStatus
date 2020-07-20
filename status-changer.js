const Discord = require('discord.js');
const jsonfile = require('jsonfile');
const tokens = require('./tokens.js');
var channels=require("./channels.json");

const client = new Discord.Client({
	messageCacheMaxSize:1
});

const fetch = require('node-fetch');
//not working very well
//let url = "https://api.mcsrvstat.us/2/bibaland.mymcserver.org";
var url = "https://api.minetools.eu/ping/" + channels.ip
let settings = { method: "Get" };
var changes=false;

client.on('ready', () => {
	console.log('Logged in as ' + client.user.username);
	updatePresence();
    updateStatus();
	console.log("Channels in database: " + Object.keys(channels).length); 
});

client.login(tokens.bot_token);

function updatePresence(){
	client.user.setPresence({ activity: { name: "/help", status: 'online' } });
}

    
function autosave() {
	if(!changes){
		setTimeout(save,30000);
		changes=true;
	}
}


function save(){
	console.log("Auto-saving Database..");
	jsonfile.writeFile("./channels.json", channels, function (err) {
		if (err){
			console.log(err);
		}
	})
	changes=false;
	console.log("Autosave Complete");
}


function updateStatus(){
    url = "https://api.minetools.eu/ping/" + channels.ip;
    if(channels.online){
        client.channels.fetch(channels.online)
        .then(channel => { 
            if(channel){
                if(channel.manageable){
                    fetch(url, settings)
                        .then(res => res.json())
                        .then((json) => {
                            var newTitle = 'Online: ' + json.players.online;
                            if(channel.name!==newTitle){
                                console.log('Changed name to: ' + newTitle);
                                channel.setName(newTitle);
                            }else{
                                console.log('The name is not chnaged: ' + newTitle);
                            }
                    });
                }
            }
        }); 
    }
}


client.on('message', message =>{
	if(message.guild){
		if(message.content[0] === "/"){
            var messageL=message.content.toLowerCase()
            if(messageL.indexOf('/ip ') === 0){
                if(message.member.hasPermission("MANAGE_CHANNELS")) {
                    var newip = message.content.substr(4).trim();   
                    if (newip.length < 100){
                        channels["ip"] = newip;
                        url = "https://api.minetools.eu/ping/" + channels.ip
                        message.reply("Succesfully changed the ip to `" + newip + '`');
                        if (channels.online != "" && channels.ip != ""){
                            updateStatus()
                        }
                        autosave();
                    }else{
                        message.reply("The IP must be less than 100 characters long.")
                    }
                }else{
                    message.reply("You need `manage_channels` permission to do this.")
                }
            }else if(messageL === "/setonline") {
                if(message.member.hasPermission("MANAGE_CHANNELS")){
                    if (message.member.voice.channelID){
                        var voiceChannel=message.member.voice.channel;
                        if(voiceChannel.manageable){
                            message.reply("Succesfully set the online channel.")
                            channels["online"] = voiceChannel.id
                            if (channels.online != "" && channels.ip != ""){
                                updateStatus()
                            }
                            autosave();
                            
                        }else{
							message.reply("I need `manage_channels` permission to do this.")
						}
                    }else{
						message.reply("You must be in a voice channel to use this command.")
					}
                }else{
					message.reply("You need `manage_channels` permission to do this.")
				}
            }else if(messageL === "/list") {
                if(channels.ip){
                    message.reply();
                    message.channel.send("↓ online players ↓");
                    fetch(url, settings)
                        .then(res => res.json())
                        .then((json) => {
                            for (i in json.players.sample) {
                                message.channel.send(json.players.sample[i].name);
                            }
                    });
                }else{
                    message.reply("No server IP found. Try adding it with /ip {yourip}")
                }
			}else if(messageL === "/help") {
                console.log('help command decteted');
            }else if(messageL === "/status") {
                console.log('status command detected');
            }else if(messageL === "/forcerefresh" || messageL === "/fr") {
                if(message.member.hasPermission("MANAGE_CHANNELS")){
                    if (channels.online != "" && channels.ip != ""){
                        updateStatus();
                        message.reply('Succesfully ForceRefreshed the status!')
                    }else{
                        message.reply('You need to configure the ip and the online channel first!')
                    }
                }else{
                    message.reply("I need `manage_channels` permission to do this.")
                }
            }
		}
	}
})  




setInterval(() => {
    if (channels.online != "" && channels.ip != ""){
        updateStatus()
    }
}, 60000 * 5); // Runs this every 5 mins.

//ip -  bibaland.mymcserver.org
//online channel id -  727253148498132995

