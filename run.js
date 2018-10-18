
var decoded = decodeURIComponent(window.location.search);
var pID = decoded.substring(decoded.indexOf('=')+1);
var filename = pID + "MST";

var setN = 2;
var nLures = 32; // Standard is 64
var nRepeats = 32;
var nFoils = 32;
var nNoClickFrames = 120;
var nFramesAfterInput = 20;
var nPracticeFeedbackFrames = 120;
var nFeedbackFrames = 120;
var nFramesAfterFeedback = 20;
var imgBorder = '1px solid #e5e5e5';
var presentationTime;

var nPointsPerCorrect = 20;

outputText = "Trial,Phase,ImageShown,ImageType,LureBin,RESP,ReactionTime,NewLine,";
var stimuli, masterStimuli, practiceStimuli = [];
var ALL = document.getElementsByTagName("html")[0];
var scoreArea = document.getElementById("scoreArea");
var dialogArea = document.getElementById("dialogArea");
var imageHolder = document.getElementById("imageHolder");
var feedbackImageHolder = document.getElementById("feedbackImageHolder");
var feedbackArea = document .getElementById("feedbackArea");
var buttonArea = document.getElementById("buttonArea");
var buttonInstructions = document.getElementById("buttonInstructions");
var imageArea = document.getElementById("imageArea");
var trialCount = 0;
var noClicks = true;
var isPractice = true;
var gamify = true;
var masterFrameCount = 0;
var score;
var RESP;

function stim(imageName, phase, lureBin, type) {
    this.imageName = imageName;
	this.phase = phase;
	this.lureBin = lureBin;
	this.type = type;
}

function initialize(){
	var loc = window.location.pathname; // Currect directory
	var dir = loc.substring(0, loc.lastIndexOf('/')); // Parent directory
	var xhr = new XMLHttpRequest();
	xhr.open('GET', dir + "/Set" + setN + " bins.txt", true);
	xhr.onload = function(){ // Load images
		var FileNBinPairs = xhr.responseText.split('\n').map(x => x.split('\t')); // Array of 2-element arrays, first being file number, second being lure difficulty bin
		var i, binwisePairs = new Array(5);
		for(i = 0; i < 5; i++){ // Array of arrays of 2-element arrays. Organizing the pairs by lure difficulty bin
			binwisePairs[i] = FileNBinPairs.filter(x => x[1] == (i+1).toString());
			binwisePairs[i] = sample(binwisePairs[i],binwisePairs[i].length); // Randomize
		}
		var lurePairs = [], binIdx = 0;
		for(i = 0; i < nLures; i++){ // Cycle through lure difficulty levels
			lurePairs.push(binwisePairs[binIdx].pop());
			binIdx = binIdx == 4 ? 0 : binIdx+1;
		}
		var nonLurePairs = FileNBinPairs.filter(x => !lurePairs.map(y => y[0]).includes(x[0])); // Find the file numbers that won't be used as lures
		lurePairs = sample(lurePairs,lurePairs.length); // I'm too tired to decide whether this is unnecessary
		nonLurePairs = sample(nonLurePairs,nonLurePairs.length);
		var repeatPairs = [];
		var foilPairs = [];
		for(i = 0; i < nRepeats; i++){
			repeatPairs.push(nonLurePairs.pop());
		}
		for(i = 0; i < nFoils; i++){
			foilPairs.push(nonLurePairs.pop());
		}
		var encodingStimuli = [];
		for(i = 0; i < nRepeats; i++){
			encodingStimuli.push(new stim(repeatPairs[i][0]+"a","encoding",repeatPairs[i][1],"repeat"));
		}
		for(i = 0; i < nLures; i++){
			encodingStimuli.push(new stim(lurePairs[i][0]+"a","encoding",lurePairs[i][1],"lure"));
		}
		encodingStimuli = sample(encodingStimuli,encodingStimuli.length);
		var testingStimuli = [];
		for(i = 0; i < nRepeats; i++){
			testingStimuli.push(new stim(repeatPairs[i][0]+"a","testing",repeatPairs[i][1],"repeat"));
		}
		for(i = 0; i < nLures; i++){
			testingStimuli.push(new stim(lurePairs[i][0]+"b","testing",lurePairs[i][1],"lure"));
		}
		for(i = 0; i < nFoils; i++){
			testingStimuli.push(new stim(foilPairs[i][0]+"a","testing",foilPairs[i][1],"foil"));
		}
		testingStimuli = sample(testingStimuli,testingStimuli.length);
		masterStimuli = encodingStimuli.concat(testingStimuli);
		practiceStimuli.push(new stim("Practice set/PracticeLure_a.jpg","encoding","","lure"));
		practiceStimuli.push(new stim("Practice set/PracticeFoil_a.jpg","encoding","","foil"));
		practiceStimuli.push(new stim("Practice set/PracticeRepeat_a.jpg","encoding","","repeat"));
		practiceStimuli.push(new stim("Practice set/PracticeRepeat_b.jpg","testing","","repeat"));
		practiceStimuli.push(new stim("Practice set/PracticeFoil_b.jpg","testing","","foil"));
		practiceStimuli.push(new stim("Practice set/PracticeLure_b.jpg","testing","","lure"));
		var currImage;
		for(i = 0; i < practiceStimuli.length; i++){	
			currImage = new Image();
			currImage.src = practiceStimuli[i].imageName;
			practiceStimuli[i].image = currImage;
		}
		for(i = 0; i < masterStimuli.length; i++){
			masterStimuli[i].imageName = "Set " + setN + "/" + Array(4-masterStimuli[i].imageName.length).fill("0").join("") + masterStimuli[i].imageName + ".jpg";
			currImage = new Image();
			currImage.src = masterStimuli[i].imageName;
			masterStimuli[i].image = currImage;
			if(i == masterStimuli.length - 1){
				currImage.onload = function(){
					dialogArea.innerHTML = "<p class='dialog'>For this task, first you're asked to classify some items.</p>\
                                            <button onclick='start()'>Start practice</button>";
				};
			}
		}
	};
	xhr.send(null);
}

