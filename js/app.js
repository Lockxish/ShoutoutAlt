var access_token
var broadcast_id
var shoutout_id
var onlymyclips = false
var foundClips = false
var broadcast_name
var channel
var playlistOn = false
var playlistTarget = "";
var clipLength = 30000;
var clipNumber = 0;
var pageID = "";
var TOTimer;

var app = new Vue({
    el: '#app',
    data: {
      selectedPage: 1,
      hasArgs: false,
      clipSource: "",
      playing:false,
      username: "",
      onlyme: false,
      generatedLink: "",
      shoutoutName: ""
    },
    mounted() {
      if(window.location.hash){
        this.hasArgs = true
      }

      var XML = new XMLHttpRequest();
            
      XML.open("POST", "https://id.twitch.tv/oauth2/token?client_id=txe9if6h2jfb6vz9d6gf76u969uhua&client_secret=n967c2dchypjejm16gn6umoeapdskj&grant_type=client_credentials");
      XML.send();
      XML.onload = function () {
        var obj = JSON.parse(XML.response);
        access_token = obj["access_token"]

        if(window.location.hash) {
          var parameters = window.location.hash
          parameters = parameters.replace("#", "")
          parameters = parameters.replace("@", "")
          var splitParams = parameters.split("&")

          var username = splitParams[0]
          broadcast_name = username
          if(splitParams.length > 1){
            if(splitParams[1] == "onlyme"){
              onlymyclips = true
            }
          }

          if(onlymyclips){
            console.log("Only using clips by " + username)
          }



          ComfyJS.Init( username );

          var userSearch = new XMLHttpRequest();
          var b_id
          var channels
          
          userSearch.open("GET", "https://api.twitch.tv/helix/search/channels?query=" + username);
          userSearch.setRequestHeader('Client-ID', 'txe9if6h2jfb6vz9d6gf76u969uhua');
          userSearch.setRequestHeader('Authorization', 'Bearer ' + access_token);
          userSearch.send();
    
          userSearch.onload = function () {
            channels = JSON.parse(userSearch.response).data
    
            for (x in channels) {
              if(channels[x].display_name.toLowerCase() == username.toLowerCase()){
                broadcast_id = channels[x].id
              }
            }
            
          }
        }

      }
    },
    methods: {
      generateLink: function (){

        if(this.username == ""){
          alert("Please enter a username!")
        } else {
          this.generatedLink = "https://kevinkyeh.github.io/ShoutoutAlt/#" + this.username
          if(this.onlyme){
            this.generatedLink = this.generatedLink + "&onlyme"
          }
        }
        


      }
    }

  })


  ComfyJS.onCommand = ( userId, command, message, flags, extra ) => {

      if( (flags.broadcaster || flags.mod) && (command === "playslug" || command === "playclip") && (playlistOn === false)) {
	      console.log("Playing clip " + message)

	      message = message.substring(message.lastIndexOf("/")+1)

	      var clipPlay = new XMLHttpRequest();

	      clipPlay.open("GET", "https://api.twitch.tv/helix/clips?id=" + message);
	      clipPlay.setRequestHeader('Client-ID', 'txe9if6h2jfb6vz9d6gf76u969uhua');
	      clipPlay.setRequestHeader('Authorization', 'Bearer ' + access_token);
	      clipPlay.send();

	      clipPlay.onload = function () {
		      var clip = JSON.parse(clipPlay.response).data[0].embed_url
		      var length = JSON.parse(clipPlay.response).data[0].duration * 1000

		      app.clipSource = clip
		      app.playing = true
		      clearTimeout(TOTimer)
		      TOTimer = setTimeout(stopPlayer, Math.min(length+2000, 30000));

	      }
      }
	  
    if( (flags.broadcaster || flags.mod) && (command === "soreset")) {
	    console.log("stopping player");
	    stopPlayer();
	    playlistOn = false;
	    clipNumber = 0;
    }
    
    if( (flags.broadcaster) && (command === "startplaylist")) {
	        console.log("playlist on");
		playlistOn = true;
	        clipLength = 60000;
	    	clipNumber = 0;
	        playlistTarget = message.toLowerCase()
                playlistTarget = playlistTarget.replace("@", "")			
		playPlaylist();
	}
	
	if( (flags.broadcaster) && (command === "stopplaylist")) {
		playlistOn = false;
		clipLength = 30000;
		clipNumber = 0;
		stopPlayer();
		playlistTarget = "";
		console.log("playlist off");
	}

    if( (flags.broadcaster || flags.mod) && (command === "soclip"  || (command === "so" && (broadcast_name != "kaeyay" && broadcast_name != "rennslyaer" && broadcast_name != "neko_fate" && broadcast_name != takoronron))) && (playlistOn === false)) {
	    
      message = message.toLowerCase()
      message = message.replace("@", "")
				
      console.log("username: " + broadcast_name)
      console.log("Shouting out " + message)

      app.shoutoutName = message

      var userSearch = new XMLHttpRequest();

      userSearch.open("GET", "https://api.twitch.tv/helix/search/channels?query=" + message);
      userSearch.setRequestHeader('Client-ID', 'txe9if6h2jfb6vz9d6gf76u969uhua');
      userSearch.setRequestHeader('Authorization', 'Bearer ' + access_token);
      userSearch.send();

      userSearch.onload = function () {
        channels = JSON.parse(userSearch.response).data

        for (x in channels) {
          if(channels[x].display_name.toLowerCase() == message){
            shoutout_id = channels[x].id
            getClips()
          }
        }
        
      }
    }
    
  }
    /* use a function for the exact format desired... */
    function ISODateString(d){
      function pad(n){return n<10 ? '0'+n : n}
      return d.getUTCFullYear()+'-'
           + pad(d.getUTCMonth()+1)+'-'
           + pad(d.getUTCDate())+'T'
           + pad(d.getUTCHours())+':'
           + pad(d.getUTCMinutes())+':'
           + pad(d.getUTCSeconds())+'Z'}



  function playPlaylist(){
	  if (playlistOn) {
		  console.log("running playlist command")
		  message = playlistTarget

		  console.log("Shouting out " + message)

		  app.shoutoutName = message

		  var userSearch = new XMLHttpRequest();

		  userSearch.open("GET", "https://api.twitch.tv/helix/search/channels?query=" + message + "&first=30");
		  userSearch.setRequestHeader('Client-ID', 'txe9if6h2jfb6vz9d6gf76u969uhua');
		  userSearch.setRequestHeader('Authorization', 'Bearer ' + access_token);
		  userSearch.send();

		  userSearch.onload = function () {
			channels = JSON.parse(userSearch.response).data

			for (x in channels) {
			  if(channels[x].display_name.toLowerCase() == message){
				shoutout_id = channels[x].id
				if (clipNumber < 1) {
					clipNumber = clipNumber + 1;
					console.log("clips played: " + clipNumber)
					getClips()
				} else if (clipNumber > 0 /*&& clipNumber < 2*/) {
					clipNumber = clipNumber + 1;
					console.log("clips played: " + clipNumber)
					console.log("getting MORE clips");
					getMoreClips(pageID);
				} /*else if (clipNumber === 2) {
					clipNumber = 1
					console.log("clips played: " + clipNumber)
					console.log("getting EVEN MORE clips");
					getMoreClips(pageID);*/
				//}
			  }
			}
        
		}
	  }
  }
 

  function getClips(){
    var getClips = new XMLHttpRequest();


 
    var d = new Date();
    d.setDate(d.getDate() - 31);
    console.log(ISODateString(d))

    getClips.open("GET", "https://api.twitch.tv/helix/clips?broadcaster_id=" + shoutout_id + "&first=50");
    getClips.setRequestHeader('Client-ID', 'txe9if6h2jfb6vz9d6gf76u969uhua');
    getClips.setRequestHeader('Authorization', 'Bearer ' + access_token);
    getClips.send();

    getClips.onload = function () {
      var clips = JSON.parse(getClips.response).data
      
      chooseClips(clips, JSON.parse(getClips.response).pagination.cursor)


    }
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    var res = Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    console.log("random clip select: " + res);
    return res;
  }

  async function getMoreClips(page){
    var getClips = new XMLHttpRequest();

    getClips.open("GET", "https://api.twitch.tv/helix/clips?broadcaster_id=" + shoutout_id + "&after=" + page + "&first=5");
    getClips.setRequestHeader('Client-ID', 'txe9if6h2jfb6vz9d6gf76u969uhua');
    getClips.setRequestHeader('Authorization', 'Bearer ' + access_token);
    getClips.send();

    getClips.onload = function () {
      chooseClips(JSON.parse(getClips.response).data, JSON.parse(getClips.response).pagination.cursor)
    }
  }

