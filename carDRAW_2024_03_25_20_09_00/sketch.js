// 20230990김대희 carDRAW 앱 제작


//플레이어 자동차 세팅
let playerCar;

let playerCarX, playerCarY; //플레이어 자동차의 초기 좌표

let carColor = [255, 150, 0]; // 플레이어 자동차의 초기 색
let carSize = 80; // 플레이어 자동차의 크기
let carSpeed = 5; // 플레이어 자동차의 속도
let carway = 0; // 플레이어 자동차 방향. 0 = w, 270 = a, 180 = s, 90 = d

let trail = []; // 자동차가 지나간 흔적의 좌표를 저장할 배열 (구 타이어 자국)
let maxTrailLength = 80; // 흔적 배열의 최대 길이
let trailTimer = 0; // 흔적을 추가하는 타이머
let trailInterval = 0.02; // 흔적 추가 간격 (초)

let rocks = []; // 돌맹이 배열
let rockImage; // 돌맹이 이미지
let rockSize = 50; // 돌맹이의 크기
let rockSpeed = 4; // 돌맹이의 속도

let oilImage;
let oils = []; // 기름통 배열
let oilSize = 40; // 기름통의 크기
let oilProbability = 0.25; // 기름통 생성 확률

let gameOver = false;

function preload()
{
  // 이미지 불러오기
  playerCar = loadImage('car.png'); //차
  rockImage = loadImage('rock.png'); //돌맹이
  oilImage = loadImage('oil.png'); //기름통
}

function setup()
{
  createCanvas(windowWidth, windowHeight);
  background(255); // 흰색 배경 설정
  
  // 플레이어 자동차 초기 위치 설정 (정 중앙)
  playerCarX = windowWidth / 2;
  playerCarY = windowHeight / 2;
}

function draw()
{
  background(255);
  
  if (gameOver == false) //게임오버 아닐때만 호출해서 게임오버 시 흰색화면이 나오도록 설정.
  {
    
    // 이때 순서가 매우 중요하다. 그림들이 서로 겹치기 때문에 위에 보여야 할 것일수록 뒤쪽에 배치.
    
    movePlayer(); //방향키, 스페이스바 이동함수
    drawTrail(); //자국그리기
    createRocks(); //돌 생성
    moveRocks(); //돌 움직이기
    createOil(); //기름통 생성
    moveOil(); //기름통 움직이기
    checkCollisions(); //충돌감지
    checkOilCollision(); //기름충돌감지. 오류발생이 많아서 따로 분리시킴.
    drawPlayer(); //가장 위에 배치되어야 할 플레이어.
  }
}


//플레이어 움직이기.
function movePlayer()
{
  //carSize / 2가 필요한 이유!!!!!!
  //이미지가 사각형에다가 크기가 자리를 차지해서 이 과정이 없으면 충돌이 제대로 감지가 안된다.
  
  //carSpeed는 처음에 속도변경 기능도 고려중이었던 고민이 남아있는 것.
  
  if (keyIsDown(87) && playerCarY > carSize / 2)
  { // w키라고 하네요.
    playerCarY -= carSpeed;
    carway = 0;
  } else if (keyIsDown(83) && playerCarY < height - carSize / 2)
  { // s
    playerCarY += carSpeed;
    carway = 180;
  } else if (keyIsDown(65) && playerCarX > carSize / 2)
  { // a
    playerCarX -= carSpeed;
    carway = 270;
  } else if (keyIsDown(68) && playerCarX < width - carSize / 2)
  { // d
    playerCarX += carSpeed;
    carway = 90;
  }
  
  if (keyIsDown(32))
  { // 스페이스 바
    carColor = [random(255), random(255), random(255)];
  }
}

//플레이어 그리기.
function drawPlayer()
{
  //push: 현 그래픽 상태 저장.
  //pop: push에 저장된 상태로 복원.
  
  //이 푸쉬팝과정이 필요한 이유:
  //이 과정이 없으면 차가 회전할 때, 회전된 상태에서 또 회전하므로 골치아파짐.
  //90+270+180... 이런식으로 되는걸 방지하기 위함.
  
  push();
  translate(playerCarX, playerCarY); //원점이동. why? 차가 차의 중심을 축으로 회전해야하기때문에
  rotate(radians(carway)); //회전 고고고
  
  //위치때문에 조정한거다. 이거 안하면 이미지 이상하게 배치된다.
  image(playerCar, -carSize / 2, -carSize / 2, carSize, carSize);
  pop();
}

