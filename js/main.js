// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode

// PLAN
// Start Screen: Pick Beginner (8x8, 10), Intermediate (16x16, 40), Expert (30x16, 99), Custom (you choose)
// Game Starts via GenerateBoard()
// On first click, you want to not click a mine. So after first click, call GenerateMinesAndNumbers()
// Left mouse click to remove item, right mouse button to set flag or question mark. Right clicking on an already placed flag/question removes it
// Click space to switch between flag and question mark mode for right mouse click

"use strict";
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xd3d3d3
});
document.body.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// aliases
let stage;

// game variables
let startScene,variantScene,customScene,rulesScene,documentScene;
let gameScene,scoreLabel,flagLabel,timeLabel,face,variantLabel,variantSubLabel,customSubLabel,rulePhoto;

let explosionTextures;
let explosions = [];
let digSound, boomSound, victorySound;
let paused = true;

//The 2D array that holds all the info
let gameBoard;
let boardWidth = 3;
let boardHeight = 3;
let cusBoardWidth = 3;
let cusBoardHeight = 3;
let mineCount = 0;
let normalMineCount = 0;
let doubleMineCount = 0;
let radioactiveMineCount = 0;
let antiMineCount = 0;
let nightMineCount = 0;
let tileCount;
let gameMode = "Normal";
let lastGameMode = "Normal";
let safetyClick = true;
let intervalId = 0;

//Labels for custom game
let cusHeightLabel, cusWidthLabel, cusNormalLabel, 
    cusDoubleLabel, cusRadLabel, cusAntiLabel, cusNightLabel;

//These two arrays hold all of the tiles
let tileList = [];
let coveredTileList = [];
let mineList = [];
let savedRadioactive = [];
let wallList = [];

// Disables context menu so right click places a flag
document.addEventListener('contextmenu', event => event.preventDefault());

// NEW FUNCTIONS
// Creates the 2D board of tiles. Simply creates the 2D array that will store all of the data.
function GenerateBoard(width, height) {
    ClearBoard();
    gameBoard = [];
    boardWidth = width;
    boardHeight = height;
    for (let i = 0; i < boardHeight; i++) {
        let data = [];
        for (let j = 0; j < boardWidth; j++) {
            data.push("e");
        }
        gameBoard.push(data);
    }

    tileCount = boardHeight * boardWidth;
    //console.log(gameBoard);
}

// Creates the Cover Sprites that go on top of the number and mine sprites. These handle all of the clicking input
// The mines and numbers have no other purpose than looks. This function also creates the borders around the game
// board, and creates the Smiley Face button, as well as positioning the flag count and timer
function GenerateCovers() {
    let tempData;
    let tempFile;

    // If there is at least one Night Mine in play, we use the Night Tiles. When in Night Mode, you can't place flags on
    // night tiles. You also loose the reveal adjacent functionality, meaning that every tile could be your last.
    // This is to make Night Mines more scarier, since they can "suddenly appear", since they effect number tiles that aren't adjacent
    if (CoveredTile.nightMode == true) {
        tempData = "night";
        tempFile = "images/NightCoveredTile.png";
    }
    else {
        tempData = "cover";
        tempFile = "images/CoveredTile.png";
    }

    for (let i = 0; i < boardHeight; i++) {
        let coveredTilesData = [];
        for (let j = 0; j < boardWidth; j++) {
            let newWidth = (app.screen.width / 2) - ((boardWidth / 2) * 32);
            let newHeight = (app.screen.height / 2) - ((boardHeight / 2) * 32 - 50);
            let coverTile = new CoveredTile(newWidth + j * 32, newHeight + i * 32, j, i, tempFile, tempData);
            coveredTileList.push(coverTile);
            gameScene.addChild(coverTile);
            coveredTilesData.push(coverTile);
        }
        CoveredTile.coveredBoard.push(coveredTilesData);
    }
    //console.log(CoveredTile.coveredBoard);

    //Creates the border and the Smiley face button
    //top left corner
    let wall = new Tile(CoveredTile.coveredBoard[0][0].x - 27, CoveredTile.coveredBoard[0][0].y - 135, 0, 0, "images/WhiteCornerTile.png", "w");
    wallList.push(wall);
    gameScene.addChild(wall);
    //top right corner
    wall = new Tile(CoveredTile.coveredBoard[0][boardWidth - 1].x + 27, CoveredTile.coveredBoard[0][boardWidth - 1].y - 135, 0, 0, "images/MixedCornerTile.png", "w");
    wall.scale.y = -1;
    wall.rotation = Math.PI / 2;
    wallList.push(wall);
    gameScene.addChild(wall);
    //left intersection
    wall = new Tile(CoveredTile.coveredBoard[0][0].x - 27, CoveredTile.coveredBoard[0][0].y - 27, 0, 0, "images/LeftIntersectionTile.png", "w");
    wallList.push(wall);
    gameScene.addChild(wall);
    //rightintersection
    wall = new Tile(CoveredTile.coveredBoard[0][boardWidth - 1].x + 27, CoveredTile.coveredBoard[0][boardWidth - 1].y - 27, 0, 0, "images/RightIntersectionTile.png", "w");
    wallList.push(wall);
    gameScene.addChild(wall);
    //bottom left corner
    wall = new Tile(CoveredTile.coveredBoard[boardHeight - 1][0].x - 27, CoveredTile.coveredBoard[boardHeight - 1][0].y + 27, 0, 0, "images/MixedCornerTile.png", "w");
    wallList.push(wall);
    gameScene.addChild(wall);
    //bottom right corner
    wall = new Tile(CoveredTile.coveredBoard[boardHeight - 1][boardWidth - 1].x + 27, CoveredTile.coveredBoard[boardHeight - 1][boardWidth - 1].y + 27, 0, 0, "images/BlackCornerTile.png", "w");
    wallList.push(wall);
    gameScene.addChild(wall);
    //The walls that surround the UI
    wall = new Tile(CoveredTile.coveredBoard[0][0].x - 27, CoveredTile.coveredBoard[0][0].y - 54, 0, 0, "images/WallTile.png", "w");
    wall.rotation = Math.PI;
    wallList.push(wall);
    gameScene.addChild(wall);

    wall = new Tile(CoveredTile.coveredBoard[0][boardWidth - 1].x + 27, CoveredTile.coveredBoard[0][boardWidth - 1].y  - 54, 0, 0, "images/WallTile.png", "w");
    wall.rotation = Math.PI;
    wallList.push(wall);
    gameScene.addChild(wall);

    wall = new Tile(CoveredTile.coveredBoard[0][0].x - 27, CoveredTile.coveredBoard[0][0].y - 81, 0, 0, "images/WallTile.png", "w");
    wall.rotation = Math.PI;
    wallList.push(wall);
    gameScene.addChild(wall);

    //Hides the flags count and timer if the column count is less than five
    if (boardWidth <= 5) {
        flagLabel.x = 10000;
    }
    else if (boardWidth == 6 || boardWidth == 7) {
        flagLabel.x = CoveredTile.coveredBoard[0][0].x + 15;
        flagLabel.y = CoveredTile.coveredBoard[0][0].y - 81;
    }
    else {
        flagLabel.x = CoveredTile.coveredBoard[0][0].x + 30;
        flagLabel.y = CoveredTile.coveredBoard[0][0].y - 81;
    }

    wall = new Tile(CoveredTile.coveredBoard[0][boardWidth - 1].x + 27, CoveredTile.coveredBoard[0][boardWidth - 1].y - 81, 0, 0, "images/WallTile.png", "w");
    wall.rotation = Math.PI;
    wallList.push(wall);
    gameScene.addChild(wall);

    if (boardWidth <= 5) {
        timeLabel.x = 10000;
    }
    else if (boardWidth == 6 || boardWidth == 7) {
        timeLabel.x = CoveredTile.coveredBoard[0][boardWidth - 1].x - 15;
        timeLabel.y = CoveredTile.coveredBoard[0][boardWidth - 1].y - 81;
    }
    else {
        timeLabel.x = CoveredTile.coveredBoard[0][boardWidth - 1].x - 30;
        timeLabel.y = CoveredTile.coveredBoard[0][boardWidth - 1].y - 81;
    }

    wall = new Tile(CoveredTile.coveredBoard[0][0].x - 27, CoveredTile.coveredBoard[0][0].y - 108, 0, 0, "images/WallTile.png", "w");
    wall.rotation = Math.PI;
    wallList.push(wall);
    gameScene.addChild(wall);

    wall = new Tile(CoveredTile.coveredBoard[0][boardWidth - 1].x + 27, CoveredTile.coveredBoard[0][boardWidth - 1].y - 108, 0, 0, "images/WallTile.png", "w");
    wall.rotation = Math.PI;
    wallList.push(wall);
    gameScene.addChild(wall);

    //floor and ceiling walls
    for (let i = 0; i < boardWidth; i++) {
        wall = new Tile(CoveredTile.coveredBoard[0][i].x, CoveredTile.coveredBoard[0][i].y - 27, 0, 0, "images/WallTile.png", "w");
        wall.rotation = -Math.PI / 2;
        wallList.push(wall);
        gameScene.addChild(wall);

        wall = new Tile(CoveredTile.coveredBoard[0][i].x, CoveredTile.coveredBoard[0][i].y - 135, 0, 0, "images/WallTile.png", "w");
        wall.rotation = -Math.PI / 2;
        wallList.push(wall);
        gameScene.addChild(wall);

        wall = new Tile(CoveredTile.coveredBoard[boardHeight - 1][i].x, CoveredTile.coveredBoard[boardHeight - 1][i].y + 27, 0, 0, "images/WallTile.png", "w");
        wall.rotation = -Math.PI / 2;
        wallList.push(wall);
        gameScene.addChild(wall);
    }
    //left and right walls
    for (let i = 0; i < boardHeight; i++) {
        wall = new Tile(CoveredTile.coveredBoard[i][0].x - 27, CoveredTile.coveredBoard[i][0].y, 0, 0, "images/WallTile.png", "w");
        wall.rotation = Math.PI;
        wallList.push(wall);
        gameScene.addChild(wall);

        wall = new Tile(CoveredTile.coveredBoard[i][boardWidth - 1].x + 27, CoveredTile.coveredBoard[i][boardWidth - 1].y, 0, 0, "images/WallTile.png", "w");
        wall.rotation = Math.PI;
        wallList.push(wall);
        gameScene.addChild(wall);
    }

    //Add the face sprite
    face = new PIXI.Sprite.from("images/HappyFace.png");
    face.anchor.set(0.5);
    face.x = (wallList[0].x + wallList[1].x) / 2;
    face.y = CoveredTile.coveredBoard[0][0].y - 80;
    face.interactive = true;
    face.on('mousedown', () => {
        face.texture = PIXI.Texture.from('images/ClickedFace.png');
    })
    face.on('mouseupoutside', () => {
        face.texture = PIXI.Texture.from('images/HappyFace.png');
    })
    face.on('click', () => {
        startGame(boardWidth, boardHeight, mineCount);
    })
    CoveredTile.face = face;
    wallList.push(face);
    gameScene.addChild(face);

}

