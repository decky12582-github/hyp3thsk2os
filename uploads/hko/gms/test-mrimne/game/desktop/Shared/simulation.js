var isSimulating = false;

class GameSimulator
{
    // Sim config
    minutesBetweenInteractions = 10;
    maxSteps = -1;
    chestOpenChance = 1;
    goldChestOpenChanceWithMetalDetector = 1;
    chestOpenPeriod = 10;
    autosellAll = true;
    allowSleep = false;
    csvOutput = "";
    isLoggingCsv = false;

    runTime = 0;
    totalTime = 0;
    lastChestOpenTime = 0;

    constructor(minutesBetweenInteractions)
    {
        this.minutesBetweenInteractions = minutesBetweenInteractions;
    }

    runForTime(time)
    {
        isSimulating = true;
        this.totalTime = time;
        bossesDefeated = 99999;
        hasLaunched = 2;
        this.runTime = 0;
        this.csvOutput = "TIME MIN,DEPTH,MONEY,MONEY PER MIN,WATTAGE,SECONDS PER DEPTH\r\n";
        while(this.runTime < time)
        {
            this.runStep();

            if(this.isLoggingCsv)
            {
                this.csvOutput += this.runTime + "," + depth + "," + money + "," + valueOfMineralsPerSecond() + "," + drillWattage() + "," + totalEstimatedTimeForCurrentDepth() + "\r\n";
            }
            console.log((100 * this.runTime / time).toFixed(2) + "%");
        }
        isSimulating = false;
    }

    runUntilCondition(conditionCheckFunction)
    {
        isSimulating = true;
        bossesDefeated = 99999;
        hasLaunched = true;
        this.runTime = 0;
        this.csvOutput = "TIME MIN,DEPTH,MONEY,MONEY PER MIN,WATTAGE,SECONDS PER DEPTH\r\n";
        var steps = 0;
        while(!conditionCheckFunction() && (this.maxSteps < 0 || steps < maxSteps))
        {
            ++steps;
            this.runStep();

            if(this.isLoggingCsv)
            {
                this.csvOutput += this.runTime + "," + depth + "," + money + "," + valueOfMineralsPerSecond() + "," + drillWattage() + "," + totalEstimatedTimeForCurrentDepth() + "\r\n";
            }
            console.log(depth);
        }
        isSimulating = false;
    }

    runStep()
    {
        var stepTime = 0;
        var isAsleep = this.runTime % 1440 > 960;
        if(!this.allowSleep || !isAsleep)
        {
            if(this.totalTime > 0)
            {
                var timelapseTime = Math.min(this.minutesBetweenInteractions, this.totalTime - this.runTime);
            }
            else
            {
                var timelapseTime = this.minutesBetweenInteractions;
            }
            while(stepTime < timelapseTime)
            {
                this.initSnapshot();
                timelapse(1);
                this.finishSnapshot(1);
                // Spawn chests and clickables twice per minute
                chestService.spawnRandomChestsAndRemoveExpired();
                updateUserExperience();
                spawnWorldClickables();
                battlerand();
                chestService.spawnRandomChestsAndRemoveExpired();
                spawnWorldClickables();
                this.craftGems()
                // Required for trades
                for(var i = highestOreUnlocked; i < worldResources.length; i++)
                {
                    if(!worldResources[i].isIsotope && worldResources[i].isOnHeader && worldResources[i].numOwned > 0 && highestOreUnlocked < i)
                    {
                        highestOreUnlocked = i;
                    }
                }
                checkForNewTrade();
                stepTime += 1;
            }
            this.runTime += timelapseTime;
            playtime += timelapseTime * 60;
            endAllBuffs();
            // worldResources[33].numOwned = 4000;
        }
        else
        {
            console.log("********************SLEEP********************");
            var sleepTime = Math.min(480, this.totalTime - this.runTime);
            timelapse(sleepTime);
            this.runTime += sleepTime;
            playtime += sleepTime * 60;
        }
        if(depth >= 50)
        {
            hasFoundGolem = 1;
            hasFoundGidget = 1;
            initAvailableBlueprints();
        }
        this.checkAllQuests();
        if(this.runTime - this.lastChestOpenTime >= this.chestOpenPeriod)
        {
            this.openAnyChests();
            this.lastChestOpenTime = this.runTime;
        }
        this.clickAllClickables();
        // this.checkTrades();
        this.craftAllUpgrades();
        this.purchaseAllUpgrades();
        this.sellMineralsToReachCapacity();
        this.updateScientists();
        this.checkBattles();
        this.craftGems();
    }

