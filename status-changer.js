const Discord = require('discord.js');
const { Attachment } = require('discord.js');
const jsonfile = require('jsonfile');
const tokens = require('./tokens.js');
const fetch = require('node-fetch');
const request = require('request');
var md5 = require('js-md5');
var channels = require("./channels.json");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const client = new Discord.Client({
	messageCacheMaxSize:1
});

// ip of the aws server:
//const hostURL = 'http://3.132.172.78'
// the domain using the aws nameservers:
const hostURL = 'http://iskrensserver.tk'
const requestInterval = 60000 * 5 // Runs every 5 minutes

//not working very well
//let url = "https://api.mcsrvstat.us/2/bibaland.mymcserver.org";
var url = `https://api.minetools.eu/ping/${channels.ip}` 
let settings = { method: "Get" };
var changes=false;

const helpEmbed = {
    "embed": {
        "description": "MineStatus is a Discord Bot that displays the status of a Minecraft server using a channel name.",
        "color": 560438,
        "footer": {
            "text": "MineStatus by Iskrata#4736"
        },
        "author": {
            "name": "MineStatus",
            "icon_url": "https://i.imgur.com/RgcBBDD.png"
        },
        "fields": [
            {
                "name": "**Basic setup**",
                "value": "First, you need to run /ip {your ip} to set the server you want to get the status from. Then use /setonline while in a channel to set the channel you are to be used for displaying the current online players in the Minecraft server.",
                "inline": false
            },
            {
                "name": "Commands",
                "value": "**/ip {your ip}**  -  Sets the Ip for the server you want to get status from\n\n**/setonline**  -  The command should be used while connected to a voice channel. When used the voice channel you are connected to will be used to display the current players in the Minecraft server\n\n**/status**  -  Displays the basic stats of the Minecraft server\n\n**/forcerefresh or /fr**  -  Force refreshes the status of the server (by default it is refreshing in every 5 minutes)\n\n**/help**  -  Displays the 4th dimension (depends on the current universe) \n\n",
                "inline": false
            }
        ]
    }
}


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

function imageExists(image_url){

    var http = new XMLHttpRequest();

    http.open('HEAD', image_url, false);
    http.send();

    return http.status != 404;

}

function updateStatus(){
    url = "https://api.minetools.eu/ping/" + channels.ip;
    if(channels.online){
        return client.channels.fetch(channels.online)
        .then(channel => { 
            if(channel){
                if(channel.manageable){
                    return fetch(url, settings)
                        .then(res => res.json())
                        .then((json) => {
                            var newTitle = 'Online: ' + json.players.online;
                            if(channel.name!==newTitle){
                                console.log('Changed name to: ' + newTitle);
                                channel.setName(newTitle);
                            }else{
                                console.log('The name is not chnaged: ' + newTitle);
                            }
                            var players = [];
                            for (i in json.players.sample) {
                                players.push(i);
                            }
                            if (players == []){
                                players = "N/A";
                            }
                            return ["online",json.players.online,"N/A",json.version.name,json.favicon];
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
                message.channel.send(helpEmbed);
                console.log('help command decteted');
            }else if(messageL === "/status") {
                    updateStatus().then(l => {
                        //console.log(l);
                        let commaPos = l[4].search(",");
                        let base64Data = l[4].substring(commaPos+1);
                        let hash = md5(base64Data);
                        console.log(`${hostURL}/${hash}.png`);
                        if (!imageExists(`${hostURL}/${hash}.png`)){
                            request.post(hostURL, {
                                form: {
                                    image: l[4]
                                }
                            })
                        }
                        
                        const statusEmbed = {
                            "embed": {
                                "title": "Server Status",
                                "color": 560438,
                                "footer": {
                                    "text": "Have fun!"
                                },
                                "thumbnail": {
                                    "url": `${hostURL}/${hash}.png`
                                    //"url": "https://i.imgur.com/el87PX3.png"
                                },
                                "fields": [
                                    {
                                        "name": "Status",
                                        "value": l[0],
                                        "inline": true
                                    },
                                    {
                                        "name": "Player Count",
                                        "value": l[1],
                                        "inline": true
                                    },
                                    {
                                        "name": "Players",
                                        "value": l[2],
                                        "inline": true
                                    },
                                    {
                                        "name": "Version",
                                        "value": l[3],
                                        "inline": true
                                    }
                                ]
                            }
                        }
                        message.channel.send(statusEmbed);
                        console.log('status command detected');
                    })  
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
}, requestInterval); 

//ip -  bibaland.mymcserver.org
//online channel id -  727253148498132995

//TODO: Replace LIST functions to STATUS comamnd

// Set a vote option (in help) afte the relase of the bot (https://top.gg/)