// Adds mines and numbers to the gameScene by using the custom Tile class. It first chooses what mines to place based on 
// the gameMode. Depending on what mine types are in play, different flag options will become available. Afterwards, it
// will place the mine randomly (making sure it isn't placed on another mine). Then, it will add the numbers to the surrounding
// tiles (depending on what type of mine it is). Finally, using a giant switch statement, it will set the tile to the correct image.
// Because of how many different combinations of mines there can be, this has to account from everything from a -8 (a square surrounded
// by Anti Mines) to a 24 (a square surrounded by doubles and night mines).
function GenerateMinesAndNumbers(mines) {
    CoveredTile.flagsLeft = mines;
    mineCount = mines;
    let mineAssortmentArray = [];
    let radioactiveArray = [];
    let mineName = "";

    switch(gameMode) {
        case "Normal": 
            mineAssortmentArray.push(mines); //id 0 = normal
            mineAssortmentArray.push(0); //id 1 = double
            mineAssortmentArray.push(0); //id 2 = radioactive
            mineAssortmentArray.push(0); //id 3 = anti
            mineAssortmentArray.push(0); //id 4 = night
            CoveredTile.flagList.push("Flag");
            CoveredTile.flagList.push("Question");
            break;
        case "Double": 
            mineAssortmentArray.push(Math.floor(mines/2)); //id 0 = normal
            mineAssortmentArray.push(Math.floor(mines/2)); //id 1 = double
            mineAssortmentArray.push(0); //id 2 = radioactive
            mineAssortmentArray.push(0); //id 3 = anti
            mineAssortmentArray.push(0); //id 4 = night
            CoveredTile.flagList.push("Flag");
            CoveredTile.flagList.push("Double Flag");
            CoveredTile.flagList.push("Question");
            break;
        case "Radioactive": 
            mineAssortmentArray.push(Math.floor(mines/2)); //id 0 = normal
            mineAssortmentArray.push(0); //id 1 = double
            mineAssortmentArray.push(Math.floor(mines/2)); //id 2 = radioactive
            mineAssortmentArray.push(0); //id 3 = anti
            mineAssortmentArray.push(0); //id 4 = night
            CoveredTile.flagList.push("Flag");
            CoveredTile.flagList.push("Radioactive Flag");
            CoveredTile.flagList.push("Question");
            break;
        case "Anti": 
            mineAssortmentArray.push(Math.floor(mines/2)); //id 0 = normal
            mineAssortmentArray.push(0); //id 1 = double
            mineAssortmentArray.push(0); //id 2 = radioactive
            mineAssortmentArray.push(Math.floor(mines/2)); //id 3 = anti
            mineAssortmentArray.push(0); //id 4 = night
            CoveredTile.flagList.push("Flag");
            CoveredTile.flagList.push("Anti Flag");
            CoveredTile.flagList.push("Question");
            break;
        case "Night": 
            mineAssortmentArray.push(Math.floor(mines/2)); //id 0 = normal
            mineAssortmentArray.push(0); //id 1 = double
            mineAssortmentArray.push(0); //id 2 = radioactive
            mineAssortmentArray.push(0); //id 3 = anti
            mineAssortmentArray.push(Math.floor(mines/2)); //id 4 = night
            CoveredTile.flagList.push("Flag");
            CoveredTile.flagList.push("Night Flag");
            CoveredTile.flagList.push("Question");
            break;
        case "Custom":
            mineAssortmentArray.push(normalMineCount); //id 0 = normal
            mineAssortmentArray.push(doubleMineCount); //id 1 = double
            mineAssortmentArray.push(radioactiveMineCount); //id 2 = radioactive
            mineAssortmentArray.push(antiMineCount); //id 3 = anti
            mineAssortmentArray.push(nightMineCount); //id 4 = night

            if (normalMineCount > 0) {
                CoveredTile.flagList.push("Flag");
            }
            if (doubleMineCount > 0) {
                CoveredTile.flagList.push("Double Flag");
            }
            if (radioactiveMineCount > 0) {
                CoveredTile.flagList.push("Radioactive Flag");
            }
            if (antiMineCount > 0) {
                CoveredTile.flagList.push("Anti Flag");
            }
            if (nightMineCount > 0) {
                CoveredTile.flagList.push("Night Flag");
            }

            CoveredTile.flagList.push("Question");
            break;
    }

    //Makes sure that there is a correct number of mines
    if (mines % 2 == 1 && gameMode != "Custom" && gameMode != "Normal") {
        mineAssortmentArray[0]++;
    }

    CoveredTile.globalMode = CoveredTile.flagList[0];

    if (mineAssortmentArray[4] > 0) {
        CoveredTile.nightMode = true;
    }

    for (let id = 0; id < mineAssortmentArray.length; id++) {

        switch (id) {
            case 0: mineName = "m"; break;
            case 1: mineName = "d"; break;
            case 2: mineName = "r"; break;
            case 3: mineName = "a"; break;
            case 4: mineName = "k"; break;
        }

        for (let i = 0; i < mineAssortmentArray[id]; i++) {
            let mineX = Math.floor(Math.random() * boardWidth);
            let mineY = Math.floor(Math.random() * boardHeight);
            radioactiveArray = [];
            //console.log("id: " + id);
    
            // This will make sure that the new mine isn't placed on an already existing mine
            while(gameBoard[mineY][mineX] == "m" ||
                  gameBoard[mineY][mineX] == "d" ||
                  gameBoard[mineY][mineX] == "r" ||
                  gameBoard[mineY][mineX] == "a" ||
                  gameBoard[mineY][mineX] == "k") {
                mineX = Math.floor(Math.random() * boardWidth);
                mineY = Math.floor(Math.random() * boardHeight);
            }
    
            // After a valid square is selected, change it to the mine name
            gameBoard[mineY][mineX] = mineName;
    
            // Then, add +1, +2, or -1 to all eight tiles around it, except null and other mines
            
            let directions = [];

            if (id == 4) {
                directions = [[-2,1],   [-1, 2],  [1, 2], 
                              [2, 1],             [-2, -1],
                              [-1,-2],  [1, -2],  [2, -1]];
            }
            else {
                directions = [[-1,-1], [-1, 0], [-1, 1],
                                [0,-1],           [0, 1],
                                [1,-1],  [1, 0],  [1, 1]];
            }

            for (const[rowOffset, colOffset] of directions) {
                let newRow = mineX + rowOffset;
                let newCol = mineY + colOffset;
    
                if (newRow >= 0 && newRow < gameBoard[0].length &&
                    newCol >= 0 && newCol < gameBoard.length) {
                    if (gameBoard[newCol][newRow] !== "m" &&
                        gameBoard[newCol][newRow] !== "d" &&
                        gameBoard[newCol][newRow] !== "r" &&
                        gameBoard[newCol][newRow] !== "a" &&
                        gameBoard[newCol][newRow] !== "k"){
                        
                        if (gameBoard[newCol][newRow] == "e") {gameBoard[newCol][newRow] = 0;}
    
                        switch(mineName) {
                            case "m": gameBoard[newCol][newRow]++; break;
                            case "d": gameBoard[newCol][newRow] += 2; break;
                            case "r": 
                                gameBoard[newCol][newRow]++; 
                                let savedPosition = {col:newCol, row:newRow};
                                radioactiveArray.push(savedPosition);
                                break;
                            case "a": gameBoard[newCol][newRow]--; break;
                            case "k": gameBoard[newCol][newRow]++; break;
                        }
                    } 
                }
            }

            //This is for radioactive mines, increase one of their adjacent tiles by one. It chooses a random tile
            //and increments it. It is then saved to savedRadioactive just in case a radioactive mine is clicked first,
            //and it has to be moved due to the Safety Mine function, which ensures that you never click a mine on your
            //first click.
            if (id == 2) {
                let choice = Math.floor(Math.random() * radioactiveArray.length);
                console.log("Rad: Col: " + radioactiveArray[choice].col + ", Row: " + radioactiveArray[choice].row);
                gameBoard[radioactiveArray[choice].col][radioactiveArray[choice].row]++;
                savedRadioactive.push[radioactiveArray[choice]];
            }
        }
    
        //This sets all of the mine, number, and blank tiles 
        for (let i = 0; i < boardHeight; i++) {
            for (let j = 0; j < boardWidth; j++) {
                let data = gameBoard[i][j];
                let tile = 0;

                let newWidth = (app.screen.width / 2) - ((boardWidth / 2) * 32 );
                let newHeight = (app.screen.height / 2) - ((boardHeight / 2) * 32 - 50);
    
                switch(data) {
                    case "e": tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/ZeroTile.png", "e"); break;
                    case -8: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegEightTile.png", "-8"); break;
                    case -7: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegSevenTile.png", "-7"); break;
                    case -6: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegSixTile.png", "-6"); break;
                    case -5: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegFiveTile.png", "-5"); break;
                    case -4: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegFourTile.png", "-4"); break;
                    case -3: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegThreeTile.png", "-3"); break;
                    case -2: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegTwoTile.png", "-2"); break;
                    case -1: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegOneTile.png", "-1"); break;
                    case 0: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/ZeroNumTile.png", "0"); break;
                    case 1: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/OneTile.png", "1"); break;
                    case 2: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwoTile.png", "2"); break;
                    case 3: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/ThreeTile.png", "3"); break;
                    case 4: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/FourTile.png", "4"); break;
                    case 5: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/FiveTile.png", "5"); break;
                    case 6: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/SixTile.png", "6"); break;
                    case 7: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/SevenTile.png", "7"); break;
                    case 8: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/EightTile.png", "8"); break;
                    case 9: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NineTile.png", "9"); break;
                    case 10: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TenTile.png", "10"); break;
                    case 11: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/ElevenTile.png", "11"); break;
                    case 12: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwelveTile.png", "12"); break;
                    case 13: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/ThirteenTile.png", "13"); break;
                    case 14: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/FourteenTile.png", "14"); break;
                    case 15: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/FifteenTile.png", "15"); break;
                    case 16: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/SixteenTile.png", "16"); break;
                    case 17: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/SeventeenTile.png", "17"); break;
                    case 18: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/EighteenTile.png", "18"); break;
                    case 19: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NineteenTile.png", "19"); break;
                    case 20: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwentyTile.png", "20"); break;
                    case 21: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwentyOneTile.png", "21"); break;
                    case 22: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwentyTwoTile.png", "22"); break;
                    case 23: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwentyThreeTile.png", "23"); break;
                    case 24: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwentyFourTile.png", "24"); break;
                    case "m": //mine
                        tile = new MineTile(newWidth + j * 32, newHeight + i * 32, j, i, "images/MineTile.png", "m"); 
                        mineList.push(tile);
                        break;
                    case "d": //double mine
                        tile = new MineTile(newWidth + j * 32, newHeight + i * 32, j, i, "images/DoubleMineTile.png", "d"); 
                        mineList.push(tile);
                        break;
                    case "r": //radioactive mine
                        tile = new MineTile(newWidth + j * 32, newHeight + i * 32, j, i, "images/RadioactiveTile.png", "r"); 
                        mineList.push(tile);
                        break;
                    case "a": //anti mine
                        tile = new MineTile(newWidth + j * 32, newHeight + i * 32, j, i, "images/AntiMineTile.png", "a"); 
                        mineList.push(tile);
                        break;
                    case "k": //night mine
                        tile = new MineTile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NightMineTile.png", "k"); 
                        mineList.push(tile);
                        break;
                }
    
                tileList.push(tile);
                gameScene.addChild(tile);
            }
        }
    }

    CoveredTile.board = gameBoard;
    //console.log(gameBoard);
}

