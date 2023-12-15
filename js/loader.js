WebFont.load({
    google: {
        families: ['Pixelify Sans']
    },
    active: e => {
        console.log("font loaded!");
        // pre-load the images
        app.loader.
            add([
                "images/CoveredTile.png",
                "images/NightCoveredTile.png",
                "images/NegOneTile.png",
                "images/NegTwoTile.png",
                "images/NegThreeTile.png",
                "images/NegFourTile.png",
                "images/NegFiveTile.png",
                "images/NegSixTile.png",
                "images/NegSevenTile.png",
                "images/NegEightTile.png",
                "images/ZeroTile.png",
                "images/ZeroNumTile.png",
                "images/OneTile.png",
                "images/TwoTile.png",
                "images/ThreeTile.png",
                "images/FourTile.png",
                "images/FiveTile.png",
                "images/SixTile.png",
                "images/SevenTile.png",
                "images/EightTile.png",
                "images/NineTile.png",
                "images/TenTile.png",
                "images/ElevenTile.png",
                "images/TwelveTile.png",
                "images/ThirteenTile.png",
                "images/FourteenTile.png",
                "images/FifteenTile.png",
                "images/SixteenTile.png",
                "images/SeventeenTile.png",
                "images/EighteenTile.png",
                "images/NinteenTile.png",
                "images/TwentyTile.png",
                "images/TwentyOneTile.png",
                "images/TwentyTwoTile.png",
                "images/TwentyThreeTile.png",
                "images/TwentyFourTile.png",
                "images/MineTile.png",
                "images/DoubleMineTile.png",
                "images/AntiMineTile.png",
                "images/RadioactiveTile.png",
                "images/NightMineTile.png",
                "images/FlagTile.png",
                "images/DoubleFlagTile.png",
                "images/RadioactiveFlagTile.png",
                "images/NegFlagTile.png",
                "images/NightFlagTile.png",
                "images/QuestionTile.png",
                "images/explosions.png",
                "images/WallTile.png",
                "images/MixedCornerTile.png",
                "images/WhiteCornerTile.png",
                "images/BlackCornerTile.png",
                "images/LeftIntersectionTile.png",
                "images/RightIntersectionTile.png",
                "images/HappyFace.png",
                "images/DeadFace.png",
                "images/ShadesFace.png"
            ]);
        app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
        app.loader.onComplete.add(setup);
        app.loader.load();
    }
});