//흔적그리기.
function drawTrail()
{
  trailTimer += deltaTime / 1000; //배열 딜레이 위해서 필요. 이건 나도 원리 모름.
  if (trailTimer >= trailInterval)
  {
    trail.push({x: playerCarX, y: playerCarY, color: carColor}); //trail 리스트에 (x, y, color) 값을 가지게 추가.
    if (trail.length > maxTrailLength)
    {
      trail.shift(); //배열의 첫번째 요소 제거. 이걸통해 스네이크게임 매커니즘 구현.
    }
    trailTimer = 0; //배열 딜레이 시간 초기화.
  }
  
  //전에 만들었던 TSD에서는 this.x방식으로 썼는데 여기 방식이 간단한 프로그래밍에서는 더 쉽다네요.
  for (let pos of trail) //이거는 trail배열 (x, y, color)을 순회하면서 pos변에 각각의 값을 할당하는 것.
  {
    fill(pos.color[0], pos.color[1], pos.color[2]); // trail의 색상 설정
    noStroke(); //바같선 없음요.
    ellipse(pos.x, pos.y, carSize, carSize); //자동차사이즈로 생성.
  }
}

//돌맹이그리기.
function createRocks()
{
  if (frameCount % 180 === 0)
  { // 3초마다. 60프레임 = 1초
    let x = random(width); //width는 현재 생성된 캔버스의 너비.
    let y = random(height); //마찬가지.
    let speedX = random(-rockSpeed, rockSpeed); //돌 속도에서 랜덤으로 결정.
    let speedY = random(-rockSpeed, rockSpeed); //그 결과 무작위 방향으로 이동.
    rocks.push(new Rock(x, y, speedX, speedY));
  }
}

function moveRocks()
{
  for (let rock of rocks) //rocks는 돌맹이 리스트. rock는 변수.
  {
    //rock하청존재.
    rock.move();
    rock.display();
  }
}

function checkCollisions()
{
  // 돌맹이와 플레이어 자동차 간의 충돌 체크
  for (let rock of rocks) 
  {
    if (dist(playerCarX, playerCarY, rock.x, rock.y) < (carSize + rockSize) / 2) //이렇게 해야된다네요.
    {
      gameOver = true; //게임오버.
      break;
    }
  }

  // 돌맹이와 Trail 간의 충돌 체크
  for (let rock of rocks)
  {
    for (let i = trail.length - 1; i >= 0; i--) //trail 일일이 확인. 근데 다른방법 모르겠음.
    {
      if (dist(rock.x, rock.y, trail[i].x, trail[i].y) < rockSize)
      {
        // 충돌 발생 시 해당 Trail을 배열에서 제거
        trail.splice(i, 1);
      }
    }
  }
}

//돌맹이 하청. 클래스이기 때문에 this 사용하기.
class Rock
{
  constructor(x, y, speedX, speedY)
  {
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;
  }
  
  move() {
    this.x += this.speedX;
    this.y += this.speedY;
    
    // 벽에 닿았는지 확인
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height)
    {
        // 70%의 확률로 튕기거나 사라지기
        if (random() > 0.3)
        {
            this.speedX *= -1;
            this.speedY *= -1;
        }
        else
        {
            // 돌맹이 배열에서 현재 돌맹이를 제거
            let index = rocks.indexOf(this);
            rocks.splice(index, 1);
        }
    }
}
  
  display()
  {
    image(rockImage, this.x - rockSize / 2, this.y - rockSize / 2, rockSize, rockSize); //하청움직이기.
  }
}

//기름통 만들기.
function createOil()
{
  if (random() < oilProbability && frameCount % 60 === 0)
  { // 1초마다
    let x = random(width); //돌맹이 코드 그대로.
    let y = random(height);
    oils.push(createVector(x, y));
  }
}

//기름통 움직이기.
function moveOil()
{
  for (let i = oils.length - 1; i >= 0; i--)
  {
    let oil = oils[i]; //oil은 변수, oils는 리스트.
    image(oilImage, oil.x - oilSize / 2, oil.y - oilSize / 2, oilSize, oilSize);
  }
}

//오일충돌이벤트.
function checkOilCollision()
{
  for (let i = oils.length - 1; i >= 0; i--)
  {
    let oil = oils[i];
    if (dist(playerCarX, playerCarY, oil.x, oil.y) < (carSize + oilSize) / 2)
    {
      // oil에 닿으면 maxTrailLength 증가하고 oil 삭제(oils[i]). 
      maxTrailLength += 20;
      oils.splice(i, 1);
    }
  }
}