    craftAllUpgrades()
    {
        var blueprints = getKnownBlueprints();
        for(var i = blueprints.length - 1; i >= 0; --i)
        {
            if(blueprints[i].category == 2)
            {
                for(var level = 0; level < blueprints[i].levels.length; level++)
                {
                    if(canCraftBlueprint(blueprints[i].category, blueprints[i].id, level) && blueprints[i].craftedItem.item.getCurrentLevel() < level)
                    {
                        craftBlueprint(blueprints[i].category, blueprints[i].id, level);
                    }
                }
            }
            else if(canCraftBlueprint(blueprints[i].category, blueprints[i].id))
            {
                craftBlueprint(blueprints[i].category, blueprints[i].id);
                flagBlueprintAsSeen(blueprints[i].category, blueprints[i].id);
            }
        }
    }

    purchaseAllUpgrades()
    {
        var blueprints = getAvailableBlueprints(true);
        for(var i in blueprints)
        {
            if(blueprints[i].price <= money)
            {
                learnBlueprint(blueprints[i].category, blueprints[i].id);
                subtractMoney(blueprints[i].price);
            }
        }

        var worldReference;
        for(var i = 0; i <= Math.floor(depth / 1032); ++i)
        {
            worldReference = worlds[i];
            if(
                worldReference.workersHired < worldReference.workerHireCosts.length &&
                this.canAffordUpgradeWithMineralValue(worldReference.workerHireCost())
            )
            {
                hireMiner(i);
            }
            else if(
                worldReference.workersHired >= 10 &&
                worldReference.workerLevel + 1 <= worldReference.workerLevelCosts.length &&
                this.canAffordUpgradeWithMineralValue(worldReference.workerUpgradeCost())
            )
            {
                upgradeMiners(i);
            }
        }
        if(depth >= 303) oilrigStructure.level = 12;
    }

    openAnyChests()
    {
        if(chestService.hasUnclaimedChests())
        {
            chestService.forEachChest((chest, tenthOfDepth) =>
            {
                if((chest.isGolden && this.canOpenGoldenChest()) || this.canOpenBasicChest())
                {
                    chestService.giveChestReward(tenthOfDepth, false);
                }
            });
        }
    }

    canOpenGoldenChest()
    {
        return metalDetectorStructure.level > 0 && Math.random() < this.goldChestOpenChanceWithMetalDetector;
    }

    canOpenBasicChest()
    {
        return Math.random() < this.chestOpenChance;
    }

    clickAllClickables()
    {
        removeExpiredClickables();
        for(var i in worldClickables)
        {
            while(worldClickables[i])
            {
                onClickedMineralDeposit(worldClickables[i]);
            }
        }
    }

    checkAllQuests()
    {
        //checkQuests();
        var questMax;
        if(depth < 300)
        {
            questMax = 16;
        } else
        {
            questMax = quest.length;
        }
        for(var x = 0; x < questMax; ++x)
        {
            if(quest[x] == 1)
            {
                addMoney(questData[x].rewardMoney);
                if(questData[x].chestType > -1)
                {
                    chestService.spawnChest(questData[x].chestType, Chest.quest);
                    chestService.giveChestReward(questData[x].chestType);
                }
                else
                {
                    if(questData[x].chestType < -1)
                    {
                        chestService.spawnChest(Math.abs(questData[x].chestType), Chest.quest, true);
                        chestService.giveChestReward(Math.abs(questData[x].chestType));
                    }
                }
                quest[x] = 2;
                if(x == 0) {x = 1;} //fix the stupid hacky swap on Steam
                if(x == 1) {x = 0;}
            }
        }
    }

