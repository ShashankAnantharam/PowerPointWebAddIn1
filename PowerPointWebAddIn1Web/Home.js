'use strict';

(function () {

    Office.onReady(function () {
        // Office is ready
        $(document).ready(function () {
            // The document is ready
          //  $('#insert-image').click(insertImage);
          //  $('#insert-text').click(insertText);
            $('#get-text').click(getText);
            $('#prevPage').click(prevPage);
            $('#nextPage').click(nextPage);


        });
    });

    const entityCommonLen = 6;
    const commonVerbs = { "be": "", "have": "", "do": "", "will": "", "run": "", "can": "", "am": "" }
    const pageMultiple = 7;
    var iconListMap = {};
    var iconKeywords = [];
    var keywordSelected = {};
    var pluralsMap = {};
    var currPage = 1;
    var minPage = 1, maxPage = 2;

    function changePage(increment) {
        if (isNextPage()) {
            maxPage = currPage + 1;
        }
        else {
            maxPage = currPage;
        }

        // console.log("Page change", currPage, maxPage);

        if (currPage + increment >= minPage && currPage + increment <= maxPage) {
            currPage = currPage + increment;

            //change page number in UX
            updatePageUX();

            //change icons here
            for (let i = 0; i < iconKeywords.length; i++) {
                // console.log(iconKeywords[i]);
                let keywordName = iconKeywords[i].name;
                renderIcons(keywordName);
            }
        }
    }

    function updatePageUX(){
        $("#currentPage").html("");
        $("#currentPage").append("Page " + String(currPage))

        $("#nextPage").html("");
        if (isNextPage()) {
            $("#nextPage").append("chevron_right")
        }

        $("#prevPage").html("");
        if (currPage>1) {
            $("#prevPage").append("chevron_left")
        }
    }

    function prevPage() {
        // console.log("prevPage");
        changePage(-1);
    }

    function nextPage() {
        // console.log("nextPage");
        changePage(1);
    }

    function isNextPage() {
        for (let i = 0; i < iconKeywords.length; i++) {
            let keyword = iconKeywords[i].name;
            if ((keyword in keywordSelected)) {
                if (!isNullOrUndefined(keyword) && keyword in iconListMap && iconListMap[keyword].length > 0) {
                    let icons = iconListMap[keyword];
                    let start = (currPage) * pageMultiple;
                    if (icons.length >= start)
                        return true;
                }
            }
        }
        return false;
    }

    function initializePages(){
        currPage = 1;
        updatePageUX();
    }


    function renderKeywords(keywords) {
        if (isNullOrUndefined(keywords))
            return;
        $("#keywords").html("");
        keywordSelected = {};
        keywords.forEach(function (keyword) {
            let item = keyword.name;
            keywordSelected[item] = "";
            $("#keywords").append("<span class=\"keyword-selected\" id=\"keyword-" + item + "\" >" + item + "</span>");
            document.getElementById("keyword-"+item).addEventListener("click", function () {
                onClickKeyword(item);
            }, false);
        });

    }

    function initializeRenderIcons(keywords) {
        if (isNullOrUndefined(keywords))
            return;
        $("#icons").html("");
        keywords.forEach(function (keyword) {
            let item = keyword.name;
            $("#icons").append("<div class=\"individualIconsContainer\" id=\"icon-keyword-" + item + "\" ></div>");          
        });
    }

    function renderIcons(keyword) {
        //Updates rendering of icons

        $("#icon-keyword-" + keyword).html("");
        if (!(keyword in keywordSelected))
            return;

        if (!isNullOrUndefined(keyword) && keyword in iconListMap && iconListMap[keyword].length > 0) {
            let icons = iconListMap[keyword];

            let start = (currPage - 1) * pageMultiple;
            let end = (currPage) * pageMultiple;

            for (let i = start; i < icons.length && i < end; i++) {
                let icon = icons[i];
                let iconId = icon.api_src + "-" + icon.id;
                $("#icon-keyword-" + keyword).append("<img class=\"individualIcons\" src=\"" + icon.preview_url + "\" id=\"" + iconId + "\"/>");
                document.getElementById(iconId).addEventListener("click", function () {
                    clickIcon(icon);
                }, false);
            }
        }
    }

    async function clickIcon(icon) {
        console.log(icon);

        let svgIsSupported = Office.context.requirements.isSetSupported('ImageCoercion', 1.2);
        // svgIsSupported = false;
        if (svgIsSupported && 'svg_download' in icon) {
            let svgImg = await downloadIconFinderIcon(icon.svg_download, icon.id);
            // let svgImg = await getSvgImage("");
            insertSvg(svgImg);
        }
        else {
            //Get png
            let base64Image = await getBase64ImageFromUrl(icon.preview_url);
            base64Image = base64Image.replace("data:image/png;base64,", "");
            base64Image = base64Image.trim();
            insertImage(base64Image);
        }
    }

    async function getBase64ImageFromUrl(imageUrl) {
        var res = await fetch(imageUrl);
        var blob = await res.blob();
        return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.addEventListener("load", function () {
                resolve(reader.result);
            }, false);
            reader.onerror = () => {
                return reject(this);
            };
            reader.readAsDataURL(blob);
        })
    }

    async function getSvgImage(imageUrl) {
        imageUrl = "https://cdn.shopify.com/s/files/1/0496/1029/files/Freesample.svg";

        let output = "";
        let res = await fetch(imageUrl,
            {
                method: 'GET',
                //body: JSON.stringify({ 'text': text }),
                //headers: new Headers({ 'content-type': 'application/json' })
            }
        ).catch((err) => { console.log(err) });

        if (!isNullOrUndefined(res)) {
            output = await res.text();
            console.log(output);
        }
        return output;
    }

    function onClickKeyword(keyword) {
        console.log(keyword);
        if (keyword in keywordSelected) {
            //unselect keyword
            delete keywordSelected[keyword]
            document.getElementById("keyword-" + keyword).className = "keyword-unselected";
           
        }
        else {
            //select keyword
            keywordSelected[keyword] = "";
            document.getElementById("keyword-" + keyword).className = "keyword-selected";
        }

        renderIcons(keyword);
        updatePageUX();
    }
   
    function insertImage(base64string) {
        Office.context.document.setSelectedDataAsync(base64string, {
            coercionType: Office.CoercionType.Image,
            imageLeft: 50,
            imageTop: 50,
            imageWidth: 52
        },
            function (asyncResult) {
                if (asyncResult.status === Office.AsyncResultStatus.Failed) {
                    console.log(asyncResult.error.message);
                }
            });
    }

    function insertSvg(svgImg) {
        Office.context.document.setSelectedDataAsync(svgImg, {
            coercionType: Office.CoercionType.XmlSvg,
            imageLeft: 50,
            imageTop: 50,
            imageWidth: 52
        },
            function (asyncResult) {
                if (asyncResult.status === Office.AsyncResultStatus.Failed) {
                    console.log(asyncResult.error.message);
                }
            });
    }

    function insertText() {
        Office.context.document.setSelectedDataAsync("Hello World!",
            function (asyncResult) {
                if (asyncResult.status === Office.AsyncResultStatus.Failed) {
                    console.log(asyncResult.error.message);
                }
            });
    }

    async function getText() {
        Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, async function (asyncResult) {
            if (asyncResult.status == Office.AsyncResultStatus.Failed) {
                console.log('Action failed. Error: ' + asyncResult.error.message);
                $('#selected-text-here').text("");
            }
            else {
                console.log('Selected data: ' + asyncResult.value);
                $('#selected-text-here').text(asyncResult.value);
                var old_src = "https://cyber-sights.com/inspireBotAddOn";

                let argText = "";
                let selectedText = "";
                for (let i = 0; i < asyncResult.value.length; i++) {
                    if (asyncResult.value[i] != ' ') {
                        argText = argText.concat(asyncResult.value[i]);
                    }
                    else {
                        argText = argText.concat('_');
                    }
                    selectedText = selectedText.concat(asyncResult.value[i]);
                }
                console.log(argText);
                console.log(selectedText);

                $('#inspire-bot-iframe').attr('src', old_src + "?q=" + argText);
                console.log($('#inspire-bot-iframe').attr('src'));
                // $('#inspire-bot-iframe').attr('src', url)

                let output = await googleNlpIconBulletExtraction(selectedText);
                console.log(output);

                let entities = output["entities"];
                let verbList = output["verbList"];
                verbList = await pointsVerbAlgo(verbList);

                let finalList = [];
                finalList = await pointsEntityAlgo(entities);

                for (let j = 0; j < verbList.length; j++) {
                    finalList.push(verbList[j]);
                }
                console.log(finalList);

                iconKeywords = finalList;
                renderKeywords(finalList);
                initializeRenderIcons(finalList);

                initializePages();

                let iconsPromise = [];
                for (let i = 0; i < finalList.length; i++) {
                    searchIconWrapper(finalList[i].name);
                }
                
                
            }
            // console.log(jQuery().jquery);
        });
       
    }

    async function googleNlpIconBulletExtraction(text) {
        if (isNullOrUndefined(text) || text.trim().length == 0)
            return { "entities": [], "verbList": [] };

        let entityPromise = googleNlpEntityExtraction(text);
        let syntaxPromise = googleNlpSyntaxExtraction(text);
        let allPromises = [entityPromise, syntaxPromise];

        let results = await Promise.all(allPromises);

        let entities = results[0];
        let syntaxes = results[1];
        // console.log(entities,syntaxes)

        let lemmaMap = {};
        let verbList = [];

        let verbCnt = 0;
        for (let i = 0; i < syntaxes.length; i++) {
            if (syntaxes[i].text && syntaxes[i].lemma && (syntaxes[i].text != syntaxes[i].lemma)) {
                lemmaMap[syntaxes[i].text] = syntaxes[i].lemma
            }
            if (syntaxes[i]["part_of_speech"] && syntaxes[i]["part_of_speech"] == "VERB" && syntaxes[i]['lemma']) {
                if (verbCnt < 3) {
                    verbList.push({
                        "name": syntaxes[i]['lemma'],
                        "salience": 0.5
                    });
                    verbCnt++;
                }
            }
        }
        // console.log(lemmaMap);


        for (let i = 0; i < entities.length; i++) {
            if (entities[i].name && entities[i].name in lemmaMap) {
                entities[i].name = lemmaMap[entities[i].name];
            }
            let mentions = entities[i].mentions
            for (let j = 0; !isNullOrUndefined(mentions) && j < mentions.length; j++) {
                if (mentions[j].text && mentions[j].text in lemmaMap) {

                    if (entities[i].mentions[j].text != lemmaMap[entities[i].mentions[j].text]) {
                        //Plural
                        pluralsMap[lemmaMap[entities[i].mentions[j].text]] = entities[i].mentions[j].text;   
                    }

                    entities[i].mentions[j].text = lemmaMap[entities[i].mentions[j].text]
                }
            }

        }
        // console.log(entities);
        // console.log(verbList);
        console.log(pluralsMap);

        return { "entities": entities, "verbList": verbList };
    }


    async function googleNlpEntityExtraction(text) {
        const endpoint = 'https://us-central1-flowpro-9e1c6.cloudfunctions.net/entityExtraction';
        let output = {};
        // console.log(endpoint);
        // console.log(searchQuery);

        let res = await fetch(endpoint,
            {
                method: 'POST',
                body: JSON.stringify({ 'text': text }),
                headers: new Headers({ 'content-type': 'application/json' })
            }
        ).catch((err) => { console.log(err) });

        if (!isNullOrUndefined(res)) {
            let resJson = await res.json();
            output = resJson;
            // console.log(output);    
        }
        return output
    }

    async function googleNlpSyntaxExtraction(text) {
        const endpoint = 'https://us-central1-flowpro-9e1c6.cloudfunctions.net/syntaxExtraction';
        let output = {};
        // console.log(endpoint);
        // console.log(searchQuery);

        let res = await fetch(endpoint,
            {
                method: 'POST',
                body: JSON.stringify({ 'text': text }),
                headers: new Headers({ 'content-type': 'application/json' })
            }
        ).catch((err) => { console.log(err) });

        if (!isNullOrUndefined(res)) {
            let resJson = await res.json();
            output = resJson;
            // console.log(output);    
        }
        return output
    }

    async function pointsVerbAlgo(verbList) {
        if (isNullOrUndefined(verbList) || verbList.length == 0)
            return [];

        // console.log(verbList);

        let finalList = [];

        for (let i = 0; i < verbList.length; i++) {
            if (!(verbList[i].name in commonVerbs)) {
                finalList.push(verbList[i]);
            }
        }
        return finalList;
    }


    async function pointsEntityAlgo(pointEntities) {
        if (isNullOrUndefined(pointEntities))
            return [];

        let entityList = [];
        let prevEntities = {};
        // console.log(pointEntities);
        let len = pointEntities.length;
        let limit = Math.max(len / 3, entityCommonLen);
        let properNoun_limit = Math.max(len / 3, entityCommonLen);
        let currentCommonEntities = 0;
        let currentProperEntities = 0;

        let tempPointEntityArr = [];
        let iS = 0, iE = len - 1, flag = false;
        while (iS <= iE) {
            let iCurr = iS;
            if (flag)
                iCurr = iE;
            tempPointEntityArr.push(pointEntities[iCurr]);
            if (flag)
                iE--;
            else
                iS++;
            flag = !flag;
        }
        pointEntities = tempPointEntityArr;

        // console.log(pointEntities);

        for (let i = 0; i < len; i++) {
            let currEntity = pointEntities[i];
            if (currEntity.mentions) {
                for (let j = currEntity.mentions.length - 1; j >= 0; j--) {

                    //This part remains similar in any algorithm (iterate over sentences)
                    let shouldAdd = false;

                    if (currEntity.mentions[j].type == "PROPER" && currentProperEntities < properNoun_limit)
                        shouldAdd = true;
                    if (currEntity.mentions[j].type == "COMMON" && currentCommonEntities < limit) {
                        shouldAdd = true;
                    }
                    if (!(currEntity.mentions[j].text.trim() in prevEntities) && shouldAdd) {
                        let wordSplit = currEntity.mentions[j].text.trim().split(" ");
                        if (currEntity.mentions[j].type == "COMMON" &&
                            (wordSplit.length > 1 && (wordSplit[1] != "and" && wordSplit[1] != "&"))) {
                            //multiple words same line
                            for (let k = 0; k < wordSplit.length; k++) {
                                let currWord = wordSplit[k].trim();
                                if (currWord.length > 0 && !(currWord in prevEntities)) {
                                    entityList.push({
                                        name: currWord,
                                        salience: currEntity["salience"]
                                    });
                                    prevEntities[currWord] = "";
                                    currentCommonEntities++;
                                }
                            }
                        }
                        else {
                            entityList.push({
                                name: currEntity.mentions[j].text.trim(),
                                salience: currEntity["salience"]
                            });
                            prevEntities[currEntity.mentions[j].text.trim()] = "";

                            if (currEntity.mentions[j].type == "COMMON") {
                                currentCommonEntities++;
                            }
                            else if (currEntity.mentions[j].type == "PROPER") {
                                currentProperEntities++;
                            }
                        }
                    }
                }
            }
        }
        // console.log(entityList);
        return entityList;
    }

    async function searchIconWrapper(query) {

        if (iconListMap[query] && iconListMap[query].length > 0) {
            renderIcons(query);
            updatePageUX();
            return;
        }

        let outputProm = [], output_nounProjProm = [], outputPluralProm = [];
        outputProm = searchIconsFromKeywords(query);

        if (query in pluralsMap)
            outputPluralProm = searchIconsFromKeywords(pluralsMap[query]);

        // output_nounProjProm = CoreHelper.searchNounProjectIconsFromKeywords(query);

        let [output, outputPlural, output_nounProj] = await Promise.all([outputProm, outputPluralProm, output_nounProjProm]);

        output = [...output, ...outputPlural, ...output_nounProj];

        //dedup output
        let tempIconMap = {}
        let tempOutput = [];
        for (let i = 0; !isNullOrUndefined(output) && i < output.length; i++) {
            if ("api_src" in output[i] && "id" in output[i]) {
                let key = output[i].api_src + "_" + output[i].id;
                if (!(key in tempIconMap)) {
                    tempIconMap[key] = 1;
                    tempOutput.push(output[i]);
                }
            }
        }
        output = tempOutput;

        if (isNullOrUndefined(output) || output.length < 5) {
            let synonyms = [];
            synonyms = await getWordSynonyms(query);
            // console.log(synonyms);

            for (let i = 0; !isNullOrUndefined(synonyms) && i < Math.min(2,synonyms.length); i++) {
                let synonymWord = synonyms[i];
                let newOutput = await searchIconsFromKeywords(synonymWord);
                //console.log(synonymWord, newOutput);

                if (!isNullOrUndefined(newOutput)) {
                    for (let j = 0; j <= Math.min(3, newOutput.length); j++) {
                        if (!isNullOrUndefined(newOutput[j]))
                            output.push(newOutput[j]);
                    }
                }

                // console.log(synonymWord, newOutput);
                if (!isNullOrUndefined(output) && output.length > 3)
                    break;
            }
        }

        if (!isNullOrUndefined(output) && output.length > 0) {
            for (let i = 0; i < output.length; i++) {
                // console.log(output[i]);
                output[i]['query'] = query;
            }
        }

        iconListMap[query] = output;

        renderIcons(query);
        updatePageUX();
    }

    async function searchIconsFromKeywords(query) {
        if (isNullOrUndefined(query) || query.trim() == "")
            return [];


        let bodyJson = { 'query': query }

        let output = [];
        const endpoint = 'https://us-central1-flowpro-9e1c6.cloudfunctions.net/iconfinderApiSearch';
        let res = await fetch(endpoint,
            {
                method: 'POST',
                body: JSON.stringify(bodyJson),
                headers: new Headers({ 'content-type': 'application/json' })
            }
        ).catch((err) => { console.log(err) });

        // console.log(res);
        if (!isNullOrUndefined(res)) {
            let resJson = await res.json();
            if ('iconList' in resJson)
                output = resJson['iconList'];
        }
        // console.log(output);

        return output;
    }

    async function getWordSynonyms(word) {
        if (isNullOrUndefined(word) || word.trim() == "")
            return [];
        let bodyJson = { 'word': word }

        let output = [];
        const endpoint = 'https://us-central1-flowpro-9e1c6.cloudfunctions.net/getWordSynonym';
        let res = await fetch(endpoint,
            {
                method: 'POST',
                body: JSON.stringify(bodyJson),
                headers: new Headers({ 'content-type': 'application/json' })
            }
        ).catch((err) => { console.log(err) });

        // console.log(res);
        if (!isNullOrUndefined(res)) {
            let resJson = await res.json();
            // console.log(resJson);
            if (!isNullOrUndefined(resJson) && resJson != "{}" && 'synonyms' in resJson)
                output = resJson['synonyms'];
        }
        // console.log(output);

        return output;
    }

    async function downloadIconFinderIcon(url, id) {
        const endpoint = 'https://us-central1-flowpro-9e1c6.cloudfunctions.net/iconFinderImageDownloadV2';
        let output = "";
        // console.log(endpoint);
        // console.log(searchQuery);

        let res = await fetch(endpoint,
            {
                method: 'POST',
                body: JSON.stringify({ 'url': url, 'id': String(id) }),
                headers: new Headers({ 'content-type': 'application/json' })
            }
        ).catch((err) => { console.log(err) });

        if (!isNullOrUndefined(res)) {
            let resJson = await res.text();
            output = resJson;
            // console.log(output);    
        }
        return output
    }

    function isNullOrUndefined(item) {
        if (item != null && item != undefined)
            return false;
        return true;
    }

    function getImageAsBase64String() {
        // return 'iVBORw0KGgoAAAANSUhEUgAAAZAAAAEFCAIAAABCdiZrAAAACXBIWXMAAAsSAAALEgHS3X78AAAbX0lEQVR42u2da2xb53nH/xIpmpRMkZQs2mZkkb7UV3lifFnmNYnorO3SLYUVpFjQYoloYA3SoZjVZRi2AVtptF+GNTUzbGiwDQu9deg2pCg9FE3aYQ3lDssw2zGNKc5lUUr6ItuULZKiJUoyJe2DFFsXXs6VOpf/D/kS6/Ac6T2Hv/M8z3nf5zTMz8+DEEL0QCOHgBBCYRFCCIVFCKGwCCGEwiKEEAqLEEJhEUIIhUUIIRQWIYTCIoQQCosQQigsQgiFRQghFBYhhFBYhBAKixBC1hArh2CBwtlYaTRV6ac2f7Cx2Q3AsTfEsSKEwlprYQ3Gpt4bFLixfU+vpdltCwTte0JNHQFrR4ADSEgdaGCL5AVGvhkSLqyV1t/gd+wN2feGHHtClBchFJbq3Hq5b+LCGfn7sfl7nI+HWw710VyEUFhqkf1BJPuDkwrusOXgsfW94ZZDfRxb8oBCEpn4yn90BmF1ozUIq5sjVCOb4RCoxMSFMxMXzlg3+D1fjDgfD3NAzE4ph6EwMlWjeKsLziDaQvCE0BbimDHCquyX8/Fb33lapZ3b9/RueD5q8wc5zuYl2VfDVqvx9MLbB28fHCwvUFjLmUknr/3xw6oewvPMNzzPRDjUZmQsgfNHpX/cewzePvgYp1NYS/j4yw1qH8K+p3fTS/GFKV3ERLw/gCuvyN2Jww9fGP4BM5e6ONP9ATZ/j9qHmHpvcOSbobnJHEfbXBSSCuykmMbwSZwNYDiCkkkvIQpryQ1sT6guueclOotIp5Rf1NZIjMIyNfZ6LbuZSV8a/W6YA05kaWvoOM6FlIndKCxdRlh1XCc4ceFM/o0ox9wsqDRHITuItx9G2kQXEoW1ZCya3S0Hj9XtcNkfRJgYmgVfGFaXWjv/4Os4FzJJVYvCWkbz4fpNTJ+bzDPIMk30HsDuqIrOyg7i7aAZ0kNOa1ghkVzqdzx1jOlcgb9jkGUaiimkow+0UkiilFdy/1YXdkeNPV2LwlrJ6KvhwtnT5f1iQYsbdifWNcPmkH2k/SK3X5j37B/gOTIaYwlMpTCeRDaBwiW5e+t+zcDOorBWUnbKu9UGjw/OdkWPtF/SpzY9C18YG57kmTImpRwycWTiotfxmMNZFFYZlvbGarTA44PLq8Jh9sv4rMOPfTGujzW4ua7HcCWKYprOorCqlhouJ2586ygAWzO8ASWyP8WFtUDXCexm2d7w988YhiNStGVEZ1FYFYOsufSgbycaLeocwA58Son9eHrxcJx9lIzPcATpqOgi/ZGLcBqqRwiFVZ7ZD37ccOY31bIVgBZgm0K7cvbgSJKnzASRfwpDYWTFNPK2uvB4ykj3M87DKsd0znL2d1W0FQAF08zCJQyFedKMjyOAwwnsOiXiI6U8zoWMNAYUVjnifRhPq3uIJmUz2NNlGu8SQ+IfwJGLIuagFi5hOEJhGZcLUVwbVP0oihfyh8KmbTliOpxBHEnCKbgb0vBJjCUoLGMmg3i7LrejFqV3WMqbahEs00McTohw1rsGKRpQWKvCq+m86kdpUWe3FJapsLpFOKuYNkZiSGGtCK9O1uNArerstpRnJcuMzhJYz0pHUUxRWMYKr+qDDGEVpiwXPnZe+NhZ/scUFp1V5X6m/yCL87CW8FfueuSDMqaMJi67I68H7k5ZAGx2z7z83PDOzZPLtuCcLHMyEsPQcUFbPvYLXb80jBHWJ7wbq4etAMjoXnPfVgBu5Gwv/eP2VQHYJZ5JM+ILwyus96TOgywK6xM+qlcyJVVYH95ovm+r+87ieSOLdMcEJYYjp3U9/YWvqgcATOfw0Zl6HMgDSJ1AvzL7A9bbZ8ts9/OAkIWyh/7kYJWfbt68+eWXX965cycvDf18ld3YHRWUGKaj2K7XOIsRFgDgaqJOB5LXpuapA3eW/u+XP50ps5GwZf3lZXc/drtx44UXXvjwww95aegsMfT0CgiyYkwJmQ8KC6/k5XAvPXX1qQN3DmwtHNha+MYXUy/82ojkXa2O11Zw9+7db3/727w0dIaQ0KmY1u/TZKaEdYywZHcBdNpnI19MKfK7HNp2951fOKtv88477/DS0BltIXh6a3d0yMTh7dPj38cICxhPqb7UGcAGueGVshzcWuCZNyZCuv7rNsKisICM+hOXLAqEVwoLa1uhehmL6BVvHxz+GtuU8jp9JxiFVRdhdUp/OKiqs3jyjYmQzsj6DLIoLPULWK2qLR6UR2gv29GYWFj6bDhDYQHjKRV33gR0avTv/sKBO8wKjYkjUDsrZEqoW2GpVnG3AAEtJoP3KT+TixiAjloPAUt5PTZvML2wVC1gbQbsmv7rv/TpWwyyjImQd1bqMMgyvbCmVavjdMpa51wfnPZZBlnGRMjbvSgsRlgPYiuPPgaAQZYxEdJD5p7+nrqYfqa7GhFWp25stRBkJf6MLbSMSM0p74ywiL5sRQiFpSsUnIRlAfy0FdEMQuruTAlNih3YovVngoToPSWksJRgA+DV9HwrQspQyuvuV6aw5NEEbFHtPYOEEApLGda54MpjIweC6BbhL47WDHxKKIl9/fhKirYimqbmNCurmxGW0aOqAwM4OIB1bg4G0ToFA06vo7CEseMY9oWxo48jQQiFpUk6erAlhC0heorokpqd3XU4Ucv0wvIuWSNqd6MjiHVueIPYEuIFX7unEtEsQlrHsIalP45GeW1XxENr6ze8StTeRkhHB43Bp4SkMkI67RJtIqQDciuFRYwTXvUacjEaI6wH+b4OU0IKi1RAyDuEiTYpJFGs1fhbh/kghUUq0HWC4ZWOuR4TEEHr8vxSWGQVvn7s5rMIPTMq4J2DfFU9MYitumMcBh2TiQvIB3sE9VDWHpw4Sj7B4ceuqE5vvOQBaQHRsW4nrFBYpsfqQlsI3j5OYjACY4naE9wB+AcoLCKD/1ViJ/uBz81zLE3NcKT2NrrNB8EallZgb2Uin5GYscMrCksz2DgERB6lHN4XYCKrS9e5P4WlDdhkmchkKCyoR7uewysKSzOs5xAQeclg5oyg8IrCIgpgB5o4CkQShSSGjgva0j+gx/WDFJYmcXEIiHiKKZwLCdrS4TfA+lBOa9AMHuC27J38tIEDWSccftgDcAbhCMAZXJull6Uckn1CXy+4ywjLrSgsLWWFdmCKA6GX0CaNYnrZNALvMXhC8PbVaZZTKYdzIRQuCdrYe8wYaxga5uc51VAz4UwWuCbj4/t5SjQSLPfiobC6swcKSZwLCY2trC48ntJ79WoB1rA0lhWy9G4AsoMYOo6fuTEcQSmn/P4zcRG2AtAdM4atKCzt4eMQGIVSHsMncTagsLbeH0DyaRG26jphpAXtTAm1lBIu8DEwwZTQWCjSCWMsgQ8GhBatFnD24IihXqfKCEt7dAIWjoKxKKaRfBrJPomhVjGFoTDOHxVtq8MJgw0kIyztRVgAxoG0+E8xwtI+VheCcRFzIIopjMSQjorIAe8f6HBCp43bKSy9CQvALSBDYRmUXadqL5HJxJGJY+S0RC0a0VbgPCztshG4B2Q5EEbkg6+jkCzTirqUw1gCmTiyidptjs1nKwpL23QCduAGB8KIjJzG9E1s/SOUcigkUUyhkBRXojKfrZgSajglvM84cA2YZUpIarFQZTfKlKuy8Cmh5mkFdgEeDgSpiq/f8LaisGSH3/XBAnRSW6Qyu04ZaTo7haVSBF7fSoEN6AT2Ap1AK+dqkU/SwCMX9d6WT0SQwDOuMyyA55NQaxaYAmaBIsfFlAG+f8AALa4orDpGWEJeUqKqvBaawbfyZJgMXz+2R/T7ti4Kay1ocnMMSL3x9GJ7ZG36BVJYuo+wCGFURWHpA3NfOqRe98Ue+MJ4KGyGh4AUFiMsok/q3HCZwjLL3U/+cgpCltL+6zj4JoehLJyHxSCLaIw7P1GlsTKFRSgsogrXYxwDCovCIjrhSpRjQGGpgFmnwxB1KaZRSHIYKCwV8PRyDIjyZOIcAwpLBQz0DiVCYVFYzAoJEU/hEp8VUlgq4AzC4ecwEOUZZxmLwlIDD4MsogLZBMeAwlIBlrGIKlkhIywKSyVh1a1dMjEP91jDorBUwhfmGBClU8JBjgGFpQ4PUViEUFh6wRmEs4fDQAiFpRNM8+YSQigs/cPSOyEUlm6wull6J4TCYlZICKGwFMcRgK+fw0AIhaUTTPYmXkIoLAZZhBAKi0EWIRQWWRlkdZ3gMBBCYemEHRHOySJEcfgiVcFM5/BRHFcTyCQxKuDlqRuAzRw1QiisOnM1gXei+OiMuE/dBjyAncNHCIVVHzJJvDWAa1K7fIwA2ziIhFBYdeC/Inj7pKw9TAC3gQ0cSkIoLPWYzuFfQoIKVbVjNMAFNHFMCVEAPiUslwYqZSsAs0CKY0oIIyw1GE/hX0OYziu5zykgA3g5uIQwwlI2E4z3KWyrBW4BExxfQigsBXkzrFgmuJo0MMshJoTCUoQL4mdaiWIW+JijTAiFpUgy+HZE9aNMAdc41oRQWDJ5a0CV0tVqssBtDjchFJZkxlN493T9DncDyHLQCaGwpDEUq/cRr/GhISFS4Dws4N3YGhw0DWzj0mgVmZvBzBhmZzAzVuFebcO6NljXw7qeo0Vh6YVMEuPpNTjuwkNDOktRpm6ieBMzYyjexNyMiA86NsHWBvsmODah0caBpLA0y0fxNTs0naUQE1cweQUTV8RJainFmyjeRP7yoryau9DSxchLi5i+hnU1sZZHX3AW61nSaN6J7tfwRLbpsxfh65dsq9XyuvM/uPI6bv0ME1c4ytqiYX5+3tQD8LeBtUkJV9AJeHg1CsayHr/0fXQ8tfTf5iZz+Tei+Teic5NKzlCxrocnCOeONfpLPzfPs01hLeHlBq38JpvZOUsYzh4cTsDqLvtDo2mLwmJKKCMO6lVx5zeAIoe4Fr5+HElWshWAxma355lI11+mnI8r+XbI0l2M/ieu/RumbvIcMMLSS4T10jwAZJIYTSKTRCYpvXtymTQH2MsLsirdr8EXFr558XJi9NVw6bbCKb9rLzzBej1MZIRFYckV1gqU8pcH6OQFWQGHH8E4nEGxn5ubzGVfj+TffEXZX8e6Ht5HYd9EYVFYuhOWUv7yA628IMvhPYbuWJU0sCYT5+Ojr4aVrWoB8AThCar8t1NYFJa6wpLsr72AhRfkikjGhd1RUWlgJUqjqZvf6ZtJK9zvrKULHY+qmR5SWBRWXYUl0F+tgJ9X44oAphfdMTgCSu1vbjI3+t3wxAWFu57Z2rDpCdVmmVJYFNZaCquSvyb+GbZbvBwfBFbdMXj71Nj36KvhwlmFm3M02uB7ErY2Ckt1OK1hTfEGsS+Mo1E0T3EwFuk6gcdTKtkKQMeLMWVnPACYm8HIm4Czh2ePwjIBhSRKeQ4DPL147BfYHZVTX19DZ+Fwgs6isEzA9RhVhUNv4XBCwYpV/Z0Fq5vOorBMwGjcvH/7fVW1hep8ZBWd5eADFArLwPlgMW3GP9zXjyMX10RV92l/PmrzKx0QWd0IxmF18dKmsIzIWEKZ/ez8C30kIw4/dp3CE1l0xyTMXFf46m92+/400distFycQQTjvLQpLCMyElNgJ95jCPwBjiRx5CK6TmgxJbG64OvHobfwWAr+AbXL6mKdpciuZtLJB//TFsL2bygTgBMKSysUUygoMfe6a+DBvX13FI+ltGIuhx++fgR/iCdy6I6tYfZXBZs/2P7cKfn7mZ3ILfv/7RF4j8nd6b0cvyXLbnwcgrUkE1dGCqtFsGCu3VEUU8jEkU1gLFGnyRNWF9pC8ITQFlrzpE8grs8PTF1OKD4JHt0xnA1wzgqFRWEtv5NX01kA/gH4BxYDumwC40kUkgpP/vL0whlEaxDOoF4ktYKOr8aKvxdQeIH0QgH+/FFe6RSW/inlkJXdTsvqEjEp3BGAIwzfkl9gPIlSbrFQcr/8X8qVSVQdftgDD8K3JjccAdgDaA1qpyAlqzjS7O54MXbrO08rvN+2ELpO4MorvN4pLIZXkFXAtroXc8kF5W03+wlpOdTXcvCY5MSwdDtV/gc7IhiNS5y8MpXiF2XZfYVDoG9hKdF6hSxNDCXPciiNpireGHZFJf5CRQqLwtKKsGSXeH39dVvLYpbvQ7Pb80xEYWEtxLAeSS8EoLAoLIZXpAquzw9YN0iZDnJvtKpcumMUFoVlYmF5erU5rckIieGLUuSybOLoahwBdJ0QvVNOHF2RXnMIRCDhJYb7+rFveRzkDWKdWwFhPcTwSi0ce0P2Pb1T74l7hjs3mZ+bzDU2V34GsiOCkZi42SSlPIopJv6MsOp2sw5iS2jZfwu2kjkHyuFnPqgq0ipZxcuJquGBe3FCHIMsCksi61ReVe8tN4tS/oJn2qouQZbCWSEWpqGIvOSUWh5PYRmBr6Rw4ISK+y8rLJkNsKwuKTdqon6QVSPCkhZkZSksCutBhOXG0Sieu4gOFXqzdPRgnbtMhC+zAZa3zxiTy40XZE29Nzg3WWu5stggq3CJzwoprFVx0LMJ7FO6/+TBcvfS6zG5u90e4RmrD5u2lnw74fHB2Q5bs3JBltiMPsPuWhTW6lDryRhCpxTbYat/5fNBRSJ8Ty+fGdXv67HtM3YnPJvREUDnHgSC2LgdznZYK785dfK8ALmIzQoVaZpGYRmQgwN48jVldnW03GoM+Q2wGF7V+XpY+m2xoMWNjgC69qNzL1xeNK56WffE+XjtrNARENcqi1khhVWRfWEF4qx9/djRp3xsX7b1FVEz7p7f9aWyP7E50L5lMeZqWVJRnJvMTwgJssRmhQyyKKxq91U59ayOnvLhlfzLjuFV3Wn45T+svkGLGxu3o2s/nO2LAVdhUMBZ9vaJ6webjvJcUFhVEzppzw07evBsoszDQfn5oKjWV0QpvMF5187aJ8e2mCp6fJj5cLD2hCyxQVYpzyCLwqqWC+BJ8dfHgRN4PlneVpBdbtfSuxvMFWQ9/FWhXycLPJuxaTvybwgIiMRmhcOMrymsqrdWEXNKO3vxW29VzAQXkFnA4uz2taJb3MjbnShdPF2q3rwBgCMgrudMMc3EkMKqyq9Gaqzd6ezFgRN47iKeTWBLqGpIn5PVAIutr9Y03J7f8llRn2jfgsyrAjQndgX7cAQlU79Hh90aaiWGX1Po+mB4peuscN+XcfXfhW9vc6ApNVi8nHDsrXob8/YBx0X8HqU8Popgt3njLEZY9ULOEla2vlpzdoh+3NG+BXf+5vkac7KsbtHvLrzyipmXQ1NY9UJOhMXWVzrMChst8DivZl+P1NhOwpPfd8OmTQwprHrZSnIDLLa+0k5WKJIWN+bOvVJjdaFHfOxcTGPIpJcEhaX58Iq20m1WuJAYZv/6C9WeGDoCcIqf8Zc5Y85ZDhSWtoXF1ldaygrnOg6K/oJZsMl/93b0N6oVs6TNBx4+acKppBSW+sh5KTxbX2nq27Lvt6V8yoI2x3s3v/VYRWdJXsAwdNxszqKw1Oe6jEuKiwc1RfWpdpWxObCheejOqc+Ud5YzKLpvslmdRWGpj+SGyGx9pTW8wXmLXbKz2psuZP/84fLOkjNtZei4eWrwFJb6+aDkhsgMr7TH/MZfkf5ls8A+lypfgJfwrHApI6cpLKIEkuf4sfWVNr8wO4/J+fhMETZ/UOEIa+FqobCIAkiuLzC80iZSy1gLzLZVmMEgp4y18HEKi8hFcgMstr7SLDLKWAAaHzqiinQoLKIAkqdfsfWVhpl37ZL2wdIMmrY+UvHHcrJCmSUwCovIEhZnt2v5O7NLYvBbmsY6f1CVKKmVERaRSSmH7KAkW7H1ldazQokVgrsVKu4yIyyH3zzxOIXF8IrUSVhzLVXvQ1a3xId9pilgUVjaE5azh7MZtE5rQGLdfWOtpYh2SZE1hUWUEJakhshc6qwHJNTd52Zh3fpojY2k3atMU3GnsDQWXrH1lU5o2Pak2I/MTFYtYMmJlVoZYZE1ERZtpRdhbdgt9iPFu6jR3x2Q8rDFTBV3CktjwmI+qBdaRZulRsVdcoRlpgIWhaUOYwkpDbB8/ZwsqhvEL9Bp3LhfaMREYVFYOgivuHhQV8w3rBP3gY0HBG0m9kGhmSruFJY6SGiAxdZXuhOWR0QZa6oA+x5hZhEbMbUywiJykNYAi9Ur3eHsEr7tdBHrAsLM0iSmLGCyijuFpQLXY6I/4vCzN4P+vjm+A8I3LlnaG5uFmUVUiidtoimFRR6QTYj+CKtXekTUAp32/ar8DuZbFEFhKYqEBlhsfaVT1onIxRoDvao4yGSPCCkspZHwfNAX5mwGXeISmo6JqLiLhcIispDQEJnldp0ieO7ovRnBFfdFDQl7EbTVZcInyxSWcpRyovNBtr4yAffu2YVW3BdNJGxj84VXFJYG8kGiW+Zc+wRt5hHZ2kHgzAZTtiGisNZOWGx9pXcsVkFbiW2pLDB0YoRFZOWDYhtgsXqld5rW19yk4osI5UNhkfqFV2x9pX/mW2svVJ6erPriiTK3vThy/117S1NW3AFYedkpg9g3PNNWumXuys9LP33JmnvH0jBbc+N79+zOjoCg6+dKVESQbsrwisJauwiL+aAeQ6r/+9HsT79mnUrbADQIs1vNinshifcHRL9gyazVTwpLIVuJaoDF1le6Yzp374fPNV3/kdgvjPVTVZspD0cwfFLK78MIi1QL1zNxZBMS3zu/Gi4e1BfjqdLfH26avS32c6UZWDZW6EJTyuFin8Q3V1JYpKKqPhhQzFMLsPWVzsLn5Pz3HrHOz0gJyypV3Es5nAtJv67MWnGnsKrcHHMYCkt8VVd1WL3SVWw1/71HGiTZCsBMES1lhTUUlnUXNGt4RWFVtpWcG2AV2PpKR0znZv/h0xaptgIw21ZuVeBwRO6N0MTzjTkPq462AqtXemLuP37fMj0i69v10JGV/1RISqyyL7vtmbekQGGtQj1bsfWVrpLBxvdek3Xjm0HT1kdW/uv7ShQETJwSUlirwnWVbAW2vtITsz9+UW6kPr2q4j6WkP5YkMKisMokg+moivtnuV0/4ZXl+k9k7qN4d9UqQgnt0lbj6TXzmaGwlpCOSnkBqtDwiq2vdMP85e/L30mZVz1Le2ElwysKqzyK3ACr5INEL8Ia+icF9rLx4Mp8UJHbYSuFRSD1fYJC74psfaWrb0X+Xbnh1SysWx9d9k8SXqfECIvCqshYQsWds3qlI8ZT8vcxM7mqgFVIUlgUlnKUcmrtma2v9EVeAWEV78Kxd3lMfU+JC8zcFXcKqy7QVuajTMWd4ZUSNMzPz/PyIoQwwiKEEAqLEEJhEUIIhUUIIRQWIYTCIoQQCosQQigsQgiFRQghFBYhhFBYhBAKixBCKCxCCKGwCCGG4/8BAjn5LoppTCkAAAAASUVORK5CYII=';
        //return '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';
        // return "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNy4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iNDcycHgiIGhlaWdodD0iMzkycHgiIHZpZXdCb3g9IjAgMCA0NzIgMzkyIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA0NzIgMzkyIiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnIGlkPSJMYXllcl8zIj4NCgk8cGF0aCBmaWxsPSIjRkZCNTY0IiBkPSJNMjg4LjcsMTg3LjdjLTUzLjctMzIuNi0xMTkuOCwxLTExOS44LDFzMTEuNiw5Mi42LDExLjQsMTIxLjRjLTAuOCwyLTEsNC4xLTAuNCw2LjMNCgkJYy0wLjIsMS4yLTAuNiwxLjctMSwxLjdoMS43YzEuMSwzLDIuOSw0LjMsNS44LDUuM2MxMC45LDQsMjEuNSw2LjgsMzMuMSw3LjdjMy42LDAuMyw3LjEsMC4yLDEwLjUtMC4yYzEuNiwxLjUsNCwyLjQsNy4xLDIuMQ0KCQljMTMuMi0xLjIsMjgtMS45LDM4LjYtMTAuM2MxLjctMS40LDIuNy0yLjcsMy4xLTQuN2gwLjhMMjg4LjcsMTg3Ljd6Ii8+DQoJPHBvbHlnb24gZmlsbD0iIzUyRTJENyIgcG9pbnRzPSIxNzMuMiwxNDYuNCAxODAuNSwxODQgMjA2LjYsMTc3LjIgMjAwLjEsMTQ0IAkiLz4NCgk8cGF0aCBmaWxsPSIjRkZGQkU4IiBkPSJNMjIyLjYsMTMzLjhjMCwwLTE3LjktMTUuNi01LjMsMzkuOWMwLjYsMi41LDE5LjQsMy40LDE5LjQsMy40TDIyMi42LDEzMy44eiIvPg0KCTxwYXRoIGZpbGw9IiNGOUEwMzUiIGQ9Ik0xODguNiwxODEuNGMwLDAtMjAuNiwwLTIwLjYsMTIuNGMwLjEsMTcuMiwxMy40LDEwNS42LDEzLjEsMTE5LjljLTAuMiw5LjMsMTkuMSwxMy42LDE5LjEsMTMuNiIvPg0KCTxwYXRoIGZpbGw9IiNGRkI1NjQiIGQ9Ik0yMDAuMiw5My4zYzAsMCw5LjcsNTAuMiwxMS42LDQ4LjRjMi0xLjgsMTAuOC03LjksMTAuOC03LjlsLTEzLjUtNDAuNUgyMDAuMnoiLz4NCgk8cGF0aCBmaWxsPSIjRkZGQkU4IiBkPSJNMTg0LjEsMTIzLjZjMCwwLTEyLjksMjQuNi0xMC45LDIyLjhjMi0xLjgsMjctMi40LDI3LTIuNEwxODQuMSwxMjMuNnoiLz4NCgk8cGF0aCBmaWxsPSIjRjI1RjY4IiBkPSJNMjU3LjksOTIuOGMtMS41LDItMyw0LjEtNC40LDYuM2MtMS4yLDEuOS0yLjksMi4zLTQuNiwxLjljLTEuNywzLjQtMy41LDYuNy01LjcsOS44DQoJCWMtNi4yLDIyLjQtMC43LDQxLjctOC43LDYzLjhjLTEuMywzLjUsMC4zLDAuMywyLjIsMi41YzUuNi0zLDMxLjEsMy41LDM4LjcsNC4yYzEuNy0yLjMtOS4xLTMuMy0xMC4zLTYuNmMxLjQsMy45LDAuMi01LjIsMC4yLTYuMQ0KCQljMC4zLTIuNiwwLTUuNSwwLjMtOC4xYzAuNy00LjYtMS40LTYuNC0wLjgtMTFjMS45LTE0LjUsMy40LTI5LjQsMy00NC4xYy0yLjItMy45LTQuMS03LjktNS42LTEyLjENCgkJQzI2MSw5Mi45LDI1OS40LDkyLjcsMjU3LjksOTIuOHoiLz4NCjwvZz4NCjxnIGlkPSJMYXllcl8yIj4NCgkNCgkJPHBvbHlsaW5lIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0FGM0E0NiIgc3Ryb2tlLXdpZHRoPSI0Ljk3NjMiIHN0cm9rZS1saW5lY2FwPSJzcXVhcmUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgcG9pbnRzPSINCgkJMjM4LDE3MS4xIDI0NS4yLDEwOSAyNjAuNCw4Ni45IDI2Ny43LDExMC44IDI2NS4xLDE3NC44IAkiLz4NCgkNCgkJPHBvbHlsaW5lIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0FGM0E0NiIgc3Ryb2tlLXdpZHRoPSI0Ljk3NjMiIHN0cm9rZS1saW5lY2FwPSJzcXVhcmUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgcG9pbnRzPSINCgkJMTgwLjIsMTgyLjQgMTczLjgsMTQ0IDE4NC4xLDEyMy42IDIwMC4xLDEzOS4yIDIwNi42LDE3Ni4yIAkiLz4NCgkNCgkJPHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQUYzQTQ2IiBzdHJva2Utd2lkdGg9IjQuOTc2MyIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBkPSINCgkJTTIxOC4yLDE3NC44YzAsMC00LjUtMTYuNS05LTM2LjRjLTQuOC0yMS4zLTkuNy00My44LTktNDUuMWMxLjMtMi42LDUuNC00LjgsOC45LDBjMiwyLjcsNy45LDIxLjYsMTMuNSw0MC41DQoJCWM2LjMsMjEuMSwxMi4yLDQyLjMsMTEuOSw0MC44Ii8+DQoJPHBhdGggZmlsbD0iI0FGM0E0NiIgc3Ryb2tlPSIjQUYzQTQ2IiBzdHJva2Utd2lkdGg9IjIuNDg4MiIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBkPSJNMjAwLjIsOTMuM2MtMTEuNi0xMi4yLTEwLjQtMTkuMi02LjYtMjMNCgkJYzYuNi02LjYtMi44LTE2LjYtMC45LTE2LjhjNi42LTAuNiwyOC42LDkuNiwxNy4zLDM2LjkiLz4NCgkNCgkJPHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQUYzQTQ2IiBzdHJva2Utd2lkdGg9IjQuOTc2MyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGQ9Ig0KCQlNMjQ1LjIsMTA5YzAsMCwxMS4zLTQuOCwyMi41LDEuOSIvPg0KCQ0KCQk8cGF0aCBmaWxsPSIjRkZGQkU4IiBzdHJva2U9IiNBRjNBNDYiIHN0cm9rZS13aWR0aD0iNC45NzYzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgZD0iDQoJCU0yMDAuMSwxMzkuMmMwLDQuNy0xMi4yLDQuNy0xMi4yLDQuN2MtMy4yLDUuMy0xNC4xLDAtMTQuMSwwIi8+DQoJPHBhdGggZmlsbD0iI0FGM0E0NiIgZD0iTTE5MC45LDEzMC4zYzMuNCwzLjMtMTIsMy41LTEyLDMuNWw1LjEtMTAuMkwxOTAuOSwxMzAuM3oiLz4NCgkNCgkJPHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQUYzQTQ2IiBzdHJva2Utd2lkdGg9IjQuOTc2MyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGQ9Ig0KCQlNMjExLjgsMTQxLjZjNy43LDAsMTEuNC02LDExLjQtNiIvPg0KCQ0KCQk8cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNBRjNBNDYiIHN0cm9rZS13aWR0aD0iNC45NzYzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgZD0iDQoJCU0xNjksMTg4LjhMMTY5LDE4OC44YzQzLjktMjEuNSw5NC4zLTE2LjYsMTE5LjgtMS4xTDI3NywzMjEuOWMwLDAtMzkuOSwyMy4yLTk1LjItMS4xTDE2OSwxODguOHoiLz4NCgkNCgkJPHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQUYzQTQ2IiBzdHJva2Utd2lkdGg9IjQuODIyOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGQ9Ig0KCQlNMjU1LjcsMjcwLjRsLTIuMi0zMi42bC0yNC40LTE4LjlMMjA1LDIzNi42YzAuMywxMS44LDEuNCwyMi44LDEuNywzNC42QzIwNi42LDI3MS4yLDIzNiwyNzUuOSwyNTUuNywyNzAuNHoiLz4NCgkNCgkJPGxpbmUgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQUYzQTQ2IiBzdHJva2Utd2lkdGg9IjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiB4MT0iMjI5LjUiIHkxPSIyMTkiIHgyPSIyMjkuNSIgeTI9IjI0NiIvPg0KCQ0KCQk8cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNBRjNBNDYiIHN0cm9rZS13aWR0aD0iMy44NTgyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgZD0iDQoJCU0yMzMuMiwyNDAuOGMtMS41LDAtMi45LDAuMy02LjgsMC40YzAsMC0xLTAuOS0wLjEsNS45YzIuOSwwLjEsNCwwLjIsNi45LDAuMkMyMzMuMiwyNDcuNCwyMzMuMiwyNDIuNSwyMzMuMiwyNDAuOHoiLz4NCjwvZz4NCjwvc3ZnPg0K";
        //data:image/svg+xml;base64,
        return '<svg><rect x="0" y="0" height="50" width="50" style="stroke:#ff0000; fill:#0000ff" /></svg>';
    }

})();

/* 
 * In case files aren't loading, clear the cache in the trusted add-ins in File->Options
 * */