function chooseClips(clips, pagination){
  if(pagination != null){
    console.log("looking from " + pagination)
  }
    
    var broadcasterClips = []

    var pge = pagination
    /*if (clipNumber === 29 || clipNumber === 19) {*/
	    pageID = pge;
	    console.log("new pagination saved");
    //}

    for (x in clips){
      if(onlymyclips){
        if(clips[x].creator_name == broadcast_name){
          broadcasterClips.push(clips[x].embed_url)
          foundClips = true
          console.log("Found a clip!")
        }
      } else {
		broadcasterClips.push(clips[x].embed_url)
		foundClips = true
		console.log("Found a clip!")
      }
    }
 
      if(foundClips){
        randomClip = getRandomInt(0, (broadcasterClips.length - 1))
        app.clipSource = broadcasterClips[randomClip]
        app.playing = true
	clearTimeout(TOTimer)
        TOTimer = setTimeout(stopPlayer, Math.min(clips[randomClip].duration * 1000 + 2000, clipLength + 2000));
	if (playlistOn) { 
		setTimeout(playPlaylist, Math.min(clips[randomClip].duration * 1000 + 2000, clipLength + 2000));; 
	}
      }

      if(!foundClips && pagination != null){
        getMoreClips(pge)
      }
  }

  function stopPlayer(){
    app.playing = false
    foundClips = false
    shoutout_id = ""
    app.shoutoutName = ""
    clearTimeout(TOTimer)
  }


  

  function getTwitchClips() {
    var XML = new XMLHttpRequest();
            
    XML.open("GET", "https://api.twitch.tv/helix/clips?broadcaster_id=" + broadcast_id);
    XML.setRequestHeader('Client-ID', 'txe9if6h2jfb6vz9d6gf76u969uhua');
    XML.send();
    XML.onload = function () {
      console.log(XML.response);
    }
  }

 