// This resets the board by deleting all of the tiles, and reseting all of the many static variables 
// that CoveredTile uses
function ClearBoard() {
    coveredTileList.forEach(c=>gameScene.removeChild(c));
    coveredTileList = [];

    tileList.forEach(t=>gameScene.removeChild(t));
    tileList = [];

    explosions.forEach(e=>gameScene.removeChild(e));
    explosions = [];

    wallList.forEach(w=>gameScene.removeChild(w));
    wallList = [];

    mineList = [];
    savedRadioactive = [];

    stopTimer();

    safetyClick = true;
    CoveredTile.globalMode = "Temp";
    CoveredTile.numUncovered = 0;
    CoveredTile.board = [];
    CoveredTile.coveredBoard = [];
    CoveredTile.flagList = [];
    CoveredTile.currentFlag = 0;
    CoveredTile.nightMode = false;
    CoveredTile.firstClick = 0;
    CoveredTile.mineTileClicked = "temp";
    CoveredTile.face = null;
}

// This function ensures that if you click a mine on your first click, the mine is moved to a different location. It first determines
// what type of mine it is, then removes the old numbers. It then moves the mine to a new location, adds any correct numbers to the now
// empty mine spot, generates new numbers based on where the mine was placed, and then basically regenerates the entire board.
// Is this the most efficient way of doing this? No. But this took a lot of tinkering, and was mainly a byproduct of me using two
// sets of overlapping sprites (Num/Mine tiles, and Cover tiles)
function SafetyMine(mine) {
    //console.log("safety mine activated");
    safetyClick = false;

    //logic
    //remove old numbers
    //move mine
    //add new numbers
    //regenerate board

    let directions = [];

    //determine what type of mine it is
    if (mine.tileData == "k") {
        directions = [[-2,1],   [-1, 2],  [1, 2], 
                      [2, 1],             [-2, -1],
                      [-1,-2],  [1, -2],  [2, -1]];
    }
    else {
        directions = [[-1,-1], [-1, 0], [-1, 1],
                        [0,-1],           [0, 1],
                        [1,-1],  [1, 0],  [1, 1]];
    }

    let replacementTotal = 0;
    let nearbyAntiMine = false;

    //Remove old numbers
    for (const[rowOffset, colOffset] of directions) {
        let newRow = mine.xIndex + rowOffset;
        let newCol = mine.yIndex + colOffset;

        if (newRow >= 0 && newRow < gameBoard[0].length &&
            newCol >= 0 && newCol < gameBoard.length) {
            if (gameBoard[newCol][newRow] !== "m" &&
                gameBoard[newCol][newRow] !== "d" &&
                gameBoard[newCol][newRow] !== "r" &&
                gameBoard[newCol][newRow] !== "a" &&
                gameBoard[newCol][newRow] !== "k"){
                
                if (gameBoard[newCol][newRow] == "e") {gameBoard[newCol][newRow] = 0;}

                switch(mine.tileData) {
                    case "m": gameBoard[newCol][newRow]--; break;
                    case "d": gameBoard[newCol][newRow] -= 2; break;
                    case "r": gameBoard[newCol][newRow]--; 
                        for (let i = 0; i < savedRadioactive.length; i++) {
                            if (savedRadioactive[i].col == newCol &&
                                savedRadioactive[i].row == newRow) {
                                    gameBoard[newCol][newRow]--; 
                                }
                        }
                        break;
                    case "a": gameBoard[newCol][newRow]++; break;
                    case "k": gameBoard[newCol][newRow]--; break;
                }

                //Make sure 0 tiles and empty tiles are displayed correctly
                if (gameBoard[newCol][newRow] == "0" && mine.tileData != "a") {
                    gameBoard[newCol][newRow] = "e";
                }
            } 
            //Makes sure the old mine tile has the correct number
            else if (gameBoard[newCol][newRow] == "m" ||
                   gameBoard[newCol][newRow] == "d" ||
                   gameBoard[newCol][newRow] == "r" ||
                   gameBoard[newCol][newRow] == "a" ||
                   gameBoard[newCol][newRow] == "k") {



                    switch(gameBoard[newCol][newRow]) {
                        case "m": replacementTotal++; break;
                        case "d": replacementTotal += 2; break;
                        case "r": replacementTotal++; break;
                        case "a": replacementTotal--; nearbyAntiMine = true; break;
                        case "k": replacementTotal += 0; break; //night bombs get checked later
                    }
            }
        } 
    }

    //move mine to a new location
    let mineX = Math.floor(Math.random() * boardWidth);
    let mineY = Math.floor(Math.random() * boardHeight);
    let radioactiveArray = [];    

    while(gameBoard[mineY][mineX] == "m" ||
          gameBoard[mineY][mineX] == "d" ||
          gameBoard[mineY][mineX] == "r" ||
          gameBoard[mineY][mineX] == "a" ||
          gameBoard[mineY][mineX] == "k") {
               mineX = Math.floor(Math.random() * boardWidth);
               mineY = Math.floor(Math.random() * boardHeight);
        }

    //Check if any Night mines would add numbers to the now empty mine tile
    let nightDirections = [[-2,1],   [-1, 2],  [1, 2], 
                           [2, 1],             [-2, -1],
                           [-1,-2],   [1, -2],  [2, -1]];
    
    for (const[rowOffset, colOffset] of nightDirections) {
        let newRow = mine.xIndex + rowOffset;
        let newCol = mine.yIndex + colOffset;

        if (newRow >= 0 && newRow < gameBoard[0].length &&
            newCol >= 0 && newCol < gameBoard.length && 
            gameBoard[newCol][newRow] == "k") {  
                replacementTotal++;
        }
    }
    
    // After a valid square is selected, change it to the mine name
    // Remove old mine
    console.log("Replacement Total: " + replacementTotal)
    gameBoard[mineY][mineX] = mine.tileData;
    if (nearbyAntiMine == true && replacementTotal == 0) {
        gameBoard[mine.yIndex][mine.xIndex] = 0;
    }
    else if (nearbyAntiMine == false && replacementTotal == 0) {
        gameBoard[mine.yIndex][mine.xIndex] = "e";
    }
    else {
        gameBoard[mine.yIndex][mine.xIndex] = replacementTotal;
    }
    
    
    // Then, add +1, +2, or -1 to all eight tiles around it, except null and other mines
    for (const[rowOffset, colOffset] of directions) {
        let newRow = mineX + rowOffset;
        let newCol = mineY + colOffset;
    
            if (newRow >= 0 && newRow < gameBoard[0].length &&
                newCol >= 0 && newCol < gameBoard.length) {
                if (gameBoard[newCol][newRow] !== "m" &&
                    gameBoard[newCol][newRow] !== "d" &&
                    gameBoard[newCol][newRow] !== "r" &&
                    gameBoard[newCol][newRow] !== "a" &&
                    gameBoard[newCol][newRow] !== "k"){
                        
                    if (gameBoard[newCol][newRow] == "e") {gameBoard[newCol][newRow] = 0;}
    
                    switch(mine.tileData) {
                        case "m": gameBoard[newCol][newRow]++; break;
                        case "d": gameBoard[newCol][newRow] += 2; break;
                        case "r": 
                                gameBoard[newCol][newRow]++; 
                                const savedPosition = {col:newCol, row:newRow};
                                radioactiveArray.push(savedPosition);
                                break;
                        case "a": gameBoard[newCol][newRow]--; break;
                        case "k": gameBoard[newCol][newRow]++; break;
                        }
                    } 
                }
            }

            if (mine.tileData == "r") {
                console.log(radioactiveArray.length);
                let choice = Math.floor(Math.random() * radioactiveArray.length);
                gameBoard[radioactiveArray[choice].col][radioactiveArray[choice].row]++;
            }
    
    //Remove everything from the board

    let savedX = mine.xIndex;
    let savedY = mine.yIndex;

    coveredTileList.forEach(c=>gameScene.removeChild(c));
    coveredTileList = [];

    mineList.forEach(e=>gameScene.removeChild(e));
    mineList = [];

    tileList.forEach(t=>gameScene.removeChild(t));
    tileList = [];

    //Remake the board
    for (let i = 0; i < boardHeight; i++) {
        for (let j = 0; j < boardWidth; j++) {
            let data = gameBoard[i][j];
            let tile = 0;

            let newWidth = (app.screen.width / 2) - ((boardWidth / 2) * 32);
            let newHeight = (app.screen.height / 2) - ((boardHeight / 2) * 32 - 50);

            switch(data) {
                case "e": tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/ZeroTile.png", "e"); break;
                case -8: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegEightTile.png", "-8"); break;
                case -7: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegSevenTile.png", "-7"); break;
                case -6: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegSixTile.png", "-6"); break;
                case -5: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegFiveTile.png", "-5"); break;
                case -4: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegFourTile.png", "-4"); break;
                case -3: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegThreeTile.png", "-3"); break;
                case -2: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegTwoTile.png", "-2"); break;
                case -1: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NegOneTile.png", "-1"); break;
                case 0: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/ZeroNumTile.png", "0"); break;
                case 1: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/OneTile.png", "1"); break;
                case 2: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwoTile.png", "2"); break;
                case 3: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/ThreeTile.png", "3"); break;
                case 4: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/FourTile.png", "4"); break;
                case 5: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/FiveTile.png", "5"); break;
                case 6: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/SixTile.png", "6"); break;
                case 7: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/SevenTile.png", "7"); break;
                case 8: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/EightTile.png", "8"); break;
                case 9: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NineTile.png", "9"); break;
                case 10: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TenTile.png", "10"); break;
                case 11: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/ElevenTile.png", "11"); break;
                case 12: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwelveTile.png", "12"); break;
                case 13: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/ThirteenTile.png", "13"); break;
                case 14: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/FourteenTile.png", "14"); break;
                case 15: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/FifteenTile.png", "15"); break;
                case 16: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/SixteenTile.png", "16"); break;
                case 17: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/SeventeenTile.png", "17"); break;
                case 18: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/EighteenTile.png", "18"); break;
                case 19: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NineteenTile.png", "19"); break;
                case 20: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwentyTile.png", "20"); break;
                case 21: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwentyOneTile.png", "21"); break;
                case 22: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwentyTwoTile.png", "22"); break;
                case 23: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwentyThreeTile.png", "23"); break;
                case 24: tile = new Tile(newWidth + j * 32, newHeight + i * 32, j, i, "images/TwentyFourTile.png", "24"); break;
                case "m": //mine
                    tile = new MineTile(newWidth + j * 32, newHeight + i * 32, j, i, "images/MineTile.png", "m"); 
                    mineList.push(tile);
                    break;
                case "d": //double mine
                    tile = new MineTile(newWidth + j * 32, newHeight + i * 32, j, i, "images/DoubleMineTile.png", "d"); 
                    mineList.push(tile);
                    break;
                case "r": //radioactive mine
                    tile = new MineTile(newWidth + j * 32, newHeight + i * 32, j, i, "images/RadioactiveTile.png", "r"); 
                    mineList.push(tile);
                    break;
                case "a": //anti mine
                    tile = new MineTile(newWidth + j * 32, newHeight + i * 32, j, i, "images/AntiMineTile.png", "a"); 
                    mineList.push(tile);
                    break;
                case "k": //night mine
                    tile = new MineTile(newWidth + j * 32, newHeight + i * 32, j, i, "images/NightMineTile.png", "k"); 
                    mineList.push(tile);
                    break;
            }

            tileList.push(tile);
            gameScene.addChild(tile);
        }
    }

    //Regenerate the covers
    CoveredTile.coveredBoard = [];
    GenerateCovers();

    //Call the reveal adjacent tile on the now empty mine square
    if (CoveredTile.nightMode == false) {
        for (let i = 0; i < coveredTileList.length; i++) {
            if(coveredTileList[i].yIndex == savedY &&
               coveredTileList[i].xIndex == savedX &&
               coveredTileList[i].tileData == "e") {
                coveredTileList[i].revealAdjacent();
            }
        }
    }
}

