//our username 
var name; 
var connectedUser;

const users = [
   {userName: "nisha", password: "nisha", access: "video"},
   {userName: "varsha", password: "varsha", access: "audio"},
   {userName: "gagana", password: "gagana", access: "audioVideo"},
   {userName: "sowmya", password: "sowmya", access: "video"},
   {userName: "shruthi", password: "shruthi", access: "audio"},
   {userName: "a", password: "a", access: "audioVideo"}
]
  
//connecting to our signaling server
var conn = new WebSocket('ws://localhost:2020');
  
conn.onopen = function () { 
   console.log("Connected to the signaling server"); 
};
  
//when we got a message from a signaling server 
conn.onmessage = function (msg) { 
   console.log("Got message", msg.data);
	
   var data = JSON.parse(msg.data); 
	
   switch(data.type) { 
      case "login": 
         handleLogin(data.success); 
         break; 
      //when somebody wants to call us 
      case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
      case "answer": 
         handleAnswer(data.answer); 
         break; 
      //when a remote peer sends an ice candidate to us 
      case "candidate": 
         handleCandidate(data.candidate); 
         break; 
      case "leave": 
         handleLeave(); 
         break; 
      default: 
         break; 
   }
};
  
conn.onerror = function (err) { 
   console.log("Got error", err); 
};
  
//alias for sending JSON encoded messages 
function send(message) { 
   //attach the other peer username to our messages 
   if (connectedUser) { 
      message.name = connectedUser; 
   } 
	
   conn.send(JSON.stringify(message)); 
};
  
//****** 
//UI selectors block 
//******
 
var loginPage = document.querySelector('#loginPage'); 
var usernameInput = document.querySelector('#usernameInput'); 
var userpasswordInput = document.querySelector('#userpasswordInput'); 
var loginBtn = document.querySelector('#loginBtn'); 

var callPageVideo = document.querySelector('#callPageVideo');
var callPageAudio =  document.querySelector('#callPageAudio'); 
var callToUsernameInputVideo = document.querySelector('#callToUsernameInputVideo');
var callToUsernameInputAudio = document.querySelector('#callToUsernameInputAudio');
var callBtnVideo = document.querySelector('#callBtnVideo'); 
var callBtnAudio = document.querySelector('#callBtnAudio'); 
var hangUpBtnAudio = document.querySelector('#hangUpBtnAudio');
var hangUpBtnVideo = document.querySelector('#hangUpBtnVideo');
  
var localVideo = document.querySelector('#localVideo'); 
var remoteVideo = document.querySelector('#remoteVideo'); 
var localAudio = document.querySelector('#localAudio'); 
var remoteAudio = document.querySelector('#remoteAudio'); 
var audiopanel = document.querySelector('#audiopanel'); 
var audioClickBtn = document.querySelector('#audioClickBtn'); 
var onlyAudio = document.querySelector('#onlyAudio'); 
var conferenceAudio = document.querySelector('#conferenceAudio'); 
var audioVideo = document.querySelector('#audioVideo'); 

var yourConn; 
var stream;

  
// callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", function (event) {
   userName = usernameInput.value;
   password = userpasswordInput.value;

   const userData = users.filter(user => user.userName === userName);

   if(userData.length === 0) {
      alert("User doesnot exists");
   } else if(userData[0].password != password){
      alert("Password is incorrect");
   } else{
      alert("success")
      send({ 
         type: "login",
         name: userName 
      })
   } 
});
  
function handleLogin(success) { 
   const accessType = users.filter(user => user.userName === userName);
   const access = accessType[0].access
   if(access == 'video'){
      loginPage.style.display = "none"; 
      callPageVideo.style.display = "block";
      callPageAudio.style.display = "none";
      audioClickBtn.style.display = "none";
      setStream(true, true)
   } else if(access == 'audio'){
      loginPage.style.display = "none"; 
      callPageVideo.style.display = "none";
      callPageAudio.style.display = "block";
      audiopanel.style.display = "block";
      audioClickBtn.style.display = "none";
      setStream(false, true)
   } else if(access == 'audioVideo'){
      loginPage.style.display = "none"; 
      callPageVideo.style.display = "block";
      callPageAudio.style.display = "block";
      setStream(true, true)
   }
};
  

