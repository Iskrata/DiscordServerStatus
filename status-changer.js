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
let url = "https://api.minetools.eu/ping/51.91.61.56/41657"
let settings = { method: "Get" };

client.on('ready', () => {
	console.log('Logged in as ' + client.user.username);
	updatePresence();

	console.log("Channels in database: " + Object.keys(channels).length); 
});

client.login(tokens.bot_token);

function updatePresence(){
	client.user.setPresence({ activity: { name: "Being Mucci Gang's sugar daddy!", status: 'online' } });
}

function updateStatus(channel){
    //console.log('channel: ' + channel);
    if(channel){
        if(channel.manageable){
            fetch(url, settings)
                .then(res => res.json())
                .then((json) => {
                    var newTitle = 'Online: ' + json.players.online
                    if(channel.name!==newTitle){
                        console.log('Changed name to: ' + newTitle);
                        channel.setName(newTitle);
                    }else{
                        console.log('The name is not chnaged: ' + newTitle);
                    }
            });
        }
    }
}


client.on('message', message =>{
	if(message.guild){
		if(message.content[0]==="!"){
			var messageL=message.content.toLowerCase()
			if (messageL === "!list") {
                message.reply();
                message.channel.send("↓ online players ↓");
                fetch(url, settings)
                    .then(res => res.json())
                    .then((json) => {
                        for (i in json.players.sample) {
                            message.channel.send(json.players.sample[i].name);
                          }
                        
                });
			}
		}
	}
})

setInterval(() => {
    client.channels.fetch("727253148498132995")
        .then(channel => { 
            updateStatus(channel);
        });  
}, 60000); // Runs this every 60 seconds.


//channels.json