    checkTrades()
    {
        if(isTradeAvailable(earthTradeOffer1))
        {
            if(earthTradeOffer1[TRADE_INDEX_REWARD_TYPE] == TRADE_TYPE_BLUEPRINT &&
                canMakeTrade(earthTradeOffer1))
            {
                var tradeStrings = generateTradeOfferStrings(earthTradeOffer1);
                console.log(_("TRADED {0} => {1}", tradeStrings.paymentString, tradeStrings.rewardString));
                makeTrade(earthTradeOffer1);
                return;
            }
            if(earthTradeOffer2[TRADE_INDEX_REWARD_TYPE] == TRADE_TYPE_BLUEPRINT &&
                canMakeTrade(earthTradeOffer2))
            {
                var tradeStrings = generateTradeOfferStrings(earthTradeOffer2);
                console.log(_("TRADED {0} => {1}", tradeStrings.paymentString, tradeStrings.rewardString));
                makeTrade(earthTradeOffer2);
                return;
            }
            var blueprints = getKnownBlueprints();
            for(var i = blueprints.length - 1; i >= 0; --i)
            {
                for(var j in blueprints[i].ingredients)
                {
                    if(earthTradeOffer1[TRADE_INDEX_REWARD_TYPE] == TRADE_TYPE_ORE &&
                        earthTradeOffer1[TRADE_INDEX_REWARD_SUBTYPE] != earthTradeOffer1[TRADE_INDEX_PAYMENT_SUBTYPE] &&
                        canMakeTrade(earthTradeOffer1) &&
                        earthTradeOffer1[TRADE_INDEX_REWARD_SUBTYPE] == blueprints[i].ingredients[j].item.id &&
                        !blueprints[i].ingredients[j].item.hasQuantity(blueprints[i].ingredients[j].quantity) &&
                        (earthTradeOffer1[TRADE_INDEX_PAYMENT_TYPE] != TRADE_TYPE_ORE ||
                            blueprints[i].ingredients[j].item.getQuantityOwned() - earthTradeOffer1[TRADE_INDEX_PAYMENT_AMOUNT] >= 0
                        ))
                    {
                        var tradeStrings = generateTradeOfferStrings(earthTradeOffer1);
                        console.log(_("TRADED {0} => {1}", tradeStrings.paymentString, tradeStrings.rewardString));
                        makeTrade(earthTradeOffer1);
                        return;
                    }
                    if(earthTradeOffer2[TRADE_INDEX_REWARD_TYPE] == TRADE_TYPE_ORE &&
                        earthTradeOffer2[TRADE_INDEX_REWARD_SUBTYPE] != earthTradeOffer2[TRADE_INDEX_PAYMENT_SUBTYPE] &&
                        canMakeTrade(earthTradeOffer2) &&
                        earthTradeOffer2[TRADE_INDEX_REWARD_SUBTYPE] == blueprints[i].ingredients[j].item.id &&
                        !blueprints[i].ingredients[j].item.hasQuantity(blueprints[i].ingredients[j].quantity) &&
                        (earthTradeOffer2[TRADE_INDEX_PAYMENT_TYPE] != TRADE_TYPE_ORE ||
                            blueprints[i].ingredients[j].item.getQuantityOwned() - earthTradeOffer2[TRADE_INDEX_PAYMENT_AMOUNT] >= 0
                        ))
                    {
                        var tradeStrings = generateTradeOfferStrings(earthTradeOffer2);
                        console.log(_("TRADED {0} => {1}", tradeStrings.paymentString, tradeStrings.rewardString));
                        makeTrade(earthTradeOffer2);
                        return;
                    }
                }
            }
        }
    }

    // Check if the player can afford an upgrade, selling all minerals if necessary
    canAffordUpgradeWithMineralValue(targetPrice)
    {
        if(money >= targetPrice)
        {
            return true;
        }
        else if(money + this.getValueOfMineralsExcludingLocked() >= targetPrice)
        {
            this.sellMineralsToReachMoneyAmount(targetPrice);
            return true;
        }
        return false;
    }

    getValueOfMineralsExcludingLocked()
    {
        var value = 0n;
        for(var i = 1; i < worldResources.length; i++)
        {
            value += BigInt(Math.max(0, (worldResources[i].numOwned - lockedMineralAmtsToSave[i]))) * worldResources[i].sellValue;
        }
        return value;
    }

    getValueOfLockedMinerals()
    {
        var value = 0n;
        for(var i = 1; i < worldResources.length; i++)
        {
            value += BigInt(lockedMineralAmtsToSave[i]) * worldResources[i].sellValue;
        }
        return value;
    }

    lockMineralsForBlueprints()
    {
        lockedMineralAmtsToSave = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ];

        var lockedCategories = {};
        var blueprints = getKnownBlueprints();
        blueprints = filterBlueprintsByCategory(blueprints, 1);
        for(var i in blueprints)
        {
            if(blueprints[i].craftedItem.item.getQuantityOwned() > 0) continue;
            if(!lockedCategories[blueprints[i].subcategory])
            {
                lockedCategories[blueprints[i].subcategory] = 1;
                var totalIngredients = 0;
                for(var j in blueprints[i].ingredients)
                {
                    totalIngredients += blueprints[i].ingredients[j].quantity;
                }

                if(totalIngredients < maxHoldingCapacity())
                {
                    for(var j in blueprints[i].ingredients)
                    {
                        lockedMineralAmtsToSave[blueprints[i].ingredients[j].item.id] =
                            Math.max(blueprints[i].ingredients[j].quantity, lockedMineralAmtsToSave[blueprints[i].ingredients[j].item.id]);
                    }
                    break;
                }
            }
        }


