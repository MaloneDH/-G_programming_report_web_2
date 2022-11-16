const canvas = document.getElementById("canvas-top"); //canvas tag 

const ctx = canvas.getContext("2d"); //드로잉 컨텍스트 설정

const root = document.documentElement;

const s_btn = document.getElementById("to_game");
const o_btn = document.getElementById("to_option");
const c_btn = document.getElementById("to_credit");
const o_h_btn = document.getElementById("option_main");
const c_h_btn = document.getElementById("credit_main");
const light=document.getElementById("day");
const night=document.getElementById("night");
const restartBtn = document.getElementById("restart");
const exitBtn=document.getElementById("exit");
const normalMode=document.getElementById("normal");
const hardMode=document.getElementById("hard");

const audio = new Audio('sound/bgm.mp3');           //브금
const effect = new Audio('sound/effect.mp3 ');      //효과음
const hit = new Audio('sound/hit.mp3');             //피격음
//const mbgm = new Audio('sound/MainBgm.mp3');

let isPause = false;                              //일시정지 변수
let isStart = false;

const menu = document.getElementById("menu");                 //menu 화면
const game = document.getElementById("game");                 //game 화면
const option = document.getElementById("option");             //option 화면
const credit = document.getElementById("credit");             //credit 화면

const appendTens = document.getElementById("tens");            //초
const appendSeconds = document.getElementById("seconds");     //소수이하 초 
const pauseGame= document.getElementById("pause_page");       //일시정지
const setModal = document.querySelector(".modal");            //모달 바탕
const gameResult= document.getElementById("result_game");      //모달 부분
const hp=document.getElementById("HP");

let difficulty = 0;

s_btn.addEventListener('click', ()=>{       
  mbgm.muted=true;                  
  menu.style.display='none';              //main->game
  game.style.display='block';
  gameState = {                   
    rectPosX: 10,                     
    rectPosY: canvas.height / 2 - 10, 
    rectVelocity: { x: 0, y: 0 },     
    playerSpeed: (difficulty)?1.0:0.5,                 
    enemyTimeout: 60,                 
    enemyTimeoutInit: 60,
    enemySpeed: 1,                    
    enemies: [],                      
    friends: [],                      
    friendAdded:false,
    score: 0,
    life: 100
  };
  fps=setInterval(function(){
    update();
    stopwatch();
  }, 20);
});

o_btn.onclick=()=>{
  menu.style.display = 'none';
  option.style.display = 'block';
};

o_h_btn.onclick=()=>{
  option.style.display = 'none';
  menu.style.display = 'block';
};

c_btn.addEventListener('click', ()=>{                         //main->credit
  menu.style.display = 'none';
  credit.style.display = 'block';
});

c_h_btn.onclick=()=>{
  credit.style.display = 'none';
  menu.style.display = 'block';
};

day.onclick=()=>{
  root.style.setProperty('--back-color', "white");
  root.style.setProperty('--letter-color', "black");
}

night.onclick=()=>{
  root.style.setProperty('--back-color', "black");
  root.style.setProperty('--letter-color', "white");
}

normalMode.onclick = () => difficulty = 0;
hardMode.onclick = () => difficulty = 1;

let gameState = {                   //게임의 필요한 정보 
  rectPosX: 10,                     //플레이어 위치(x)
  rectPosY: canvas.height / 2 - 10, //플레이어 위치(y)
  rectVelocity: { x: 0, y: 0 },     //플레이어 방향
  playerSpeed: (difficulty)?1.0:0.5,                 //플레이어 속도
  enemyTimeout: 60,                 
  enemyTimeoutInit: 60,             
  enemySpeed: 1,                    //블럭 속도
  enemies: [],                      //적
  friends: [],                      //아이템
  friendAdded:false,                
  score: 0,
  life: 100
};

function random(n) { // 정수 생성
  return Math.floor(Math.random() * n); //Math.random() =  0 ~ 1 소수 출력
}                                       //Math.floor()  = 반올림

let time = { seconds : 00, tens : 00 };                   //타이머 변수 

function stopwatch(){
  time.tens++; 

  if(time.tens <= 9){
    appendTens.innerHTML = "0" + time.tens;
  }
    
  if (time.tens > 9){
    appendTens.innerHTML = time.tens;    
  } 
    
  if (time.tens > 99) {
    //console.log("seconds");
    time.seconds++;
    appendSeconds.innerHTML = "0" + time.seconds;
    time.tens = 0;
    appendTens.innerHTML = "0" + 0;
  }
    
  if (time.seconds > 9){
    appendSeconds.innerHTML = time.seconds;
  }
}

class RectCollider {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  isColliding(rectCollider) { //충돌 검사 
    if (
      this.x < rectCollider.x + rectCollider.width &&
      this.x + this.width > rectCollider.x &&
      this.y < rectCollider.y + rectCollider.height &&
      this.height + this.y > rectCollider.y
    ) {
      return true;
    }
    return false;
  }
}