// This adds the event listeners for space bar to switch flags and r to send you back to the main menu
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && paused == false) {
        CoveredTile.toggleMode();
    }

    if (e.key === 'r') {
        gameScene.visible = false;
        variantScene.visible = false;
        customScene.visible = false;
        rulesScene.visible = false;
        documentScene.visible = false;
        startScene.visible = true;
    }
})

// OLD FUNCTIONS THAT HAVE BEEN MODIFIED

// This sets up all of the scenes, labels, sound effects, and the explosion spritesheet that I reused from Circle Blast
function setup() {
	stage = app.stage;
	// #1 - Create the `start` scene
	startScene = new PIXI.Container();
    stage.addChild(startScene);
	// #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    gameScene.interactiveChildren = true;
    stage.addChild(gameScene);

    //#3 - Create new scenes
    variantScene = new PIXI.Container();
    variantScene.visible = false;
    stage.addChild(variantScene);

    customScene = new PIXI.Container();
    customScene.visible = false;
    stage.addChild(customScene);

    rulesScene = new PIXI.Container();
    rulesScene.visible = false;
    stage.addChild(rulesScene);

    documentScene = new PIXI.Container();
    documentScene.visible = false;
    stage.addChild(documentScene);
	// #4 - Create labels for all scenes
	createLabelsAndButtons();
	// #5 - Load Sounds
    digSound = new Howl({src: ['sounds/dig.mp3']});
    boomSound = new Howl({src: ['sounds/boom.mp3']});
    victorySound = new Howl({src: ['sounds/victoryCut.mp3']});
    CoveredTile.dig = digSound;
	// #6 - Load sprite sheet
    explosionTextures = loadSpriteSheet();
	// #7 - Start update loop
	app.ticker.add(gameLoop);
}

