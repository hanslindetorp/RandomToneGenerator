// Längst upp på sidan är det bra att skriva globala variabler
var tones = [];
var noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var octaves = [4,5];
var toneCnt = 0;
var tonesInOctave = 12;
var root = 0;
var scaleID = 0;
var selectedTones;
var playing;


var replay;

function setSelectedTones(){
	
	var targetIDs = scales[scaleID].tones;
	selectedIDs = [];
	targetIDs.forEach(function(num, id){
		selectedIDs.push((num + root) % tonesInOctave);
	});
	
	var selectedTones = [];
	tones.forEach(function(tone, id){
		
		var state = selectedIDs.includes(tone.noteNumber % tonesInOctave);
		if(state){
			selectedTones.push(id);
		}
		$("#tones input").eq(id).prop("checked", state).change();
		
	});
	setActiveVariations(selectedTones);
}

octaves.forEach(function(octave){
	noteNames.forEach(function(noteName, id){
		var keyColor = noteName.indexOf("#") == 1 ? "black" : "white";
		tones.push({label: noteName, noteNumber: octave*tonesInOctave+id, id: toneCnt++, keyColor: keyColor});
	});
});





var scales = [
	{label: "All", id: "all", tones: [0,1,2,3,4,5,6,7,8,9,10,11]},
	{label: "7-note", id: "major", tones: [0,2,4,5,7,9,11]},
	{label: "5-note", id: "penta-major", tones: [0,2,4,7,9]}
	
	/*
	{label: "Minor", id: "minor", tones: [0,2,3,5,7,8,10]},
	{label: "Pentatonic Minor", id: "penta-minor", tones: [0,3,5,7,10]},
	{label: "Blues", id: "blues", tones: [0,3,5,6,7,10]}
	*/
];




// denna rad säger att när dokumentet är färdigladdat ska funktionen "init" köras
$(window).on("load", init); 


function getActiveIDs(){
	
	var activeIDs = [];
	$("#tones input").each(function(id, elem){
		if($(elem).prop("checked")){
			activeIDs.push(id);
		}
	});
	
	return activeIDs;

}


function init(){
		
		
	location.href = "#startpage"; // välj vilken sida som ska visas när sidan laddas
	
	//$("#dialog").click(closeDialog);

	//$("#page1 #showdialog").click(showDialogWithText); // Så här kopplar man klick på ett element till en funktion
 
	var $target, name;
	
	$target = $("#tones");
	tones.forEach(function(tone){
		var name = "tone-" + tone.noteNumber;
		var $label = $("<label>", {for: name, class: tone.keyColor}).html(tone.label).appendTo($target);
		var $input = $("<input>", {type: "checkbox", "name": name, id: name})
			.html(tone.label)
			.appendTo($label)
			.checkboxradio()
			.click(function(event){
							
				if(playing){
					//event.preventDefault();
					//return true;
				} else {
					
				}
				setActiveVariations(getActiveIDs());
			}
		);
	});
	
	$target = $("#keyboard");
	tones.forEach(function(tone){
		var name = "tone-" + tone.noteNumber;
		var $input = $("<button>", {class: tone.keyColor})
			.html(tone.label)
			.appendTo($target)
			.button()
			.click(function(event){
				iMusic.play("note" + tone.noteNumber);
			}
		);
	});
	


	$target = $("#scales");
	name = "scale-selector";
	scales.forEach(function(scale, id){
		
		var idName = name+"-"+id;
		var $label = $("<label>", {for: idName})
			.html(scale.label)
			.appendTo($target);
		var $input = $("<input>", {type: "radio", name: name, id: idName})
			.html(scale.label)
			.appendTo($label)
			.checkboxradio()
			.click(function(){	
				scaleID = id;
				setSelectedTones();
				
			});
	});
	

	/*
	$target = $("#roots");
	name = "root-selector";
	noteNames.forEach(function(noteName, id){
		
		var idName = name+"-"+id;
		var $label = $("<label>", {for: idName})
			.html(noteName)
			.appendTo($target);
		var $input = $("<input>", {type: "radio", name: name, id: idName})
			.html(noteName)
			.appendTo($label)
			.checkboxradio()
			.click(function(){
				root = id;
				setSelectedTones();
		});
		if(!id){
			$input.trigger("click");
		}
	});
	*/
	
	$target = $("#controls");
	
	$("<button>").button({
		icon: "ui-icon-play"
	}).appendTo($target).click(function(){
		if(playing){
			$(this).removeClass("ui-state-active").button({icon: "ui-icon-play"});
			iMusic("A").stop();
			iMusic.setOffset(0);
		} else {
			$(this).addClass("ui-state-active").button({icon: "ui-icon-pause"});
			iMusic("A").play();
		}		
		playing = !playing;
	});
	
	
	
	
	// init music
	initMusic(tones, function(){
		
		location.href = "#startpage";
		$("#scales input").eq(2).trigger("click");
	});
	
	
	//scaleID = 2;
	//setSelectedTones();
	
	
	
	var valueSet;
	
	
	valueSet = new ValueSet("Tempo", 40, 20, 250, 4, function(val, dontUpdate){
		iMusic.set("tempo", val);
		if(!dontUpdate){
			updateTrack();
			callReplay();
		}
	}, true);
	valueSet.html.appendTo($target);
	
	
	valueSet = new ValueSet("Notes", 1, 1, 5, 1, function(val, dontUpdate){
		if(!dontUpdate){
			updateTrack(val);
			callReplay();
		}
	});
	valueSet.html.appendTo($target);
	
	valueSet = new ValueSet("Repeat", 1, 1, 5, 1, function(val, dontUpdate){
		iMusic("track1").set("repeat", val);
		if(!dontUpdate){
			callReplay();
		}
	});
	
	
	
	valueSet.html.appendTo($target);
	
	$("button, a").button();
	
	/*
	$states = $("<div>", {class: "output"}).appendTo($target);
	$position = $("<div>", {class: "output"}).appendTo($target);
	
	setInterval(function(){
		
		var states = [];
		iMusic("track1").objects[0].parts.forEach(function(part){
			states.push(part.counter);
		});
		$states.html(states);
		
		
		var pos = iMusic.getPosition();
		$position.html(pos.bar);
		
	}, 100);
	*/
	
	
	
	if(window.innerWidth > window.innerHeight && window.innerWidth > 1000){
		
		$("main").maxSize(1000, 562.5);
	} else {
		/*
		var blockTouch = function(evt){
			evt.preventDefault();
		}
		document.addEventListener("touchStart", blockTouch, false)
		document.addEventListener("touchMove", blockTouch, false)
		document.addEventListener("touchEnd", blockTouch, false) 
		*/
	}
	
}


