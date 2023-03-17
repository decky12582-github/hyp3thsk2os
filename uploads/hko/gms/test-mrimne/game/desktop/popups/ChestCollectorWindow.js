class ChestCollectorWindow extends TabbedPopupWindow
{
    layerName = "ChestCollector"; // Used as key in activeLayers
    domElementId = "HIRED"; // ID of dom element that gets shown or hidden
    context = HR;         // Canvas rendering context for popup

    constructor(boundingBox)
    {
        super(boundingBox);
        if(!boundingBox)
        {
            this.setBoundingBox();
        }

        this.setFrameImagesByWorldIndex(0);
        this.initializeTabs([]);
        this.initializeHitboxes();
    }

    initializeHitboxes()
    {
        var basicChestDisplay = new Hitbox(
            {
                x: this.bodyContainer.boundingBox.width * 0.04,
                y: this.bodyContainer.boundingBox.height * -0.05,
                width: this.bodyContainer.boundingBox.width * 0.30,
                height: this.bodyContainer.boundingBox.height * 0.7
            }, {}, ""
        );
        basicChestDisplay.render = function (parentWindow)
        {
            var coords = this.getRelativeCoordinates(0, 0, parentWindow);
            var imageBoundingBox = drawImageFitInBox(
                parentWindow.context,
                basicChestIconClosed,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.width
            );
            parentWindow.context.save();
            parentWindow.context.font = "24px Verdana";
            parentWindow.context.fillStyle = "#FFFFFF";
            parentWindow.context.textBaseline = "top";
            fillTextWrap(
                parentWindow.context,
                "x " + chestService.getStoredChestsOfType(ChestType.basic),
                coords.x,
                imageBoundingBox.y + imageBoundingBox.height,
                this.boundingBox.width,
                "center"
            );
            parentWindow.context.restore();
            this.renderChildren();
        }.bind(basicChestDisplay, this);
        this.basicChestButton = basicChestDisplay.addHitbox(new Button(
            upgradeb, _("Open Basic Chest"), "18px KanitM", "#000000",
            {
                x: 0,
                y: basicChestDisplay.boundingBox.height * 0.78,
                width: basicChestDisplay.boundingBox.width,
                height: basicChestDisplay.boundingBox.height * 0.15
            },
            {
                onmousedown: function ()
                {
                    chestService.grantStoredChest(ChestType.basic);
                }
            }
        ));
        this.basicChestButton.isEnabled = () => chestService.getStoredChestsOfType(ChestType.basic) > 0;
        this.bodyContainer.addHitbox(basicChestDisplay);

        var goldChestDisplay = new Hitbox(
            {
                x: this.bodyContainer.boundingBox.width * 0.66,
                y: this.bodyContainer.boundingBox.height * -0.05,
                width: this.bodyContainer.boundingBox.width * 0.30,
                height: this.bodyContainer.boundingBox.height * 0.7
            }, {}, ""
        );
        goldChestDisplay.render = function (parentWindow)
        {
            var coords = this.getRelativeCoordinates(0, 0, parentWindow);
            var imageBoundingBox = drawImageFitInBox(
                parentWindow.context,
                goldChestIconClosed,
                coords.x,
                coords.y,
                this.boundingBox.width,
                this.boundingBox.width
            );
            parentWindow.context.save();
            parentWindow.context.font = "24px Verdana";
            parentWindow.context.fillStyle = "#FFFFFF";
            parentWindow.context.textBaseline = "top";
            fillTextWrap(
                parentWindow.context,
                "x " + chestService.getStoredChestsOfType(ChestType.gold),
                coords.x,
                imageBoundingBox.y + imageBoundingBox.height,
                this.boundingBox.width,
                "center"
            );
            parentWindow.context.restore();
            this.renderChildren();
        }.bind(goldChestDisplay, this);
        this.goldChestButton = goldChestDisplay.addHitbox(new Button(
            upgradeb, _("Open Gold Chest"), "18px KanitM", "#000000",
            {
                x: 0,
                y: goldChestDisplay.boundingBox.height * 0.78,
                width: goldChestDisplay.boundingBox.width,
                height: goldChestDisplay.boundingBox.height * 0.15
            },
            {
                onmousedown: function ()
                {
                    chestService.grantStoredChest(ChestType.gold);
                }
            }
        ));
        this.goldChestButton.isEnabled = () => chestService.getStoredChestsOfType(ChestType.gold) > 0;
        this.bodyContainer.addHitbox(goldChestDisplay);

        var compressorText = new Hitbox(
            {
                x: 0,
                y: this.bodyContainer.boundingBox.height * 0.62,
                width: this.bodyContainer.boundingBox.width,
                height: this.bodyContainer.boundingBox.height * 0.05
            }, {}, ""
        );
        compressorText.render = function (parentWindow)
        {
            var coords = this.getRelativeCoordinates(0, 0, parentWindow);
            parentWindow.context.save();
            parentWindow.context.font = Math.floor(this.boundingBox.height) + "px Verdana";
            parentWindow.context.fillStyle = "#FFFFFF";
            parentWindow.context.textBaseline = "top";
            fillTextShrinkToFit(
                parentWindow.context,
                _("Compress {0} Basic Chests into {1} Gold Chest", chestService.getBasicChestsPerGoldChest(), 1),
                coords.x,
                coords.y,
                this.boundingBox.width,
                "center"
            );
            parentWindow.context.restore();

        }.bind(compressorText, this);
        compressorText.isVisible = () => chestCompressorStructure.level > 0;
        compressorText.isEnabled = () => chestCompressorStructure.level > 0;
        this.bodyContainer.addHitbox(compressorText);


        this.compressButton = new Button(
            upgradeb, _("Compress"), "18px KanitM", "#000000",
            {
                x: (this.bodyContainer.boundingBox.width - goldChestDisplay.boundingBox.width) * 0.5,
                y: this.bodyContainer.boundingBox.height * 0.73,
                width: goldChestDisplay.boundingBox.width,
                height: this.bodyContainer.boundingBox.height * 0.1
            },
            {
                onmousedown: function ()
                {
                    chestService.convertStoredChests(ChestType.basic, chestService.getBasicChestsPerGoldChest(), ChestType.gold, 1);
                    clickedCompress = true;
                }
            }
        );
        this.compressButton.isVisible = () => chestCompressorStructure.level > 0;
        this.compressButton.isEnabled = () => chestCompressorStructure.level > 0 && chestService.getStoredChestsOfType(ChestType.basic) >= chestService.getBasicChestsPerGoldChest();
        this.bodyContainer.addHitbox(this.compressButton);

        this.collectButton = new Button(
            upgradeb, _("Collect from worlds"), "16px KanitM", "#000000",
            {
                x: (this.bodyContainer.boundingBox.width - goldChestDisplay.boundingBox.width) * 0.5,
                y: this.bodyContainer.boundingBox.height * 0.86,
                width: goldChestDisplay.boundingBox.width,
                height: this.bodyContainer.boundingBox.height * 0.1
            },
            {
                onmousedown: function ()
                {
                    chestService.getAllExistingChests().forEach((chest) =>
                    {
                        if(!chestService.isChestCollectorFull())
                        {
                            if(chest.source == "natural")
                            {
                                if(!chest.isGolden)
                                {
                                    chestService.storedChests[0]++;
                                }
                                else
                                {
                                    chestService.storedChests[1]++;
                                }
                                chestService.removeChest(chest.tenthOfDepth);
                            }
                        }
                    })
                }
            }
        );
        this.collectButton.isVisible = () => metalDetectorStructure.level >= 6;
        this.collectButton.isEnabled = () => metalDetectorStructure.level >= 6 && chestService.getAllExistingChests().length > 0 && !chestService.isChestCollectorFull();
        this.bodyContainer.addHitbox(this.collectButton);
    }

    render()
    {
        this.clearCanvas();
        this.basicChestButton.image = chestService.getStoredChestsOfType(ChestType.basic) ? upgradeb : upgradebg_blank;
        this.goldChestButton.image = chestService.getStoredChestsOfType(ChestType.gold) ? upgradeb : upgradebg_blank;
        this.compressButton.image = chestService.getStoredChestsOfType(ChestType.basic) >= chestService.getBasicChestsPerGoldChest() ? upgradeb : upgradebg_blank;
        this.collectButton.image = chestService.getAllExistingChests().length > 0 && !chestService.isChestCollectorFull() ? upgradeb : upgradebg_blank;
        this.renderChildren();
    }
}