// This function creates all of the many, many labels used for the game. I was mainly focused on making them all work,
// so the reason why this function is about 1000 lines of code long (oops) is because I just did a lot of copy pasting. 
// If I had more time to go back and create functions to handle the very similar buttons that I make, I would. But that's
// a later me problem.
function createLabelsAndButtons() {
    let buttonStyle = new PIXI.TextStyle({
        fill: 0x00000,
        fontSize: 36,
        fontFamily: "Pixelify Sans"
    });

    let smallerButtonStyle = new PIXI.TextStyle({
        fill: 0x00000,
        fontSize: 24,
        fontFamily: "Pixelify Sans"
    });

    let titleStyle = new PIXI.TextStyle({
        fill: 0x000000,
        fontSize: 60,
        fontFamily: "Pixelify Sans",
        stroke: 0xFF0000,
        strokeThickness: 6
    });

    let subTitleStyle = new PIXI.TextStyle({
        fill: 0x00000,
        fontSize: 44,
        fontFamily: "Pixelify Sans",
        stroke: 0xFF0000,
        strokeThickness: 6
    });

    //set up startScene and make start label
    let titleLabel = new PIXI.Text("Minesweeper+");
    titleLabel.style = titleStyle;
    titleLabel.anchor.set(0.5);
    titleLabel.x = sceneWidth / 2;
    titleLabel.y = 120;
    startScene.addChild(titleLabel);

    let titleLabel2 = new PIXI.Text("Minesweeper+");
    titleLabel2.style = titleStyle;
    titleLabel2.anchor.set(0.5);
    titleLabel2.x = sceneWidth / 2;
    titleLabel2.y = 120;
    variantScene.addChild(titleLabel2);

    let titleLabel3 = new PIXI.Text("Minesweeper+");
    titleLabel3.style = titleStyle;
    titleLabel3.anchor.set(0.5);
    titleLabel3.x = sceneWidth / 2;
    titleLabel3.y = sceneHeight / 2 - 327;
    customScene.addChild(titleLabel3);

    let titleLabel4 = new PIXI.Text("Minesweeper+");
    titleLabel4.style = titleStyle;
    titleLabel4.anchor.set(0.5);
    titleLabel4.x = sceneWidth / 2;
    titleLabel4.y = 120;
    rulesScene.addChild(titleLabel4);

    let titleLabel5 = new PIXI.Text("Minesweeper+");
    titleLabel5.style = titleStyle;
    titleLabel5.anchor.set(0.5);
    titleLabel5.x = sceneWidth / 2;
    titleLabel5.y = 120;
    documentScene.addChild(titleLabel5);

    //make middle start label
    let startLabel2 = new PIXI.Text("Don't Blow Up");
    startLabel2.style = subTitleStyle;
    startLabel2.anchor.set(0.5);
    startLabel2.x = sceneWidth / 2;
    startLabel2.y = 180;
    startScene.addChild(startLabel2);

    let variantSubLabel = new PIXI.Text("Current Variant: " + gameMode);
    variantSubLabel.style = subTitleStyle;
    variantSubLabel.anchor.set(0.5);
    variantSubLabel.x = sceneWidth / 2;
    variantSubLabel.y = 180;
    variantScene.addChild(variantSubLabel);

    startLabel2 = new PIXI.Text("Custom Game");
    startLabel2.style = subTitleStyle;
    startLabel2.anchor.set(0.5);
    startLabel2.x = sceneWidth / 2;
    startLabel2.y = sceneHeight / 2 - 268;
    customScene.addChild(startLabel2);
    
    startLabel2 = new PIXI.Text("Rules");
    startLabel2.style = subTitleStyle;
    startLabel2.anchor.set(0.5);
    startLabel2.x = sceneWidth / 2;
    startLabel2.y = 180;
    rulesScene.addChild(startLabel2);

    startLabel2 = new PIXI.Text("Documentation");
    startLabel2.style = subTitleStyle;
    startLabel2.anchor.set(0.5);
    startLabel2.x = sceneWidth / 2;
    startLabel2.y = 180;
    documentScene.addChild(startLabel2);

    //Creates the difficulty buttons
    //Beginner (8x8, 10), Intermediate (16x16, 40), Expert (30x16, 99), Custom (you choose)
    let startButton = new PIXI.Text("Beginner");
    startButton.anchor.set(0.5);
    startButton.style = buttonStyle;
    startButton.x = sceneWidth / 2;
    startButton.y = sceneHeight / 2;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", function e() {
        if (gameMode == "Custom") {gameMode = lastGameMode}
        startGame(8,8,10);
    }); //startGame is a function reference
    startButton.on("pointerover", e=>e.target.alpha = 0.5);
    startButton.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    startButton = new PIXI.Text("Intermediate");
    startButton.anchor.set(0.5);
    startButton.style = buttonStyle;
    startButton.x = sceneWidth / 2;
    startButton.y = sceneHeight / 2 + 30;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", function e() {
        if (gameMode == "Custom") {gameMode = lastGameMode}
        startGame(16,16,40);
    }); 
    startButton.on("pointerover", e=>e.target.alpha = 0.5);
    startButton.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    startButton = new PIXI.Text("Expert");
    startButton.anchor.set(0.5);
    startButton.style = buttonStyle;
    startButton.x = sceneWidth / 2;
    startButton.y = sceneHeight / 2 + 60;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", function e() {
        if (gameMode == "Custom") {gameMode = lastGameMode}
        startGame(30,16,99);
    }); 
    startButton.on("pointerover", e=>e.target.alpha = 0.5);
    startButton.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    startButton = new PIXI.Text("Custom");
    startButton.anchor.set(0.5);
    startButton.style = buttonStyle;
    startButton.x = sceneWidth / 2;
    startButton.y = sceneHeight / 2 + 90;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", function e() {
        customSubLabel.text = 
        "       Note: Timer and flag counts will only be displayed for boards that have six or more columns." + 
        "\nRecommended max custom game size is 20 rows by 50 columns, but adjust based on browser size."
        customScene.visible = true; 
        startScene.visible = false;});
    startButton.on("pointerover", e=>e.target.alpha = 0.5);
    startButton.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    let variantLabel = new PIXI.Text("Variants: " + gameMode);
    variantLabel.anchor.set(0.5);
    variantLabel.style = buttonStyle;
    variantLabel.x = sceneWidth / 2;
    variantLabel.y = sceneHeight / 2 + 120;
    variantLabel.interactive = true;
    variantLabel.buttonMode = true;
    variantLabel.on("pointerup", function e() {variantScene.visible = true; startScene.visible = false;});
    variantLabel.on("pointerover", e=>e.target.alpha = 0.5);
    variantLabel.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    startScene.addChild(variantLabel);

    startButton = new PIXI.Text("Rules");
    startButton.anchor.set(0.5);
    startButton.style = buttonStyle;
    startButton.x = sceneWidth / 2;
    startButton.y = sceneHeight / 2 + 150;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", function e() {rulesScene.visible = true; startScene.visible = false;});
    startButton.on("pointerover", e=>e.target.alpha = 0.5);
    startButton.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    startButton = new PIXI.Text("Documentation");
    startButton.anchor.set(0.5);
    startButton.style = smallerButtonStyle;
    startButton.x = sceneWidth / 2;
    startButton.y = sceneHeight / 2 + 230;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", function e() {documentScene.visible = true; startScene.visible = false;});
    startButton.on("pointerover", e=>e.target.alpha = 0.5);
    startButton.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    //set up variantScene
    let varTextStyle = new PIXI.TextStyle({
        fill: 0x00000,
        fontSize: 24,
        fontFamily: "Pixelify Sans"
    });

    let varSelect = new PIXI.Text("Normal");
    varSelect.anchor.set(0.5);
    varSelect.style = buttonStyle;
    varSelect.x = sceneWidth / 2;
    varSelect.y = sceneHeight / 2 - 60;
    varSelect.interactive = true;
    varSelect.buttonMode = true;
    varSelect.on("pointerup", function e() {
        gameMode = "Normal";
        lastGameMode = "Normal";
        variantLabel.text = "Variant: " + gameMode;
        variantSubLabel.text = "Current Variant: " + gameMode;
    });
    varSelect.on("pointerover", e=>e.target.alpha = 0.5);
    varSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    variantScene.addChild(varSelect);

    let subVarText = new PIXI.Text("\"For your classic Minesweeper experience\"");
    subVarText.anchor.set(0.5);
    subVarText.style = varTextStyle;
    subVarText.x = sceneWidth / 2;
    subVarText.y = sceneHeight / 2 - 30;
    variantScene.addChild(subVarText);

    varSelect = new PIXI.Text("Double");
    varSelect.anchor.set(0.5);
    varSelect.style = buttonStyle;
    varSelect.x = sceneWidth / 2;
    varSelect.y = sceneHeight / 2;
    varSelect.interactive = true;
    varSelect.buttonMode = true;
    varSelect.on("pointerup", function e() {
        gameMode = "Double";
        lastGameMode = "Double";
        variantLabel.text = "Variant: " + gameMode;
        variantSubLabel.text = "Current Variant: " + gameMode;
    });
    varSelect.on("pointerover", e=>e.target.alpha = 0.5);
    varSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    variantScene.addChild(varSelect);

    subVarText = new PIXI.Text("\"Double the trouble, twice the fun.\"");
    subVarText.anchor.set(0.5);
    subVarText.style = varTextStyle;
    subVarText.x = sceneWidth / 2;
    subVarText.y = sceneHeight / 2 + 30;
    variantScene.addChild(subVarText);

    varSelect = new PIXI.Text("Radioactive");
    varSelect.anchor.set(0.5);
    varSelect.style = buttonStyle;
    varSelect.x = sceneWidth / 2;
    varSelect.y = sceneHeight / 2 + 60;
    varSelect.interactive = true;
    varSelect.buttonMode = true;
    varSelect.on("pointerup", function e() {
        gameMode = "Radioactive";
        lastGameMode = "Radioactive";
        variantLabel.text = "Variant: " + gameMode;
        variantSubLabel.text = "Current Variant: " + gameMode;
    });
    varSelect.on("pointerover", e=>e.target.alpha = 0.5);
    varSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    variantScene.addChild(varSelect);

    subVarText = new PIXI.Text("\"The radiation is causing number mutation.\"");
    subVarText.anchor.set(0.5);
    subVarText.style = varTextStyle;
    subVarText.x = sceneWidth / 2;
    subVarText.y = sceneHeight / 2 + 90;
    variantScene.addChild(subVarText);

    varSelect = new PIXI.Text("Anti");
    varSelect.anchor.set(0.5);
    varSelect.style = buttonStyle;
    varSelect.x = sceneWidth / 2;
    varSelect.y = sceneHeight / 2 + 120;
    varSelect.interactive = true;
    varSelect.buttonMode = true;
    varSelect.on("pointerup", function e() {
        gameMode = "Anti";
        lastGameMode = "Anti";
        variantLabel.text = "Variant: " + gameMode;
        variantSubLabel.text = "Current Variant: " + gameMode;
    });
    varSelect.on("pointerover", e=>e.target.alpha = 0.5);
    varSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    variantScene.addChild(varSelect);

    subVarText = new PIXI.Text("\"Don't step on the imploding mines.\"");
    subVarText.anchor.set(0.5);
    subVarText.style = varTextStyle;
    subVarText.x = sceneWidth / 2;
    subVarText.y = sceneHeight / 2 + 150;
    variantScene.addChild(subVarText);

    varSelect = new PIXI.Text("Night");
    varSelect.anchor.set(0.5);
    varSelect.style = buttonStyle;
    varSelect.x = sceneWidth / 2;
    varSelect.y = sceneHeight / 2 + 180;
    varSelect.interactive = true;
    varSelect.buttonMode = true;
    varSelect.on("pointerup", function e() {
        gameMode = "Night";
        lastGameMode = "Night";
        variantLabel.text = "Variant: " + gameMode;
        variantSubLabel.text = "Current Variant: " + gameMode;
    });
    varSelect.on("pointerover", e=>e.target.alpha = 0.5);
    varSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    variantScene.addChild(varSelect);

    subVarText = new PIXI.Text("\"Who knows what may be lurking it the dark...\"");
    subVarText.anchor.set(0.5);
    subVarText.style = varTextStyle;
    subVarText.x = sceneWidth / 2;
    subVarText.y = sceneHeight / 2 + 210;
    variantScene.addChild(subVarText);

    varSelect = new PIXI.Text("Back");
    varSelect.anchor.set(0.5);
    varSelect.style = buttonStyle;
    varSelect.x = sceneWidth / 2;
    varSelect.y = sceneHeight / 2 + 270;
    varSelect.interactive = true;
    varSelect.buttonMode = true;
    varSelect.on("pointerup", function e() {
        variantScene.visible = false;
        startScene.visible = true;
    });
    varSelect.on("pointerover", e=>e.target.alpha = 0.5);
    varSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    variantScene.addChild(varSelect);

    //set up customScene

    let plusMinusStyle = new PIXI.TextStyle({
        fill: 0x00000,
        fontSize: 64,
        fontFamily: "Pixelify Sans"
    });

    let numberStyle = new PIXI.TextStyle({
        fill: 0x00000,
        fontSize: 64,
        fontFamily: "Pixelify Sans"
    });

    //choose your own board height
    let cusSelect = new PIXI.Text("+");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2;
    cusSelect.y = sceneHeight / 2 - 180;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        cusBoardHeight++;
        cusHeightLabel.text = cusBoardHeight;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    let cusHeightLabel = new PIXI.Text(cusBoardHeight);
    cusHeightLabel.anchor.set(0.5);
    cusHeightLabel.style = numberStyle;
    cusHeightLabel.x = sceneWidth / 2 + 60;
    cusHeightLabel.y = sceneHeight / 2 - 180;
    customScene.addChild(cusHeightLabel);

    let cusText = new PIXI.Text("Number Of Rows: ");
    cusText.anchor.set(0.5);
    cusText.style = buttonStyle;
    cusText.x = sceneWidth / 2 - 250;
    cusText.y = sceneHeight / 2 - 180;
    customScene.addChild(cusText);

    cusSelect = new PIXI.Text("-");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2 + 120;
    cusSelect.y = sceneHeight / 2 - 180;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        cusBoardHeight--;
        if(cusBoardHeight<=3) {cusBoardHeight = 3};
        cusHeightLabel.text = cusBoardHeight;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    //choose your own board width
    cusSelect = new PIXI.Text("+");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2;
    cusSelect.y = sceneHeight / 2 - 120;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        cusBoardWidth++;
        cusWidthLabel.text = cusBoardWidth;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    let cusWidthLabel = new PIXI.Text(cusBoardWidth);
    cusWidthLabel.anchor.set(0.5);
    cusWidthLabel.style = numberStyle;
    cusWidthLabel.x = sceneWidth / 2 + 60;
    cusWidthLabel.y = sceneHeight / 2 - 120;
    customScene.addChild(cusWidthLabel);

    cusText = new PIXI.Text("Number Of Columns: ");
    cusText.anchor.set(0.5);
    cusText.style = buttonStyle;
    cusText.x = sceneWidth / 2 - 273;
    cusText.y = sceneHeight / 2 - 120;
    customScene.addChild(cusText);

    cusSelect = new PIXI.Text("-");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2 + 120;
    cusSelect.y = sceneHeight / 2 - 120;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        cusBoardWidth--;
        if(cusBoardWidth<=3) {cusBoardWidth = 3};
        cusWidthLabel.text = cusBoardWidth;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    //choose your number of normal mines
    cusSelect = new PIXI.Text("+");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2;
    cusSelect.y = sceneHeight / 2 - 60;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        normalMineCount++;
        cusNormalLabel.text = normalMineCount;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    let cusNormalLabel = new PIXI.Text(normalMineCount);
    cusNormalLabel.anchor.set(0.5);
    cusNormalLabel.style = numberStyle;
    cusNormalLabel.x = sceneWidth / 2 + 60;
    cusNormalLabel.y = sceneHeight / 2 - 60;
    customScene.addChild(cusNormalLabel);

    cusText = new PIXI.Text("Number Of Normal Mines: ");
    cusText.anchor.set(0.5);
    cusText.style = buttonStyle;
    cusText.x = sceneWidth / 2 - 315;
    cusText.y = sceneHeight / 2 - 60;
    customScene.addChild(cusText);

    cusSelect = new PIXI.Text("-");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2 + 120;
    cusSelect.y = sceneHeight / 2 - 60;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        normalMineCount--;
        if(normalMineCount<=0) {normalMineCount = 0};
        cusNormalLabel.text = normalMineCount;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    //choose your number of double mines
    cusSelect = new PIXI.Text("+");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2;
    cusSelect.y = sceneHeight / 2;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        doubleMineCount++;
        cusDoubleLabel.text = doubleMineCount;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    let cusDoubleLabel = new PIXI.Text(doubleMineCount);
    cusDoubleLabel.anchor.set(0.5);
    cusDoubleLabel.style = numberStyle;
    cusDoubleLabel.x = sceneWidth / 2 + 60;
    cusDoubleLabel.y = sceneHeight / 2;
    customScene.addChild(cusDoubleLabel);

    cusText = new PIXI.Text("Number Of Double Mines: ");
    cusText.anchor.set(0.5);
    cusText.style = buttonStyle;
    cusText.x = sceneWidth / 2 - 311;
    cusText.y = sceneHeight / 2;
    customScene.addChild(cusText);

    cusSelect = new PIXI.Text("-");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2 + 120;
    cusSelect.y = sceneHeight / 2;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        doubleMineCount--;
        if(doubleMineCount<=0) {doubleMineCount = 0};
        cusDoubleLabel.text = doubleMineCount;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    //choose your number of radioactive mines
    cusSelect = new PIXI.Text("+");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2;
    cusSelect.y = sceneHeight / 2 + 60;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        radioactiveMineCount++;
        cusRadLabel.text = radioactiveMineCount;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    let cusRadLabel = new PIXI.Text(radioactiveMineCount);
    cusRadLabel.anchor.set(0.5);
    cusRadLabel.style = numberStyle;
    cusRadLabel.x = sceneWidth / 2 + 60;
    cusRadLabel.y = sceneHeight / 2 + 60;
    customScene.addChild(cusRadLabel);

    cusText = new PIXI.Text("Number Of Radioactive Mines: ");
    cusText.anchor.set(0.5);
    cusText.style = buttonStyle;
    cusText.x = sceneWidth / 2 - 357;
    cusText.y = sceneHeight / 2 + 60;
    customScene.addChild(cusText);

    cusSelect = new PIXI.Text("-");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2 + 120;
    cusSelect.y = sceneHeight / 2 + 60;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        radioactiveMineCount--;
        if(radioactiveMineCount<=0) {radioactiveMineCount = 0};
        cusRadLabel.text = radioactiveMineCount;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    //choose your number of anti mines
    cusSelect = new PIXI.Text("+");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2;
    cusSelect.y = sceneHeight / 2 + 120;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        antiMineCount++;
        cusAntiLabel.text = antiMineCount;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    let cusAntiLabel = new PIXI.Text(antiMineCount);
    cusAntiLabel.anchor.set(0.5);
    cusAntiLabel.style = numberStyle;
    cusAntiLabel.x = sceneWidth / 2 + 60;
    cusAntiLabel.y = sceneHeight / 2 + 120;
    customScene.addChild(cusAntiLabel);

    cusText = new PIXI.Text("Number Of Anti Mines: ");
    cusText.anchor.set(0.5);
    cusText.style = buttonStyle;
    cusText.x = sceneWidth / 2 - 290;
    cusText.y = sceneHeight / 2 + 120;
    customScene.addChild(cusText);

    cusSelect = new PIXI.Text("-");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2 + 120;
    cusSelect.y = sceneHeight / 2 + 120;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        antiMineCount--;
        if(antiMineCount<=0) {antiMineCount = 0};
        cusAntiLabel.text = antiMineCount;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    //choose your number of night mines
    cusSelect = new PIXI.Text("+");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2;
    cusSelect.y = sceneHeight / 2 + 180;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        nightMineCount++;
        cusNightLabel.text = nightMineCount;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    let cusNightLabel = new PIXI.Text(nightMineCount);
    cusNightLabel.anchor.set(0.5);
    cusNightLabel.style = numberStyle;
    cusNightLabel.x = sceneWidth / 2 + 60;
    cusNightLabel.y = sceneHeight / 2 + 180;
    customScene.addChild(cusNightLabel);

    cusText = new PIXI.Text("Number Of Night Mines: ");
    cusText.anchor.set(0.5);
    cusText.style = buttonStyle;
    cusText.x = sceneWidth / 2 - 297;
    cusText.y = sceneHeight / 2 + 180;
    customScene.addChild(cusText);

    cusSelect = new PIXI.Text("-");
    cusSelect.anchor.set(0.5);
    cusSelect.style = plusMinusStyle;
    cusSelect.x = sceneWidth / 2 + 120;
    cusSelect.y = sceneHeight / 2 + 180;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        nightMineCount--;
        if(nightMineCount<=0) {nightMineCount = 0};
        cusNightLabel.text = nightMineCount;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    //Info text
    let customSubLabel = new PIXI.Text("       Note: Timer and flag counts will only be displayed for boards that have six or more columns."+
    "\nRecommended max custom game size is 20 rows by 50 columns, but adjust based on browser size.");
    customSubLabel.anchor.set(0.5);
    customSubLabel.style = varTextStyle;
    customSubLabel.x = sceneWidth / 2;
    customSubLabel.y = sceneHeight / 2 + 265;
    customScene.addChild(customSubLabel);

    //custom start button
    cusSelect = new PIXI.Text("Start");
    cusSelect.anchor.set(0.5);
    cusSelect.style = buttonStyle;
    cusSelect.x = sceneWidth / 2;
    cusSelect.y = sceneHeight / 2 + 320;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        let total = normalMineCount + doubleMineCount + radioactiveMineCount + antiMineCount + nightMineCount;

        if (total <= (cusBoardHeight * cusBoardWidth) - 1 && total > 0) {
            gameMode = "Custom";
            boardWidth = parseInt(cusWidthLabel.text);
            boardHeight = parseInt(cusHeightLabel.text);
            startGame(boardWidth,boardHeight,total);
        }
        else if (total > 0){
            let numMinesToRemove = total - (cusBoardHeight * cusBoardWidth) + 1;
            if (numMinesToRemove == 1) {
                customSubLabel.text = `Too many mines. Either remove a mine, or increase the number of rows or columns.`;
            }
            else {
                customSubLabel.text = `Too many mines. Either remove ${numMinesToRemove} mines, or increase the number of rows or columns.`;
            }
        }
        else {
            customSubLabel.text = `Please add at least one mine.`;
        }
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    cusSelect = new PIXI.Text("Back");
    cusSelect.anchor.set(0.5);
    cusSelect.style = buttonStyle;
    cusSelect.x = sceneWidth / 2;
    cusSelect.y = sceneHeight / 2 + 370;
    cusSelect.interactive = true;
    cusSelect.buttonMode = true;
    cusSelect.on("pointerup", function e() {
        customScene.visible = false;
        startScene.visible = true;
    });
    cusSelect.on("pointerover", e=>e.target.alpha = 0.5);
    cusSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    customScene.addChild(cusSelect);

    //set up rules scene

    rulePhoto = new PIXI.Sprite.from("images/BasicRules.png");
    rulePhoto.anchor.set(0.5);
    rulePhoto.x = sceneWidth / 2;
    rulePhoto.y = sceneHeight / 2;
    rulesScene.addChild(rulePhoto);

    let rulesSelect = new PIXI.Text("Basic Rules");
    rulesSelect.anchor.set(0.5);
    rulesSelect.style = buttonStyle;
    rulesSelect.x = sceneWidth / 2 - 300;
    rulesSelect.y = sceneHeight / 2 + 270;
    rulesSelect.interactive = true;
    rulesSelect.buttonMode = true;
    rulesSelect.on("pointerup", function e() {
        rulePhoto.texture = PIXI.Texture.from('images/BasicRules.png');
    });
    rulesSelect.on("pointerover", e=>e.target.alpha = 0.5);
    rulesSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    rulesScene.addChild(rulesSelect);

    rulesSelect = new PIXI.Text("Variant Rules");
    rulesSelect.anchor.set(0.5);
    rulesSelect.style = buttonStyle;
    rulesSelect.x = sceneWidth / 2 + 300;
    rulesSelect.y = sceneHeight / 2 + 270;
    rulesSelect.interactive = true;
    rulesSelect.buttonMode = true;
    rulesSelect.on("pointerup", function e() {
        rulePhoto.texture = PIXI.Texture.from('images/VariantRules.png');
    });
    rulesSelect.on("pointerover", e=>e.target.alpha = 0.5);
    rulesSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    rulesScene.addChild(rulesSelect);

    rulesSelect = new PIXI.Text("Back");
    rulesSelect.anchor.set(0.5);
    rulesSelect.style = buttonStyle;
    rulesSelect.x = sceneWidth / 2;
    rulesSelect.y = sceneHeight / 2 + 270;
    rulesSelect.interactive = true;
    rulesSelect.buttonMode = true;
    rulesSelect.on("pointerup", function e() {
        rulesScene.visible = false;
        startScene.visible = true;
    });
    rulesSelect.on("pointerover", e=>e.target.alpha = 0.5);
    rulesSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    rulesScene.addChild(rulesSelect);

    //set up documentation scene

    let docPhoto = new PIXI.Sprite.from("images/Documentation.png");
    docPhoto.anchor.set(0.5);
    docPhoto.x = sceneWidth / 2;
    docPhoto.y = sceneHeight / 2;
    documentScene.addChild(docPhoto);

    rulesSelect = new PIXI.Text("Back");
    rulesSelect.anchor.set(0.5);
    rulesSelect.style = buttonStyle;
    rulesSelect.x = sceneWidth / 2;
    rulesSelect.y = sceneHeight / 2 + 270;
    rulesSelect.interactive = true;
    rulesSelect.buttonMode = true;
    rulesSelect.on("pointerup", function e() {
        documentScene.visible = false;
        startScene.visible = true;
    });
    rulesSelect.on("pointerover", e=>e.target.alpha = 0.5);
    rulesSelect.on("pointerout", e=>e.currentTarget.alpha = 1.0);
    documentScene.addChild(rulesSelect);

    //set up gameScene
    let textStyle = new PIXI.TextStyle({
        fill: 0x00000,
        fontSize: 24,
        fontFamily: "Pixelify Sans"
    });

    let redTextStyle = new PIXI.TextStyle({
        fill: 0xFF0000,
        fontSize: 52,
        fontFamily: "Pixelify Sans"
    });

    //score label
    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.anchor.set(0.5);
    scoreLabel.x = sceneWidth / 2;
    scoreLabel.y = sceneHeight - 60;
    gameScene.addChild(scoreLabel);

    //flag label
    flagLabel = new PIXI.Text();
    flagLabel.style = redTextStyle;
    flagLabel.anchor.set(0.5);
    flagLabel.x = sceneWidth / 2 - 100;
    flagLabel.y = 200;
    gameScene.addChild(flagLabel);

    //time label
    timeLabel = new PIXI.Text();
    timeLabel.style = redTextStyle;
    timeLabel.anchor.set(0.5);
    timeLabel.x = sceneWidth / 2 + 100;
    timeLabel.y = 200;
    gameScene.addChild(timeLabel);
}