function checkCollision(gameState) { //충돌검사 
  let playerCollider = new RectCollider( //플레이어 선언
    gameState.rectPosX, //x
    gameState.rectPosY, //y
    10,                 //width
    10                  //height
  );
  
  for (let i = 0; i < gameState.enemies.length; ++i ) {
    let enemyCollider = new RectCollider( //적 선언
      gameState.enemies[i].x, //x
      gameState.enemies[i].y, //y
      10,                     //width
      10                      //height
    );
    if (playerCollider.isColliding(enemyCollider)) { //피격 판정 
      return true; //사망
    }
  }

  for (let i = 0; i < gameState.friends.length; ++i) {
    let friendCollider = new RectCollider( //점수 먹기 
      gameState.friends[i].x,
      gameState.friends[i].y,
      5,
      5
    );
    if (playerCollider.isColliding(friendCollider)) {
      effect.play();                                                  //효과음 내기 
      gameState.playerSpeed*=1.05;
      gameState.friends.splice(i, 1);
    }
  }
}

function update() { //게임 실행 
  audio.play();                                                       //브금 틀기                                               //브금 끄기 완성할떄 해제;
  ctx.clearRect(0, 0, canvas.width, canvas.height);                   //캔버스 시작위치, 크기 

  gameState.enemyTimeout -= 1; 
  
  if (gameState.enemyTimeout == 0) {                                 //적 생성 
    gameState.enemyTimeout = Math.floor(gameState.enemyTimeoutInit);
    gameState.enemies.push({
      x: canvas.width,
      y: random(canvas.height),
      velocity: gameState.enemySpeed
    });
    gameState.enemySpeed *= 1.001;
    gameState.enemyTimeoutInit = gameState.enemyTimeoutInit * 0.999; 
    //console.log('time:'+gameState.enemyTimeout)
    //console.log('timeout:'+gameState.enemyTimeoutInit);
    //console.log('speed:'+gameState.enemySpeed);
  }

  ctx.fillStyle = "#FF0000";                                          //도형을 채우는 색(플레이어)
  
  gameState.rectPosX += gameState.rectVelocity.x;
  gameState.rectPosY += gameState.rectVelocity.y;
  
  if (gameState.rectPosX > canvas.width - 10) {                      //넘어가면 움직임 멈춤       
    gameState.rectPosX = canvas.width - 10;
    gameState.rectVelocity.x = 0;
  }
  if (gameState.rectPosX < 0) {
    gameState.rectPosX = 0;
    gameState.rectVelocity.x = 0;
  }
  if (gameState.rectPosY < 0) {
    gameState.rectPosY = 0;
    gameState.rectVelocity.y = 0;
  }
  if (gameState.rectPosY > canvas.height - 10) {
    gameState.rectPosY = canvas.height - 10;
    gameState.rectVelocity.y = 0;
  }
  
  ctx.fillRect(gameState.rectPosX, gameState.rectPosY, 10, 10);     //플레이어 생성
  
  ctx.fillStyle = "#0000FF";                                        
  for (let i = 0; i < gameState.enemies.length; ++i) {
    gameState.enemies[i].x -= gameState.enemies[i].velocity;
    ctx.fillRect(gameState.enemies[i].x, gameState.enemies[i].y, 10, 10); //적 생성 
  }
  for (let i = 0; i < gameState.enemies.length; ++i) { //적이 넘어가면 사라지고 점수가 오른다.
    if (gameState.enemies[i].x < -10) {
      gameState.enemies.splice(i, 1);
      gameState.score++;
    }
  }

  document.getElementById("score").innerHTML = "score: " + gameState.score; //점수 반환 

  if(gameState.score%10 == 0 && gameState.friendAdded == false){            //아이템 생성
    gameState.friends.push({
      x: random(canvas.width-20),
      y: random(canvas.height-20),
    });
    gameState.friendAdded = true;
  }

  if(gameState.score%10 == 1 && gameState.friendAdded == true){
    gameState.friendAdded = false;
  }

  for (let i = 0; i < gameState.friends.length; ++i) {                   //아이템 생성 
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(gameState.friends[i].x, gameState.friends[i].y, 5, 5); 
  }

  hp.innerHTML="Life : "+gameState.life + "%";

  if(checkCollision(gameState)==true){
    hit.play();
    gameState.life--;
    if(gameState.life==-1){
      clearInterval(fps);
      setModal.style.display='block';
      gameResult.innerHTML='점수 : '+gameState.score+'<br> 시간 : '+time.seconds+'초';
      restartBtn.addEventListener('click', ()=>{    //재시작 버튼
        audio.muted=true;
        setModal.style.display='none';
        game.style.display='none';
        menu.style.display='block';
        //mbgm.play();
      });
      exitBtn.addEventListener('click', ()=>{
        window.close();
      });
    }
  }
}

let fps=setInterval(function(){
  update();
  stopwatch();
}, 20);
clearInterval(fps);

document.addEventListener("keydown", function(event) {
  if (event.keyCode == 39) {
    //right arrow
    gameState.rectVelocity.x = gameState.playerSpeed;
  }
  if (event.keyCode == 37) {
    //left arrow
    gameState.rectVelocity.x = -gameState.playerSpeed;
  }
  if (event.keyCode == 40) {
    //up arrow
    gameState.rectVelocity.y = gameState.playerSpeed;
  }
  if (event.keyCode == 38) {
    //down arrow
    gameState.rectVelocity.y = -gameState.playerSpeed;
  }
  if (event.keyCode == 27) {
    isPause=!isPause;
    if(isPause){
      clearInterval(fps);
      pauseGame.style.visibility = "visible";
    }
    else{
      fps=setInterval(function(){
        update();
        stopwatch();
      }, 20);
      pauseGame.style.visibility = "hidden";
    }
  }
});