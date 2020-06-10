var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var num = 0;
var cookieID = 0;

var messages = []
var names = [
  'User1', 'Bob', 'Alice', 'Jeffrey',
  'Megan', 'Brandon', 'Brian', 'Peter',
  'Fel', 'Bb', 'Rand', 'Jeff'
];
var connected = []
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  if(checkName(names[num]))
    socket.emit('name',names[num] + ' V2', cookieID);
  else
    socket.emit('name',names[num],cookieID);
  
  cookieID += 1;
  names[num] = names[num] + num;
  num += 1;
  if(num > 11)
    num = 0;
  socket.on('loggedIn', function(data){
    var user = new Object();
    user.nam = data.nam;
    user.id = socket.id;
    user.color = randomHsl();
    connected.push(user);
    if (messages.length > 0)
      socket.emit('chat history', messages);
    io.emit('user', connected)
  });
  
  socket.on('change name', function(newN){

    if(checkName(newN)){
      socket.emit('invalid name');
    }
    else{
      for(let i = 0; i < connected.length; i++){
        if (socket.id == connected[i].id)
          connected[i].nam = newN;
      }
    }
    
    io.emit('user', connected);
  });

  socket.on('change color', function(newC){
    for(let i = 0; i < connected.length; i++){
      if (socket.id == connected[i].id)
        connected[i].color = "#" + newC;
    }
    io.emit('user', connected);
  });

  socket.on('chat message', function(msg){
    var n = new Date();
    var time = n.getHours() + ':' + (n.getMinutes() < 10 ? '0' : '') + n.getMinutes();
    var color;
    var user;
    for(let i = 0; i < connected.length; i++){
      if (socket.id == connected[i].id){
        user = connected[i].nam;
        color = connected[i].color;
      }
    }
    var wholeMes = new Object();
    wholeMes.tim = time;
    wholeMes.user = user;
    wholeMes.mes = msg;
    wholeMes.color = color;
    messages.push(wholeMes);
    if(messages.length > 200) messsages.shift();
    io.emit('chat message', msg, user, time, color);
  });

  socket.on('disconnect', function(){
    
    var i = 0;
    while(i < connected.length){
      if(connected[i].id == socket.id){
        connected.splice(i,1);
        break;
      }
      i+= 1;
    }
    
    io.emit('user', connected);
    
  });


});
// checks if name is unique
function checkName(name) {
  for(let i = 0; i < connected.length; i++){
    if(name == connected[i].nam){
      return true;
    }
  }
  return false;
}

function randomHsl() {
  return 'hsla(' + (Math.random() * 360) + ', 100%, 50%, 1)'; //https://stackoverflow.com/questions/1484506/random-color-generator
};

http.listen(3000, function(){
  console.log('listening on *:3000');
});