        var worldReference = currentWorld();
        var workerCost = Number.MAX_VALUE;
        if(worldReference.workersHired >= 10)
        {
            workerCost = worldReference.workerUpgradeCost();
        }
        else
        {
            workerCost = worldReference.workerHireCost();
        }
        if(this.getValueOfLockedMinerals() > workerCost * 4) //don't allow locking so much that early workers are skipped
        {
            //unlock all so we can get the miner upgrade

            lockedMineralAmtsToSave = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ];
        }
    }

    sellMineralsToReachMoneyAmount(targetAmount)
    {
        if(this.autosellAll)
        {
            this.sellAllMinerals();
        }
        else
        {
            this.lockMineralsForBlueprints();
            var i = 1;
            while(money < targetAmount && i < worldResources.length)
            {
                if(worldResources[i].sellValue > 0)
                {
                    sellMineral(i);
                }
                ++i;
            }
        }
    }

    sellMineralsToReachCapacity()
    {
        if(this.autosellAll)
        {
            if(maxHoldingCapacity() <= capacity) this.sellAllMinerals();
        }
        else
        {
            this.lockMineralsForBlueprints();
            var i = 1;
            while(maxHoldingCapacity() <= capacity && i < worldResources.length)
            {
                if(worldResources[i].sellValue > 0)
                {
                    sellMineral(i);
                }
                ++i;
            }
        }
    }

    sellAllMinerals()
    {
        this.lockMineralsForBlueprints();
        for(var i in worldResources) sellMineral(i);
    }

    updateScientists()
    {
        for(var scientistIndex = 0; scientistIndex < numActiveScientists(); scientistIndex++)
        {
            if(isOnActiveExcavation(scientistIndex))
            {
                if(isScientistDead(scientistIndex))
                {
                    onClickBuryScientist(scientistIndex);
                }
                else if(isExcavationDone(scientistIndex))
                {
                    if(excavationRewards[activeExcavations[scientistIndex][0]].isRelic)
                    {
                        if(isRelicInventoryFull() || getNumOfEquippedRelicsWithId(excavationRewards[activeExcavations[scientistIndex][0]].id) >= 5)
                        {
                            forfeitRewardForFinishedExcavation(scientistIndex, true);
                        }
                        else
                        {
                            claimRewardForFinishedExcavation(scientistIndex);
                        }

                    }
                    else
                    {
                        claimRewardForFinishedExcavation(scientistIndex);
                    }
                }
            }
            else
            {
                if(excavationChoices[scientistIndex][1][2] > 85)
                {
                    startExcavation(scientistIndex, 0);
                }
                else
                {
                    startExcavation(scientistIndex, rand(0, 1));
                }
            }
        }
    }

    checkBattles()
    {
        if(battleWaiting.length > 0)
        {
            preparebattle(battleWaiting[2], battleWaiting[3]);
            var timeToKillMonster = monsterMaxHP / getTotalDps();
            var timeToKillPlayer = userMaxHP / monsterAtk;
            if(timeToKillMonster < timeToKillPlayer)
            {
                wonBattle();
                battleWaiting = [];
            }
            else
            {
                battleWaiting = [];
            }

        }
    }

    craftGems()
    {
        if(depth < 304) return;

        var gemIds = [RED_FORGED_GEM_INDEX, BLUE_FORGED_GEM_INDEX, GREEN_FORGED_GEM_INDEX, PURPLE_FORGED_GEM_INDEX, YELLOW_FORGED_GEM_INDEX];

        for(var i = 0; i < gemIds.length; i++)
        {
            if(worldResources[gemIds[i]].numOwned < 50 && GemForger.canQueueGem(gemIds[i])) 
            {
                GemForger.addGemToQueue(gemIds[i]);
            }
        }
    }

    initSnapshot()
    {
        getUsedMineralCapacity();
        this.mineralsBeforeMine = capacity;
        if(!isCapacityFull())
        {
            isTakingSnapshot = true;
            valueBefore = getValueOfMineralsExcludingHe3();
        }
    }

    finishSnapshot(snapshotLengthInMinutes)
    {
        getUsedMineralCapacity();
        mineralsMined.shift();
        mineralsMined.push((capacity - this.mineralsBeforeMine) / (snapshotLengthInMinutes * 600));
        var valueDelta = (getValueOfMineralsExcludingHe3() - valueBefore) / (snapshotLengthInMinutes * 600);
        singleMiningLoopValueSnapshot.push(valueDelta);
        if(singleMiningLoopValueSnapshot.length > 10)
        {
            singleMiningLoopValueSnapshot.splice(0, 1);
        }
        timesSinceSnapshot = 0;
        valueBefore = 0n;
        isTakingSnapshot = false;
    }

    downloadCsv()
    {
        saveContentToFile("dist/sim.csv", this.csvOutput);
    }
}