//initiating a call 
callBtnVideo.addEventListener("click", function () { 
   var callToUsername = callToUsernameInputVideo.value;
	
   if (callToUsername.length > 0) { 
	
      connectedUser = callToUsername;
		
      // create an offer 
      yourConn.createOffer(function (offer) { 
         send({ 
            type: "offer", 
            offer: offer 
         }); 
			
         yourConn.setLocalDescription(offer); 
      }, function (error) { 
         alert("Error when creating an offer"); 
      });
		
   } 
});
  
//when somebody sends us an offer 
function handleOffer(offer, name) { 
   connectedUser = name; 
   yourConn.setRemoteDescription(new RTCSessionDescription(offer));
	
   //create an answer to an offer 
   yourConn.createAnswer(function (answer) { 
      yourConn.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      alert("Error when creating an answer"); 
   }); 
};

//initiating a call 
callBtnAudio.addEventListener("click", function () { 
   var callToUsername = callToUsernameInputAudio.value; 
	
   if (callToUsername.length > 0) { 
      connectedUser = callToUsername; 
		
      // create an offer 
      yourConn.createOffer(function (offer) { 
         send({
            type: "offer", 
            offer: offer 
         }); 
			
         yourConn.setLocalDescription(offer); 
      }, function (error) { 
         alert("Error when creating an offer"); 
      }); 
   } 
});

//initiating a call 
audiopanel.addEventListener("click", function () { 
   if(stream) {
      stream.getVideoTracks() && stream.getVideoTracks()[0] && stream.getVideoTracks()[0].stop();
      // stream.getAudioTracks() && stream.getAudioTracks()[0] && stream.getAudioTracks()[0].stop();
   }
   setStream(false, true)
});
 
//when somebody sends us an offer 
function handleOffer(offer, name) { 
   connectedUser = name; 
   yourConn.setRemoteDescription(new RTCSessionDescription(offer)); 
	
   //create an answer to an offer 
   yourConn.createAnswer(function (answer) { 
      yourConn.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      });
		
   }, function (error) { 
      alert("Error when creating an answer"); 
   }); 
	
};
  
//when we got an answer from a remote user
function handleAnswer(answer) { 
   yourConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function handleCandidate(candidate) { 
   yourConn.addIceCandidate(new RTCIceCandidate(candidate)); 
};
   
//hang up 
hangUpBtnVideo.addEventListener("click", function () { 

   send({ 
      type: "leave" 
   });  
	
   handleLeave(); 
});
  
function handleLeave() { 
   connectedUser = null; 
   remoteVideo.src = null; 
	
   yourConn.close(); 
   yourConn.onicecandidate = null; 
   yourConn.onaddstream = null; 
};

function setStream(video, audio) {
   navigator.webkitGetUserMedia({ video, audio }, function (myStream) {
      stream = myStream;      

      if(video) {
         localVideo.srcObject = stream;
         localVideo.onloadedmetadata = function(e) { localVideo.play(); };
      } else{
         //displaying local audio stream on the page
         localAudio.srcObject = stream;
         localAudio.onloadedmetadata = function(e) { localAudio.play(); };
      }
      
      //using Google public stun server 
      var configuration = { 
         "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }] 
      };

      yourConn = new webkitRTCPeerConnection(configuration); 
      
      // setup stream listening 
      yourConn.addStream(stream); 
      
      //when a remote user adds stream to the peer connection, we display it 
      yourConn.onaddstream = function (e) { 
         if(video) {
            remoteVideo.srcObject = e.stream;
            remoteVideo.onloadedmetadata = function(e) { remoteVideo.play(); };
         } else { 
            remoteAudio.srcObject = e.stream;
            remoteAudio.onloadedmetadata = function(e) { remoteAudio.play(); };
         }
      }; 
      
      // Setup ice handling 
      yourConn.onicecandidate = function (event) { 
         if (event.candidate) { 
            send({ 
               type: "candidate", 
               candidate: event.candidate 
            }); 
         } 
      }; 
      
   }, function (error) { 
      console.log(error); 
   });
}