function sample(inArray,k) {// Sample k elements without replacement
	var arrayToSubsample = inArray.slice(0);// Don't alter original array
	outArray = new Array(k);
	var i, currIdx;
	for(i = 0; i < k; i++){
		currIdx = Math.floor(Math.random()*arrayToSubsample.length);
		outArray[i] = arrayToSubsample[currIdx];
		arrayToSubsample.splice(currIdx,1);
	}
	return outArray;
}

function start(){
    if (gamify) {
        score = 0;
        scoreArea.style.visibility = 'hidden';
    }
    dialogArea.style.display = "none";
	imageArea.style.display = "block";
	ALL.style.cursor = "none";
    if (isPractice) {
        stimuli = practiceStimuli;
    } else {
        stimuli = masterStimuli;
    }
    window.requestAnimationFrame(function(){wait(nFramesAfterInput,showImage)});
}

function showButtons(){
	noClicks = false;
	ALL.style.cursor = "default";
    imageArea.style.display = "none";
	buttonArea.style.display = "block";
    presentationTime = performance.now();
}

function evaluateSubmission(){
	if(noClicks) return;
    RESP = event.target.textContent;
	outputText += (isPractice?0:(trialCount+1)) + "," +
				  stimuli[trialCount].phase + "," +
				  stimuli[trialCount].imageName + "," +
				  stimuli[trialCount].type + "," +
				  stimuli[trialCount].lureBin + "," +
				  event.target.textContent + "," +
                  (event.timeStamp - presentationTime) + ",NewLine,";
	if (stimuli[trialCount].phase == "testing" && (isPractice || gamify)) {
        feedbackScreen();
    } else {
        nextTrial();
    }
}

function nextTrial(){
    if (gamify) scoreArea.style.visibility = 'hidden';
	trialCount++;
	if(trialCount == stimuli.length){
        imageArea.style.display = "none";
        buttonArea.style.display = "none";
        saveData();
        return;
	}
	if(stimuli[trialCount].phase == "testing" && stimuli[trialCount-1].phase == "encoding"){
		imageArea.style.display = "none";
		buttonArea.style.display = "none";
		window.requestAnimationFrame(function(){wait(nFramesAfterInput,switchToTesting)});
		return;
	}
	noClicks = true;
	imageHolder.src = ""; imageHolder.style.border = 'none';
    feedbackImageHolder.src = ""; feedbackImageHolder.style.border = 'none';
	buttonArea.style.display = "none";
    imageArea.style.display = "block";
    feedbackArea.style.display = "none";
	ALL.style.cursor = "none";
	window.requestAnimationFrame(function(){wait(nFramesAfterInput,showImage)});
}

function showImage(){
    imageArea.style.visibility = "visible";
	imageHolder.src = stimuli[trialCount].image.src;
    imageHolder.style.border = imgBorder;
	window.requestAnimationFrame(function(){wait(nNoClickFrames,showButtons)})
}

