import platform from "/images/platform.png";
import platformSmall from "/images/platformSmallTall.png";
import background from "/images/background.png";
import hills from "/images/hills.png";
import spriteRunLeft from "/images/spriteRunLeft.png";
import spriteRunRight from "/images/spriteRunRight.png";
import spriteStandLeft from "/images/spriteStandLeft.png";
import spriteStandRight from "/images/spriteStandRight.png";
// console.log("pl", platform);
const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

// canvas.width = innerWidth; // the window width -  window.innerWidth or innerWidth
// canvas.height = innerHeight; // the window heigth -  window.innerHeight or innerHeight
canvas.width = window.innerWidth;
canvas.height = 576;

const gravity = 0.5;

class Player {
  constructor() {
    this.speed = 10;
    this.position = {
      x: 100,
      y: 100,
    };
    this.velocity = {
      x: 0,
      y: 0,
    };
    this.width = 66;
    this.height = 150;
    this.image = createImage(spriteStandRight);
    this.frames = 0; // img frames
    this.sprites = {
      stand: {
        right: createImage(spriteStandRight),
        left: createImage(spriteStandLeft),
        cropWidth: 177,
        width: 66,
      },
      run: {
        right: createImage(spriteRunRight),
        left: createImage(spriteRunLeft),
        cropWidth: 341,
        width: 127.85,
      },
    };
    this.currentSprite = this.sprites.stand.right;
    this.currentCropWidth = 177;
  }

