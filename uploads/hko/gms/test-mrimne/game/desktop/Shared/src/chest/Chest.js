// Currently only used by chest collector
const ChestType = Object.freeze({
    "basic": 0,
    "gold": 1,
    "black": 2
});

const Chest = (function ()
{
    class TreasureChest
    {
        constructor(tenthOfDepth, depthInBlock, worker, timeToLive, isGolden, source)
        {
            this.tenthOfDepth = tenthOfDepth;
            this.depthInBlock = depthInBlock;
            this.worker = worker;
            this.timeToLive = timeToLive;
            this.isGolden = isGolden;
            this.source = source;
        }

        reduceTTL()
        {
            this.timeToLive -= 30;
        }
    }

    function naturalChest(source, tenthOfDepth, isGolden, validBlockDepths = Array.from(Array(10).keys()))
    {
        let depthInBlock = validBlockDepths[chestSpawnRoller.rand(0, validBlockDepths.length - 1)];
        let timeToLive = 2400 + chestSpawnRoller.rand(0, 3000);

        if(isGolden && !isOfflineProgressActive)
        {
            if(metalDetectorStructure.level > 0) {newNews(_("The Metal Detector Detected a Golden Chest!"), true);}
            if(metalDetectorStructure.level > 1) {newNews(_("Gold Chest Expires in {0} seconds", timeToLive), true);}
            if(metalDetectorStructure.level > 2) {newNews(_("Gold Chest is around Depth {0} Km", tenthOfDepth * 10), true);}
        }

        return new TreasureChest(
            tenthOfDepth,
            depthInBlock,
            chestSpawnRoller.rand(1, workersHiredAtDepth(tenthOfDepth * 10 + depthInBlock)),
            timeToLive,
            isGolden,
            source.name
        );
    }

    function rewardedChest(source, tenthOfDepth, isGolden)
    {
        return new TreasureChest(
            tenthOfDepth,
            0,
            chestSpawnRoller.rand(1, workersHiredAtDepth(tenthOfDepth * 10)),
            0,
            isGolden,
            source.name
        );
    }

    return {
        natural: {
            name: 'natural',
            new: naturalChest
        },
        purchased: {
            name: 'purchased',
            new: rewardedChest
        },
        quest: {
            name: 'quest',
            new: rewardedChest
        },
        excavation: {
            name: 'excavation',
            new: rewardedChest
        },
        cave: {
            name: 'cave',
            new: rewardedChest
        },
        buff: {
            name: 'buff',
            new: naturalChest
        },
        metaldetector: {
            name: 'metaldetector',
            new: naturalChest
        }
    };
})();