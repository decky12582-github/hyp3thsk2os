class ChestService
{
    chests = [];
    numChests = 0;
    chestRewardText = "";
    foundGoldChest = false;
    chestsStored = 0; // DEPRECATED
    storedChests = [];
    totalBasicChestsOpened = 0;
    totalGoldChestsOpened = 0;
    totalMoneyFromChests = 0n;
    baseBasicChestsPerGoldChest = 50;

    getTotalChests()
    {
        return this.chests.reduce(total => ++total, 0);
    }

    hasUnclaimedChests()
    {
        return this.getTotalChests() > 0;
    }

    getChestAtDepth(worldDepth)
    {
        return this.getChest(Math.floor(worldDepth / 10));
    }

    getAllExistingChests()
    {
        var existingchests = []
        this.chests.forEach((chest) =>
        {
            if(chest) existingchests.push(chest);
        })

        return existingchests;
    }

    getChest(tenthOfDepth)
    {
        return this.chests[tenthOfDepth];
    }

    chestExistsAtDepth(worldDepth)
    {
        let tenthOfDepth = Math.floor(worldDepth / 10);

        return this.chestExists(tenthOfDepth) && worldDepth == tenthOfDepth * 10 + this.getChest(tenthOfDepth).depthInBlock;
    }

    chestExists(tenthOfDepth)
    {
        return this.chests[tenthOfDepth] !== undefined;
    }

    spawnChest(tenthOfDepth, source = Chest.natural, isGolden = false, validBlockDepths)
    {
        if(source == Chest.natural && !this.isChestCollectorFull() && chestSpawnRoller.rand(1, 100) <= this.getStoredChestsChance())
        {
            this.storeChest(isGolden ? ChestType.gold : ChestType.basic);
        }
        else
        {
            this.chests[tenthOfDepth] = source.new(source, tenthOfDepth, isGolden, validBlockDepths);
        }
    }

    removeAllChests(source)
    {
        this.forEachChest((chest, index) =>
        {
            if(chest.source == source.name)
            {
                this.removeChest(index);
            }
        });
    }

    removeChest(tenthOfDepth)
    {
        delete this.chests[tenthOfDepth];
    }

    forEachChest(callback)
    {
        this.chests.forEach(callback);
    }

    userHasFoundGoldenChest()
    {
        return this.foundGoldChest;
    }

    getChestRewardText()
    {
        return this.chestRewardText;
    }

    spawnChestAtRandomDepth(source)
    {
        let openDepths = Array
            .from(Array(Math.floor(depth / 10)).keys())
            .filter(tenthOfDepth => !this.chestExists(tenthOfDepth));
        let tenthOfDepth = chestSpawnRoller.rand(0, openDepths.length - 1);
        let validBlockDepths = this.getValidBlockDepths(tenthOfDepth);

        if(validBlockDepths.length)
        {
            this.spawnChest(tenthOfDepth, source, this.rollForGoldenChest(), validBlockDepths);
        }
    }

    spawnRandomChestsAndRemoveExpired()
    {
        var maxTenthOfDepth = Math.floor(depth / 10);

        for(var x = 3; x <= maxTenthOfDepth; x++)
        {
            if(this.chestExists(x))
            {
                this.updateChestTTL(x);
            }
            else
            {
                this.rollForRandomChest(x, Chest.natural);
            }
        }
    }

    updateChestTTL(tenthOfDepth)
    {
        let chest = this.getChest(tenthOfDepth);

        if(chest.source == Chest.natural.name)
        {
            if(chest.timeToLive > 0)
            {
                chest.reduceTTL();
            }
            else
            {
                this.removeChest(tenthOfDepth);
            }
        }
    }

    rollForRandomChest(tenthOfDepth, source)
    {
        let validBlockDepths = this.getValidBlockDepths(tenthOfDepth);

        if(validBlockDepths.length && this.rollForBasicChest())
        {
            this.spawnChest(tenthOfDepth, source, this.rollForGoldenChest(), validBlockDepths);
        }
    }

    getValidBlockDepths(tenthOfDepth)
    {
        var depths = [];

        for(let blockDepth = 0; blockDepth < 10; blockDepth++)
        {
            let worldDepth = tenthOfDepth * 10 + blockDepth;
            if(worldDepth <= depth && !isDepthWithoutWorkers(worldDepth) && !isBossLevel(worldDepth))
            {
                depths.push(blockDepth);
            }
        }

        return depths;
    }

    rollForBasicChest() //runs for every 10 depth
    {
        let baseRand = 3000;
        var chanceAtDepth; //higher = lower chance of spawn

        if(depth < 1000)
        {
            chanceAtDepth = baseRand + ((depth - 300) / 2);
        }
        else
        {
            chanceAtDepth = (baseRand + ((1000 - 300) / 2)) * (depth / 1000);
        }
        let chestRoller = Math.floor(chestSpawnRoller.randFloat() * chanceAtDepth);
        let chestThreshold = ((worldAtDepth(0).workersHired * 2) + 1) * STAT.chestSpawnFrequencyMultiplier(); //21

        return chestRoller < chestThreshold;
    }

    rollForGoldenChest()
    {
        let goldenChestChance = randRoundToInteger(1580 * STAT.goldChestSpawnFrequencyMultiplier()); //1 in 158

        return chestSpawnRoller.rand(0, goldenChestChance) <= 10;
    }

    presentChest(tenthOfDepth)
    {
        let chest = this.getChest(tenthOfDepth);
        if(!keysPressed["Shift"])
        {
            openUi(ChestWindow, undefined, chest);
        }
        else
        {
            this.giveChestReward(chest.tenthOfDepth);
            newNews(_("You got {0} from a Chest!", chestService.getChestRewardText()), true);
        }

        if(chest.isGolden)
        {
            trackEvent_FoundChest(1);
        }
        else
        {
            trackEvent_FoundChest(0);
        }
    }

    giveChestReward(tenthOfDepth, saveGameOnOpen = true)
    {
        if(this.chestExists(tenthOfDepth))
        {
            if(this.getChest(tenthOfDepth).isGolden)
            {
                this.foundGoldChest = true;
                this.chestRewardText = goldChestRewards.rollForRandomReward();
                this.totalGoldChestsOpened++;
            }
            else
            {
                this.chestRewardText = basicChestRewards.rollForRandomReward();
                this.totalBasicChestsOpened++;
            }

            this.removeChest(tenthOfDepth);

            if(saveGameOnOpen)
            {
                savegame();
            }
        }
    }

    // CHEST STORAGE

    storeChest(chestType)
    {
        if(this.storedChests[chestType])
        {
            this.storedChests[chestType]++;
        }
        else
        {
            this.storedChests[chestType] = 1;
        }
    }

    grantStoredChest(chestType)
    {
        if(this.storedChests[chestType] > 0)
        {
            this.storedChests[chestType]--;
        }
        else
        {
            return;
        }
        chestService.spawnChest(0, Chest.metaldetector, chestType == ChestType.gold);
        chestService.presentChest(0);
    }

    convertStoredChests(fromType, fromAmount, toType, toAmount)
    {
        if(this.storedChests[fromType] < fromAmount)
        {
            return;
        }
        this.storedChests[fromType] -= fromAmount;
        this.storeChest(toType);
        questManager.getQuest(72).markComplete();
    }

    getBasicChestsPerGoldChest()
    {
        return chestCompressorStructure.statValueForCurrentLevel();
    }

    getMaxStoredChests()
    {
        if(chestCollectorStorageStructure.level > 0)
        {
            return chestCollectorStorageStructure.statValueForCurrentLevel();
        }
        return 0;
    }

    getTotalStoredChests()
    {
        var total = 0;
        for(var i in this.storedChests)
        {
            total += this.storedChests[i];
        }
        return total;
    }

    getStoredChestsOfType(chestType)
    {
        if(this.storedChests[chestType])
        {
            return this.storedChests[chestType];
        }
        return 0;
    }

    isChestCollectorFull()
    {
        return this.getMaxStoredChests() <= this.getTotalStoredChests();
    }

    getStoredChestsChance()
    {
        if(chestCollectorStorageStructure.level > 0)
        {
            return chestCollectorChanceStructure.statValueForCurrentLevel();
        }
        return 0;
    }

    migrateDeprecatedChestStorage()
    {
        for(var i = 0; i < this.chestsStored; ++i)
        {
            this.storeChest(this.rollForGoldenChest() ? ChestType.gold : ChestType.basic);
        }
        this.chestsStored = 0;
    }

    testChestCollector(chestsToSpawn)
    {
        var chestsSpawned = 0;
        this.storedChests = [];
        for(var i = 0; i < chestsToSpawn; ++i)
        {
            chestsSpawned++;
            this.spawnChestAtRandomDepth(Chest.natural);
            if(this.isChestCollectorFull())
            {
                break;
                // chestsCollected += this.getTotalStoredChests();
                // this.storedChests = {};
            }
        }
        console.log(this.storedChests);
        console.log(this.getTotalStoredChests() / chestsSpawned);
        this.removeAllChests(Chest.natural);
    }

    testChestSpawnsForTime(minutes)
    {
        //runs 1000 tests of natural spawn ticks over the given period of time
        var chestResults = [[], []];
        chestCollectorChanceStructure.level = 10;
        chestCollectorChanceStructure.leveledStatsValue[9] = 100;
        chestCollectorStorageStructure.level = 10;
        chestCollectorStorageStructure.leveledStatsValue[9] = 10000;
        var expectedSpawnTicks = minutes * 2;

        for(var testNumber = 0; testNumber < 1000; testNumber++)
        {
            this.storedChests[0] = 0;
            this.storedChests[1] = 0;
            for(var i = 0; i < expectedSpawnTicks; i++)
            {
                this.spawnRandomChestsAndRemoveExpired();
            }
            chestResults[0][testNumber] = this.storedChests[0];
            chestResults[1][testNumber] = this.storedChests[1];
        }

        console.log("average chest spawns for " + minutes + " minutes")
        console.log("basic chests: " + calculateAverageOfArray(chestResults[0]));
        console.log("golden chests: " + calculateAverageOfArray(chestResults[1]));

    }
}

const chestService = new ChestService();