function switchToTesting(){
	imageHolder.src = "";
	buttonArea.innerHTML = '<p class="dialog"></p><button onclick="evaluateSubmission()"></button><button onclick="evaluateSubmission()"></button><button onclick="evaluateSubmission()"></button>'
	buttonArea.children[0].textContent = "Old, similar, or new?";
	buttonArea.children[1].textContent = "Old";
	buttonArea.children[2].textContent = "Similar";
	buttonArea.children[3].textContent = "New";
	dialogArea.style.display = "block";
	imageArea.style.display = "none";
	buttonArea.style.display = "none";
	ALL.style.cursor = "default"
	dialogArea.style.width = "70%";
	dialogArea.innerHTML = "<p class='dialog' style='text-align: left'>Now you'll be shown some images and asked if they are:<br/><br/>\
                            \u2022Old (identical to an image you already saw)<br/>\
                            \u2022Similar (similar but not identical to an image you already saw)<br/>\
                            \u2022New (a completely new image of an object you didn't see already).</p>";
    dialogArea.innerHTML += "<button onclick='start()'>Continue</button>";
}

function feedbackScreen(){ // gamify NOT implicitly true
    imageArea.style.display = "block";
    buttonArea.style.display = "none";
    feedbackArea.style.display = "block";
    feedbackImageHolder.style.border = imgBorder;
    var imageTypes = ["lure", "foil", "repeat"];
    var correctResps = ["similar", "new", "old"];
    var feedbackStrings = ["This is similar to an image you saw.",
                           "This is a completely new image.",
                           "This is the same image you already saw"];
	if(masterFrameCount == 0){// first call
        var feedbackText = "";
        var i;
        for (i = 0; i < imageTypes.length; i++) {
            if (stimuli[trialCount].type.toLowerCase() == imageTypes[i]) {
                feedbackText = feedbackStrings[i];
                if (RESP.toLowerCase() == correctResps[i]) {
                    feedbackText = "Correct! " + feedbackText;
                    if (gamify) {
                        setTimeout(function(){
                            score += nPointsPerCorrect;
                            scoreArea.innerHTML = "Score: " + score;
                        },nFeedbackFrames*1000/60/5);
                    }
                } else {
                    feedbackText = "Incorrect. " + feedbackText;
                }
            }
        }
		if (stimuli[trialCount].type == "lure") {
            var minusExt = stimuli[trialCount].imageName.split('.')
            feedbackImageHolder.src = minusExt[0].substring(0,minusExt[0].length-1) + "a." + stimuli[trialCount].imageName.split('.')[1];
        } else if (stimuli[trialCount].type == "repeat") {
            feedbackImageHolder.src = imageHolder.src;
        } else if (stimuli[trialCount].type == "foil") {
            feedbackImageHolder.style.border = "none";
        }
        if (gamify) {
            scoreArea.innerHTML = "Score: " + score;
            scoreArea.style.visibility = 'visible';
        }
        feedbackArea.style.display = "block";
		feedbackArea.innerHTML = '<p id="buttonInstructions" class="dialog">' + feedbackText + "</p>";
	}
	if(masterFrameCount == nFeedbackFrames - 1){
        if (isPractice && trialCount == stimuli.length - 1) {
            window.requestAnimationFrame(function(){wait(nPracticeFeedbackFrames,function(){feedbackArea.innerHTML += '<button onclick="intermediaryScreen()">Continue</button>'})});
        } else {
            masterFrameCount = 0;
            buttonArea.innerHTML = '<p class="dialog"></p><button onclick="evaluateSubmission()"></button><button onclick="evaluateSubmission()"></button><button onclick="evaluateSubmission()"></button>'
            buttonArea.children[0].textContent = "Old, similar, or new?";
            buttonArea.children[1].textContent = "Old";
            buttonArea.children[2].textContent = "Similar";
            buttonArea.children[3].textContent = "New";;
            feedbackImageHolder.src = "";
            imageHolder.src = "";
            window.requestAnimationFrame(nextTrial);
        }
        return;
	}
	masterFrameCount++;
	window.requestAnimationFrame(feedbackScreen);
}

function intermediaryScreen(){
	stimuli = masterStimuli;
	isPractice = false;
	trialCount = 0;
    score = 0;
    scoreArea.innerHTML = 'Score: ' + score;
	imageHolder.src = "";
	feedbackImageHolder.src = "";
	imageArea.style.display = "none";
	buttonArea.style.display = "none";
    feedbackArea.style.display = "none";
	buttonArea.innerHTML = '<p id="buttonInstructions" class="dialog">What type of item was that?</p><button onclick="evaluateSubmission()">Indoor</button><button onclick="evaluateSubmission()">Outdoor</button>';
	dialogArea.innerHTML = '<p class="dialog">Click to begin the game<p>';
	dialogArea.innerHTML += "<button onclick='start()'>Start game</button>"
	dialogArea.style.display = "block";
}

initialize();
