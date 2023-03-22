class ContextMenu extends Hitbox
{
    root;
    bodyContainer;
    isInitialized = false;
    frameWidth = 12;

    backgroundImage = POPUP_FRAME_SETS[EARTH_INDEX].backgroundImage;
    popupFrameImage = POPUP_FRAME_SETS[EARTH_INDEX].popupFrameImage;
    closeButtonImage = POPUP_FRAME_SETS[EARTH_INDEX].closeButtonImage;

    constructor(boundingBox, id = "")
    {
        super(boundingBox, {}, "", id);
    }

    initialize()
    {
        this.root = this.getRootLayer();
        if(this.root.worldIndex) this.setFrameImagesByWorldIndex(this.root.worldIndex);
        var frameWidth = 0.05 * this.boundingBox.width / uiScaleX;
        var frameHeight = 0.056 * this.boundingBox.height / uiScaleY;
        var frameRightShadowWidth = 0.017 * this.boundingBox.width / uiScaleX;
        var frameBottomShadowWidth = 0.03 * this.boundingBox.height / uiScaleY;
        var closeButtonSize = Math.max(15, frameWidth);
        this.bodyContainer = new Hitbox(
            {
                x: frameWidth,
                y: frameHeight,
                width: this.boundingBox.width - (2 * frameWidth + frameRightShadowWidth),
                height: this.boundingBox.height - (2 * frameHeight + frameBottomShadowWidth)
            },
            {}, "", "bodyContainer"
        );
        this.addHitbox(this.bodyContainer);
        this.closeButton = this.addHitbox(new Button(
            this.closeButtonImage, "", "", "",
            {
                x: this.boundingBox.width - closeButtonSize,
                y: 0,
                width: closeButtonSize,
                height: closeButtonSize
            },
            {
                onmousedown: function ()
                {
                    this.hide();
                }.bind(this)
            },
            'pointer',
            "closeButton"
        ));
        this.isInitialized = true;
    }

    render()
    {
        var context = this.root.context;
        var coords = this.getRelativeCoordinates(0, 0, this.root);
        context.drawImage(this.backgroundImage, coords.x, coords.y, this.boundingBox.width, this.boundingBox.height);
        this.renderChildren();
        drawFrame(context, this.popupFrameImage, coords.x, coords.y, this.boundingBox.width, this.boundingBox.height, this.frameWidth);
        this.closeButton.render();
    }

    show(x, y)
    {
        if(!this.isInitialized) this.initialize();
        var coords = this.parent.getRelativeCoordinates(x, y, this.root);
        coords.x = Math.max(0, Math.min(coords.x, this.root.boundingBox.width - this.boundingBox.width));
        coords.y = Math.max(0, Math.min(coords.y, this.root.boundingBox.height - this.boundingBox.height));
        var localCoords = this.root.getRelativeCoordinates(coords.x, coords.y, this.parent);
        this.boundingBox.x = localCoords.x;
        this.boundingBox.y = localCoords.y;
        this.setVisible(true)
        this.setEnabled(true)
    }

    hide()
    {
        this.setVisible(false)
        this.setEnabled(false)
    }

    toggle(x, y)
    {
        if (this.isVisible())
        {
            this.hide();
        }
        else
        {
            this.show(x, y);
        }
    }

    setFrameImagesByWorldIndex(worldIndex)
    {
        this.backgroundImage = POPUP_FRAME_SETS[worldIndex].backgroundImage;
        this.popupFrameImage = POPUP_FRAME_SETS[worldIndex].popupFrameImage;
        this.closeButtonImage = POPUP_FRAME_SETS[worldIndex].closeButtonImage;
        this.activeTabImage = POPUP_FRAME_SETS[worldIndex].activeTabImage;
        this.inactiveTabImage = POPUP_FRAME_SETS[worldIndex].inactiveTabImage;
    }
}