// This function sets up the game by calling the three main Generating functions. Originally the Board and Cover functions
// where combined, but I had to take the CoverTile part of the GenerateBoard function out of it, to ensure that the Cover Tiles
// are generated after the Number and Mine tiles, so that they would be on top.
function startGame(width, height, mines){
    GenerateBoard(width,height);
    GenerateMinesAndNumbers(mines);
    GenerateCovers();
    startScene.visible = false;
    customScene.visible = false;
    gameScene.visible = true;
    paused = false;
    flagLabel.text = CoveredTile.flagsLeft;
    timeLabel.text = "0";
}

// This function runs while you're playing the game, and checks whether you have won or lost. It also calls SafetyMine if
// you click a mine on your first click
function gameLoop(){
	if (paused) return; 

    scoreLabel.text = `Press R To Go Back To Main Menu\nPress Space To Switch Flags.\nCurrent Flag: ${CoveredTile.globalMode}`;
    flagLabel.text = CoveredTile.flagsLeft;

    //Checks if you lose
    if(CoveredTile.mineTileClicked != "temp" && safetyClick == false) {
        console.log("you went kaboom");
        createExplosion(CoveredTile.mineTileClicked.x, CoveredTile.mineTileClicked.y, 64, 64);
        face.texture = PIXI.Texture.from("images/DeadFace.png");
        boomSound.play();
        coveredTileList.forEach(c=>gameScene.removeChild(c));
        coveredTileList = [];
        paused = true;
        scoreLabel.text = `Press R To Go Back To Main Menu\nPress The Smiley Face To Restart`;
        stopTimer();
    } //Checks if this is your first click and you clicked a mine
    else if (CoveredTile.mineTileClicked != "temp" && safetyClick == true) {
        let mineClicked = null;
        for (let i = 0; i < mineList.length; i++) {
            if (mineList[i].yIndex == CoveredTile.mineTileClicked.yIndex &&
                mineList[i].xIndex == CoveredTile.mineTileClicked.xIndex) {
                    mineClicked = mineList[i];
            }
        }
        timer();
        CoveredTile.mineTileClicked = "temp";
        SafetyMine(mineClicked);
    }
    
    //This checks if you have clicked at least once. When you did, it disables safety click and starts timer
    if (CoveredTile.firstClick >= 1 && safetyClick == true) {
        safetyClick = false;
        timer();
    }

    //Checks if you win
    if (CoveredTile.numUncovered >= tileCount - mineCount) {
        face.texture = PIXI.Texture.from("images/ShadesFace.png");
        scoreLabel.text = `Press R To Go Back To Main Menu\nPress The Smiley Face To Restart`;
        victorySound.play();
        coveredTileList.forEach(c=>gameScene.removeChild(c));
        coveredTileList = [];
        paused = true;
        stopTimer();
    }
	
}

