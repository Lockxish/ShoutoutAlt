var access_token
var broadcast_id
var shoutout_id
var onlymyclips = false
var foundClips = false
var broadcast_name


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
      //https://id.twitch.tv/oauth2/token?client_id=uo6dggojyb8d6soh92zknwmi5ej1q2&client_secret=nyo51xcdrerl8z9m56w9w6wg&grant_type=client_credentials
      var XML = new XMLHttpRequest();
            
      XML.open("POST", "https://id.twitch.tv/oauth2/token?client_id=cjw2ewijhdkcfvm194n67pvlqvo4rr&client_secret=eprn4zv0kj7dgxnooy18zsh38vx0r6&grant_type=client_credentials");
      XML.send();
      XML.onload = function () {
        var obj = JSON.parse(XML.response);
        access_token = obj["access_token"]

        if(window.location.hash) {
          var parameters = window.location.hash
          parameters = parameters.replace("#", "")
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
          userSearch.setRequestHeader('Client-ID', 'cjw2ewijhdkcfvm194n67pvlqvo4rr');
          userSearch.setRequestHeader('Authorization', 'Bearer ' + access_token);
          userSearch.send();
    
          userSearch.onload = function () {
            channels = JSON.parse(userSearch.response).data
    
            for (x in channels) {
              if(channels[x].display_name == username){
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
          this.generatedLink = "https://tetraodone.github.io/twitchShoutOut/#" + this.username
          if(this.onlyme){
            this.generatedLink = this.generatedLink + "&onlyme"
          }
        }
        


      }
    }

  })


  ComfyJS.onCommand = ( userId, command, message, flags, extra ) => {

    if( flags.broadcaster && command === "so" ) {
      console.log("Shouting out " + message)

      app.shoutoutName = message

      var userSearch = new XMLHttpRequest();

      userSearch.open("GET", "https://api.twitch.tv/helix/search/channels?query=" + message);
      userSearch.setRequestHeader('Client-ID', 'cjw2ewijhdkcfvm194n67pvlqvo4rr');
      userSearch.setRequestHeader('Authorization', 'Bearer ' + access_token);
      userSearch.send();

      userSearch.onload = function () {
        channels = JSON.parse(userSearch.response).data

        for (x in channels) {
          if(channels[x].display_name == message){
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

  function getClips(){
    var getClips = new XMLHttpRequest();


 
    var d = new Date();
    d.setDate(d.getDate() - 31);
    console.log(ISODateString(d))

    getClips.open("GET", "https://api.twitch.tv/helix/clips?broadcaster_id=" + shoutout_id + "&first=100");
    getClips.setRequestHeader('Client-ID', 'cjw2ewijhdkcfvm194n67pvlqvo4rr');
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
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

  async function getMoreClips(page){
    var getClips = new XMLHttpRequest();

    getClips.open("GET", "https://api.twitch.tv/helix/clips?broadcaster_id=" + shoutout_id + "&after=" + page);
    getClips.setRequestHeader('Client-ID', 'cjw2ewijhdkcfvm194n67pvlqvo4rr');
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
        setTimeout(stopPlayer, 15000);
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
  }


  

  function getTwitchClips() {
    var XML = new XMLHttpRequest();
            
    XML.open("GET", "https://api.twitch.tv/helix/clips?broadcaster_id=" + broadcast_id);
    XML.setRequestHeader('Client-ID', 'cjw2ewijhdkcfvm194n67pvlqvo4rr');
    XML.send();
    XML.onload = function () {
      console.log(XML.response);
    }
  }

 