function ValueSet(label, initVal, minVal, maxVal, step, fn, dontUpdate){
	
	this.value = initVal;
	this.minVal = minVal;
	this.maxVal = maxVal;
	
	var self = this;
	
	$container = $("<div>");
	$label = $("<span>", {class: "label"}).html(label + ":").appendTo($container);
	
	this.html = $container;
	this.output = $("<span>", {class: "output"}).html(initVal);

	$("<button>").html("-").appendTo($container).click(function(){
		self.value -=step;
		self.value = Math.max(self.value, self.minVal);
		self.output.html(self.value);
		fn(self.value);
	});
	this.output.appendTo($container);
	$("<button>").html("+").appendTo($container).click(function(){
		self.value +=step;
		self.value = Math.min(self.value, self.maxVal);
		self.output.html(self.value);
		fn(self.value);
	});
	
	fn(self.value, dontUpdate);
	
}


/* Här nedan passar det att skriva funktioner som körs när man t.ex. klickar på en knapp */

function closeDialog(){
	$("#dialog").hide();
}

function showDialogWithText(){
	
	$("#dialog").html("Så här visar man en dialog med text. Klicka på den för att stänga.");
	$("#dialog").show();
	
}


function callReplay(){
	
	
	if(!iMusic.isPlaying()){return}
	
	if(replay){clearTimeout(replay)}
	//iMusic.setOffset(-5);
	iMusic("A").stop();
	
	replay = setTimeout(function(){
		
		iMusic("A").play();
	}, 1500);

}


$.fn.nodoubletapzoom = function() {
    $(this).bind('touchstart', function preventZoom(e) {
        var t2 = e.timeStamp;
        var t1 = $(this).data('lastTouch') || t2;
        var dt = t2 - t1;
        var fingers = e.originalEvent.touches.length;
        $(this).data('lastTouch', t2);
        if (!dt || dt > 500 || fingers > 1) {
            return; // not double-tap
        }
        e.preventDefault(); // double tap - prevent the zoom
        // also synthesize click events we just swallowed up
        $(e.target).trigger('click');
    });
};
$('body').nodoubletapzoom();