// Simple timer used for counting up
function timer() {
    let sec = 0;
    intervalId = setInterval(function() {
        timeLabel.text = sec;
        if (paused == false) {
            sec++;
        }
        if (sec >= 1000) {
            stopTimer();
        }
    }, 1000);
}

// Stops the above timer
function stopTimer() {
    clearInterval(intervalId);
}

// The loadSpriteSheet and createExplosions are the only unmodified functions still left over from Circle Blast.
// If it ain't broke, don't fix it.
function loadSpriteSheet() {
    // the 16 animation frames in each row are 64 x 64 pixels
    // we are using the second row

    let spriteSheet = PIXI.BaseTexture.from("images/explosions.png");
    let width = 64;
    let height = 64;
    let numFrames = 16;
    let textures = [];
    for (let i = 0; i < numFrames; i++) {
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i*width, 64, width, height));
        textures.push(frame);
    }

    return textures;
}

// Creates an explosion when you click a mine
function createExplosion(x, y, frameWidth, frameHeight) {
    // the animation frames are 64 x 64 pixels
    let w2 = frameWidth / 2;
    let h2 = frameHeight / 2;
    let expl = new PIXI.AnimatedSprite(explosionTextures);
    expl.x = x - w2; 
    expl.y = y - h2;
    expl.animationSpeed = 1/7;
    expl.loop = false;
    expl.onComplete = e => gameScene.removeChild(expl);
    explosions.push(expl);
    gameScene.addChild(expl);
    expl.play();
}