  draw() {
    // c.fillStyle = "black";
    // c.fillRect(this.position.x, this.position.y, this.width, this.height); -- rectangle player

    c.drawImage(
      // api not the greatest in terms of manipulation :(
      this.currentSprite,
      this.currentCropWidth * this.frames, // begin cropping top left  // this.fraames = loop through frames
      0,
      this.currentCropWidth, // crop width = width of single character
      400, // crop height
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  update() {
    this.frames++;
    if (
      this.frames > 59 &&
      (this.currentSprite === this.sprites.stand.right ||
        this.currentSprite === this.sprites.stand.left)
    ) {
      this.frames = 0;
    } else if (
      this.frames > 29 &&
      (this.currentSprite === this.sprites.run.right ||
        this.currentSprite === this.sprites.run.left)
    ) {
      this.frames = 0;
    }

    this.draw();

    this.position.x += this.velocity.x; // constantly update horizontal position
    this.position.y += this.velocity.y; // constantly update vertical position

    if (this.position.y + this.height + this.velocity.y <= canvas.height) {
      this.velocity.y += gravity; // add gravity to velocity y axis; accelerating over time
    }
    //else this.velocity.y = 0; // remove to allow death pit
  }
}

const image = new Image();
image.src = platform;
//console.log(img.substr(8));

class Platform {
  constructor({ x, y, image }) {
    this.position = {
      //x: 200, // switch to contructor values from static values
      x,
      y,
    };
    this.image = image;
    this.width = 580;
    this.height = 125;
  }

  draw() {
    // c.fillStyle = "red";
    // c.fillRect(this.position.x, this.position.y, this.width, this.height);
    c.drawImage(this.image, this.position.x, this.position.y);
    //console.log("this img", this.image.height);
  }
}

class GenericObject {
  // scenery
  constructor({ x, y, image }) {
    this.position = {
      x: -1,
      y: -1,
    };
    this.image = image;
    this.width = image.width;
    this.height = image.height;
  }

  draw() {
    c.drawImage(this.image, this.position.x, this.position.y);
  }
}

function createImage(imageSrc) {
  const image = new Image();
  image.src = imageSrc;
  return image;
}

let platformImage = createImage(platform);

let player = new Player();
//const platform = new Platform();
let platforms = [];

let genericObjects = [
  // new GenericObject({
  //   x: 0,
  //   y: 0,
  //   image: createImage(background),
  // }),
  // new GenericObject({
  //   x: 0,
  //   y: 0,
  //   image: createImage(hills),
  // }),
];

let lastKey;

const keys = {
  right: {
    pressed: false,
  },
  left: {
    pressed: false,
  },
};

let scrollOffset = 0; // how far the platforms have scrolled

function init() {
  platformImage = createImage(platform);

  player = new Player();
  //const platform = new Platform();
  // platforms = [
  //   new Platform({
  //     x: 577 * 4 + 300 + 288,
  //     y: 252,
  //     image: createImage(platformSmall),
  //   }),
  //   new Platform({
  //     x: -1,
  //     y: 452,
  //     image: platformImage,
  //   }),
  //   new Platform({
  //     x: 577,
  //     y: 452,
  //     image: platformImage,
  //   }),
  //   new Platform({
  //     x: 577 * 2 + 100,
  //     y: 452,
  //     image: platformImage,
  //   }),
  //   // new Platform({
  //   //   x: 577 * 3 + 300,
  //   //   y: 452,
  //   //   image: platformImage,
  //   // }),
  //   new Platform({
  //     x: 577 * 4 + 300,
  //     y: 452,
  //     image: platformImage,
  //   }),
  //   new Platform({
  //     x: 577 * 5 + 800,
  //     y: 452,
  //     image: platformImage,
  //   }),
  //   new Platform({
  //     x: 577 * 6 + 1200,
  //     y: 452,
  //     image: platformImage,
  //   }),
  //   new Platform({
  //     x: 577 * 6 + 1500,
  //     y: 452,
  //     image: platformImage,
  //   }),
  // ];
  platforms = [
    // Platform Start
    new Platform({
      x: -1,
      y: 452,
      image: platformImage,
    }),
    // Number 1.5
    new Platform({
      x: 577,
      y: 452,
      image: platformImage,
    }),
    //Number 2
    new Platform({
      x: 577 * 2.3 + 100,
      y: 452,
      image: platformImage,
    }),
    // Number 3
    new Platform({
      x: 577 * 3 + 220,
      y: 452,
      image: platformImage,
    }),
    // number 4 small and big
    new Platform({
      x: 577 * 4 + 300 + 210,
      y: 252,
      image: createImage(platformSmall),
    }),
    new Platform({
      x: 577 * 4 + 220,
      y: 452,
      image: platformImage,
    }),

    // number 5
    new Platform({
      x: 577 * 5 + 800,
      y: 452,
      image: platformImage,
    }),
    //numbr 6 up
    new Platform({
      x: 577 * 6 + 1200,
      y: 252,
      image: platformImage,
    }),
  ];
  genericObjects = [
    new GenericObject({
      x: 0,
      y: 0,
      image: createImage(background),
    }),
    new GenericObject({
      x: 0,
      y: 0,
      image: createImage(hills),
    }),
  ];

  scrollOffset = 0; // how far the platforms have scrolled
}

function animate() {
  requestAnimationFrame(animate);
  c.fillStyle = "white";
  c.fillRect(0, 0, canvas.width, canvas.height); // maintain the shape of object while moving

  genericObjects.forEach((genericObject) => {
    genericObject.draw();
  });
  platforms.forEach((platform) => {
    platform.draw();
  });
  player.update();

  // ---- Change Canvas Color ---- //
  // Add behind elements.
  // c.globalCompositeOperation = "destination-over";
  // // Now draw!ww
  // c.fillStyle = "black";
  // c.fillRect(0, 0, canvas.width, canvas.height);
  // ---- Change Canvas Color ---- //

  //platform.draw();

  // player move
  // if(keys.right.pressed) { // -- youtube ?
  // 	player.velocity.x = 5;
  // } else if(keys.left.pressed) {
  // 	player.velocity.x = -5;
  // } else {
  // 	player.velocity.x *= 0.9;
  // }
  if (keys.right.pressed && player.position.x < 400) {
    player.velocity.x = player.speed;
  } else if (
    (keys.left.pressed && player.position.x > 100) ||
    (keys.left.pressed && scrollOffset === 0 && player.position.x > 0)
  ) {
    player.velocity.x = -player.speed;
  } else {
    player.velocity.x = 0;
    if (keys.right.pressed) {
      // to move the platform(s)
      scrollOffset += player.speed;
      platforms.forEach((platform) => {
        platform.position.x -= player.speed;
      });

      // to move background
      genericObjects.forEach((genericObject) => {
        genericObject.position.x -= 3;
      });
    } else if (keys.left.pressed && scrollOffset > 0) {
      // to move the platform(s)
      scrollOffset -= player.speed;
      platforms.forEach((platform) => {
        platform.position.x += player.speed;
      });
      // to move background
      genericObjects.forEach((genericObject) => {
        genericObject.position.x += 3;
      });
    }
  }
  //} else player.velocity.x = 0;

  const playerRelPosY = player.position.y + player.height;
  const playerRelPosX = player.position.x + player.width;

  // platform collision detection
  platforms.forEach((platform) => {
    if (
      playerRelPosY <= platform.position.y && // for player position relative to platform
      playerRelPosY + player.velocity.y >= platform.position.y &&
      playerRelPosX >= platform.position.x && // fall back down on the left
      player.position.x <= platform.position.x + platform.width // fall back down on the right
    ) {
      player.velocity.y = 0;
    }
  });

  // sprite switching
  if (
    keys.right.pressed &&
    lastKey === "right" &&
    player.currentSprite !== player.sprites.run.right
  ) {
    player.frames = 1;
    player.currentSprite = player.sprites.run.right;
    player.currentCropWidth = player.sprites.run.cropWidth;
    player.width = player.sprites.run.width;
  } else if (
    keys.left.pressed &&
    lastKey === "left" &&
    player.currentSprite !== player.sprites.run.left
  ) {
    player.currentSprite = player.sprites.run.left;
    player.currentCropWidth = player.sprites.run.cropWidth;
    player.width = player.sprites.run.width;
  } else if (
    !keys.left.pressed &&
    lastKey === "left" &&
    player.currentSprite !== player.sprites.stand.left
  ) {
    player.currentSprite = player.sprites.stand.left;
    player.currentCropWidth = player.sprites.stand.cropWidth;
    player.width = player.sprites.stand.width;
  } else if (
    !keys.right.pressed &&
    lastKey === "right" &&
    player.currentSprite !== player.sprites.stand.right
  ) {
    player.currentSprite = player.sprites.stand.left;
    player.currentCropWidth = player.sprites.stand.cropWidth;
    player.width = player.sprites.stand.width;
  }

  // win condition
  if (scrollOffset > 577 * 5 + 800) {
    console.log("You win ");
  }
  // lose condition
  if (player.position.y > canvas.height) {
    //console.log("ou lose");
    const music = document.getElementById("music");
    music.currentTime = 0;
    init();
  }
}
init();
animate();

addEventListener("keydown", ({ key }) => {
  //console.log(key);
  switch (key) {
    case "w":
      //console.log("up");
      player.velocity.y -= 16;
      break;
    case "ArrowUp":
      //console.log("up");
      player.velocity.y -= 16;
      break;
    case "a":
      //console.log("left");
      keys.left.pressed = true;
      lastKey = "left";
      break;
    case "ArrowLeft":
      //console.log("left");
      keys.left.pressed = true;
      lastKey = "left";
      break;
    case "d":
      //console.log("right");
      keys.right.pressed = true;
      lastKey = "right";
      //player.velocity.x += 1 ;
      break;
    case "ArrowRight":
      keys.right.pressed = true;
      lastKey = "right";
      break;
  }
});

addEventListener("keyup", ({ key }) => {
  //console.log(key);
  switch (key) {
    case "w":
      //player.velocity.y -= 20;
      break;
    case "a":
      keys.left.pressed = false;
      player.currentSprite = player.sprites.stand.left;
      player.currentCropWidth = player.sprites.stand.cropWidth;
      player.width = player.sprites.stand.width;

      break;
    case "ArrowLeft":
      //console.log("up");
      keys.left.pressed = false;
      player.currentSprite = player.sprites.stand.left;
      player.currentCropWidth = player.sprites.stand.cropWidth;
      player.width = player.sprites.stand.width;
      break;
    case "d":
      //player.velocity.x = 0;
      keys.right.pressed = false;
      player.currentSprite = player.sprites.stand.right;
      player.currentCropWidth = player.sprites.stand.cropWidth;
      player.width = player.sprites.stand.width;

      break;
    case "ArrowRight":
      //console.log("up");
      keys.right.pressed = false;
      player.currentSprite = player.sprites.stand.right;
      player.currentCropWidth = player.sprites.stand.cropWidth;
      player.width = player.sprites.stand.width;
      break;
  }
});
