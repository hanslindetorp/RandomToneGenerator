
iMusic.set("tempo", 180);
iMusic.set("timeSign", "1/4");
iMusic.set("audioPath", "audio");
iMusic.set("suffix", "mp3");
iMusic.set("partLength", "1/4");
iMusic.set("retrig", "repeat");
iMusic.set("quantize", "1/128");
iMusic.set("fadeTime", 0);


iMusic.debug = true;

var beat = 1;
var part = [];
var nrOfNotes;



iMusic.setInterval(function(){
	var bus = iMusic("track1").objects.pop().bus;
	var rnd = Math.random();
	//bus.filter.detune.setValueAtTime(-rnd*5000, 0);
	//bus.input.gain.setValueAtTime(1-rnd*0.3, 0);
	//console.log(bus.output.gain.value);
	
}, "1/4");


function initMusic(tones, callback){
	
	iMusic.set("onLoadComplete", callback);
	
	
	
	tones.forEach(function(tone){
		var fileName = tone.noteNumber.toString();
		
		// for looTracks
		part.push(fileName);
		
		// För Live keyboard:
		iMusic("A").addMotif(fileName).set("tags", "note"+fileName);
	});
	
	iMusic("A").addLoopTrack().set("tags", "track1").set("volume", 0.7);
		
}
function updateTrack(nrOfN){
	
		
	nrOfNotes = nrOfN || nrOfNotes || 1;
	var sequence = [];

	for(var i = 0; i < nrOfNotes; i++){
		sequence.push(part);
	}
	var loopEnd = (nrOfNotes*2+1) + ".1";
	iMusic("track1").update(sequence).set("loopEnd", loopEnd);
	
}

function setActiveVariations(selection){
	
	iMusic("track1").setActiveVariations(selection);
}