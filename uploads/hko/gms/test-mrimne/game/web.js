class WebPlatform extends Platform
{
    pendingOrder;
    domain;

    constructor()
    {
        super();
        this.language = this.getSystemLanguage();

        if(languageOverride != "" && translations.hasOwnProperty(languageOverride))
        {
            this.language = languageOverride;
        }

        try
        {
            if (document.referrer.includes("armorgames"))
            {
                this.domain = "armorgames";
            }
            else
            {
                var refererSplit = document.referrer.split("://")[1].split(".");
                if(refererSplit.length >= 3) 
                {
                    this.domain = refererSplit[1];
                }
                else 
                {
                    this.domain = refererSplit[0];
                }
            }
        }
        catch(e)
        {
            console.warn(e);
        }
    }

    initMusic()
    {
        this.music = new Audio(mainMusic);
        this.music.volume = 0;
        this.music.loop = true;
        return this.music;
    }

    toggleMusic()
    {
        this.music.volume = (mute == 0) ? musicFadeInVolume : 0;
    }

    playMusic()
    {
        this.music.play();
    }

    buyPack(packNum)
    {
        if(this.domain == "armorgames")
        {
            window.parent.postMessage({
                type: "purchase",
                sku: purchasePacks[packNum].ag_sku
            }, "https://19230.cache.armorgames.com");
        }
        else if(!this.pendingOrder)
        {
            this.pendingOrder = purchasePacks[packNum];
            document.getElementsByClassName("paypal-button")[0].click();
        }
        else
        {
            throw "An incomplete purchase is already in progress";
        }
    }

    completePurchase(packNum)
    {
        console.log(packNum);
        alert("Transaction complete. Thank you for your purchase!");
        var ticketsToAdd = purchasePacks[packNum].tickets;
        trackEvent_PurchasedTickets(ticketsToAdd, purchasePacks[packNum].priceCents);
        tickets += ticketsToAdd;
        console.log("Added " + ticketsToAdd + " tickets");
        centsSpent += purchasePacks[packNum].priceCents;

        logRevenue(purchasePacks[packNum].priceCents);

        var centPrice = (purchasePacks[packNum].priceCents / 100);
        var revenue = new amplitude.Revenue().setProductId('tickets_' + tickets).setPrice(centPrice).setQuantity(1);
        amplitude.getInstance().logRevenueV2(revenue);

        ajax(
            "backend/logtransaction.php",
            {
                paymentAmount: purchasePacks[packNum].priceCents / 100,
                ticketsPurchased: ticketsToAdd,
                uid: platform.getUserId()
            },
            "POST",
            () => handleNameSubmission()
        );
        if(fbq)
        {
            fbq('track', 'Purchase', {currency: "USD", value: (purchasePacks[packNum].priceCents / 100)});
        }
        platform.pendingOrder = null;
    }

    setQuestData()
    {
        questManager.getQuest(20).name = _("JOIN THE COMMUNITY");
        questManager.getQuest(20).description = _("Join the Mr.Mine discord for news, promo codes, and more!");
        questManager.getQuest(20).additionalOnClick = function () {openDiscord(); checkReview();};

        window["a20"] = window["a20v2"];
        window["a20g"] = window["a20gv2"];

        //questManager.getQuest(1).additionalOnClick = function () {showSimpleInput(_("Send this message to a friend to share the game with them!"), _("Copy Message"), generateShareText(), () => {copyShareText(); shareMouseDown();}, _("Cancel"));};
    }

    getUserId()
    {
        if(typeof (localStorage["uid"]) === "undefined")
        {
            localStorage["uid"] = rand(100, Number.MAX_SAFE_INTEGER);
        }
        return localStorage["uid"];
    }

    getSystemLanguage()
    {
        return getLanguageFromCode(window.navigator.userLanguage || window.navigator.language);
    }
}

function getCurrentWindow()
{
    return window;
}

window.addEventListener("message", function (event)
{
    if(event.origin != "https://files.armorgames.com" && event.origin != "https://19230.cache.armorgames.com")
    {
        return;
    }
    switch(event.data.type)
    {
        case "purchase":
            var packNum = getPurchasePackIndexBySku(event.data.data.sku);
            platform.completePurchase(packNum);
            break;
        case "consumeOldPurchase":
            var packNum = getPurchasePackIndexBySku(event.data.data.sku);
            platform.completePurchase(packNum);
            break;
        case "loginStatus":
            platform.isLoginRequired = true;
            platform.isLoggedInToHost = event.data.value;
            break;
        default:
            break;
    }
});

var platform = new WebPlatform();
language = platform.language;

const SUBSCRIPTION_ENDPOINT = "https://mrmine.com/subscribe.php";
const CODE_REDEMPTION_ENDPOINT = "https://mrmine.com/redemption.php";