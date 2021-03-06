(function ($) {
	
	
	var defaultSectionName = "default";


	
	// ******************************************************
	// GUI  jQuery

	if($){



		$.fn.iMusGUI = function() {
	 
		    return this.each(function() {

		    	initGUI($(this));

		    });
		 
		};




	}




	function initGUI($target){

		if(!$target){ $target = $(body) }
		var instID = 1;

		iMus.instances.forEach(function(inst){

			var allTags = [];
			var allIDs = [];

			inst.sections.forEach(function(section){

				section.tags.forEach(function(tag){
						if(!inArray(tag, allTags) && tag.length){allTags.push(tag)}
				});

				section.idName.split(" ").forEach(function(idName){
					if(!inArray(idName, allIDs) && idName.length){allIDs.push(idName)}
				});

				section.tracks.forEach(function(track){

					
					track.tags.forEach(function(tag){
						if(!inArray(tag, allTags) && tag.length){allTags.push(tag)}
					});

					track.idName.split(" ").forEach(function(idName){
						if(!inArray(idName, allIDs) && idName.length){allIDs.push(idName)}
					});

				});

			});


			inst.motifs.forEach(function(motif){

				motif.tags.forEach(function(tag){
					if(!inArray(tag, allTags) && tag.length){allTags.push(tag)}
				});

				motif.idName.split(" ").forEach(function(idName){
					if(!inArray(idName, allIDs) && idName.length){allIDs.push(idName)}
				});
			});



			
			// instance container
			var $title = $("<h2>").html("Music " + instID);
			
			var $instanceMixer = $("<div>", {class: "mixerInstance", id: "mixerInstance-" + instID}).append($title);
			var $groups = $("<div>", {class: "mixerGroups"});
			var $singles = $("<div>", {class: "mixerSingles"});
			$instanceMixer.append($groups, $singles);
			$target.append($instanceMixer);



			allTags.forEach(function(tag){
				var $channel = new ChannelStrip(inst, ".", tag);
				$groups.append($channel);
			});

			allIDs.forEach(function(idName){
				var $channel = new ChannelStrip(inst, "#", idName);
				$singles.append($channel);
			});

			var height  = $singles.offset().top + $singles.innerHeight();
			$target.innerHeight(height);

			instID++;

		});

	}


	function ChannelStrip(inst, prefix, str){

		$label = $("<span>", {class: "label"}).html(prefix + str);
		$gui = $("<div>", {class: "channelstrip"});
		$slider = $("<div>");
		$slider.append($label);
		$playBtn = $("<button>", {class: "playBtn"}).css({backgroundColor: "white"}).html(">");
		$gui.append($slider, $playBtn);


		if($.ui){

			var curVolume = inst.find(prefix + str).getVolume();
			curVolume = curVolume == -1 ? 1 : curVolume;
			curVolume = Math.floor(curVolume*100)/100;

			$slider.slider({
			      value: curVolume * 100,
			      min: 0,
			      max: 200,
			      orientation: 'vertical',
			      slide: function( event, ui ) {
			      	var val = ui.value/100;
			        $(this).find(".ui-slider-handle").html(val);
			        $(this).data("changed", true);

			        inst.find(prefix + str).setVolume(val);
			      },
			      change: function( event, ui) {
			      	//$(this).find(".ui-slider-handle").html(ui.value/100);
			      	//$("#mixer > div").css({backgroundColor: "white"});
			      	//$(this.parentNode.parentNode).css({backgroundColor: "#aaffaa"});
			      }
		    }).data("selector", prefix + str).dblclick(function(){
		    	$(this).slider('value', 100);
		    	$(this).find(".ui-slider-handle").html(1);
		    	inst.find(prefix + str).setVolume(1);
		    }).find(".ui-slider-handle").html(curVolume);

		}


		
		$playBtn.click(function(){

			var state = $(this).data("state") ? false : true;
			$(this).data("state", state);
			var color = state ? "green" : "white";
			$(this).css({backgroundColor: color});

			var targets = inst.find(prefix + str);

			if(state){
				targets.play();
			} else {
				targets.stop();
			}
	        

		});


	    return $gui;

	}








	// ******************************************************
	// HELPERS
	
			
	function getTimeSign(ts, defTimeSign){
		
		if(ts == "off"){return ts}
		
		var timeSign = {};
		
		
		// convert string to an object
		if(typeof ts === "string"){
			
			switch(ts){
				
				
				case "bar":
				return {nominator: defTimeSign.nominator, denominator: defTimeSign.denominator};
				break;
				
				
				case "beat":
				return {nominator: 1, denominator: defTimeSign.denominator};
				break;
				
				default:
				
				tsArr = ts.split("/");
				if(tsArr.length == 2){				
					return {nominator: eval(tsArr[0]), denominator: eval(tsArr[1])};
				}
				break;
			}
		
		}
		
		// if timeSign is already converted to an object
		if(typeof ts === "object"){
			if(ts.nominator && ts.denominator) {
				return ts;
			}
		}
		
		// return 4/4 if not specified
		return {nominator:4, denominator:4};
		
	}
	
	function stringIsTimeSign(str){
		return str.split("/").length == 2;
	}
	
	
	function divisionToTime(div, ts, beatDuration){
		
		if(!div){return 0;}
		ts = ts ||??this.parameters.timeSign;
		beatDuration = beatDuration || this.getBeatDuration();
		var div = getTimeSign(div, ts);
		return div.nominator * beatDuration * ts.denominator / div.denominator;
	}
	
	
	function getMaxUpbeatOffset(tracks){
		tracks = tracks || this.tracks;
		var offs = 0;
		for(var trackID in tracks){
			var track = tracks[trackID];
			if(track.parts.length){
				var parts = track.parts;
				var firstPart = parts[0];
				offs = Math.min(offs, firstPart.offset);
			}
			
		}	
		return -offs;
	}
	
	
	function getMaxFadeTime(tracks){
		tracks = tracks || this.tracks;
		
		var time = 0;
		
		tracks.forEach(function(track){
			time = Math.max(time, track.parameters.fadeTime);
		});
			
		return time;
	}
	
	

	
	function arrayWithValue(length, value){
		
		var arr = [];
		for(var i=0; i<length; i++){
			arr[i] = value;
		}	
		return arr;
	}
	
	
	function createGainNode(){
		// different methods to support different browsers
		if(typeof audioContext.createGain === 'undefined'){
			return audioContext.createGainNode();
		}else{
			return audioContext.createGain();
		}
	}
	
	
	function initAudioContextTimer(iMusInstance){
		//console.log("initAudioContextTimer", iMusInstance);
		if(audioContext.currentTime == 0){
			
			// on iOS the timer needs to be inited
			// by triggering a sound from a touch interaction
			// Therefore, make sure you call section::play() from 
			// a touch event the first time or
			// make a direct call to iMusInstance::init() from 
			// a touch event before playing anything.
			
			var osc = audioContext.createOscillator();
			// play
			if (typeof osc.start === 'undefined'){
				osc.noteOn(0);
			}else{
				osc.start(0);
	 		}
	 		
	 		//osc.connect(audioContext.destination);
	 					
		}	
		
			
	}
	
	
	
	
	
	function addLFO(prop, frequency, range, offset, object){
	
		if(typeof prop != "string"){return}
		
		
			
			var bus;
			
			if(typeof object === "undefined"){
			var musicObject = this instanceof Section || this instanceof Track ||??this instanceof Motif ||??this instanceof Sequence;
			if(musicObject){
				bus = this.bus;
			} else if(this instanceof Bus){
				bus = this;
			}
			
			if(bus){
				switch(prop){
					case "filter":
					object = bus.filter.detune;
					break;
					
					case "volume":
					object = bus.output.gain;
					break;
				}
			}
		} else {
			object = object;
		}
	
		if(typeof object != "object"){return}
		
		frequency = frequency ||??1;
		range = range || 1;
		offset = offset || 0;
		
		var osc = audioContext.createOscillator();
		var amp = createGain();
		amp.gain.value = range;
		
		osc.frequency.value = frequency;
		osc.connect(amp);
		amp.connect(object);
		osc.start();
		
		/*
		var x = 0;
		var y;
		var range = max - min;
		
		var intervalTime = 10;
		var stepAmount = 2 / cycleTime * intervalTime;
		
		var intervalID = setInterval(function(){
			
			x += stepAmount;
			y = Math.sin(Math.PI*x)/2+0.5;
			
			object[prop] = min + y * range;
			
		}, intervalTime);
	
		*/
	}
	
	


	// ******************************************************
	
	// setup the audio context
	var audioContext;
	var maxChannelCount;
	
	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	
	
	if (AudioContext) {
		// Web Audio API is available.
		audioContext = new AudioContext();		
		
		maxChannelCount = audioContext.destination.maxChannelCount || 2;
		maxChannelCount = Math.min(maxChannelCount, 32);
  
		console.log("Max audio channels: " + maxChannelCount);
		
		if (audioContext.destination.maxChannelCount) {
			audioContext.destination.channelCount = maxChannelCount;
		}
		
		else if (audioContext.destination.webkitMaxChannelCount) {
			audioContext.destination.webkitChannelCount = maxChannelCount;
		}
		
			
		//audioContext.destination.channelCountMode = "explicit";
		//audioContext.destination.channelInterpretation = "discrete";
		
		
		var channelCount = audioContext.destination.channelCount || audioContext.destination.webkitChannelCount;
		console.log("Number of channels: " + channelCount);
		
		
	
	} else {
	  // Web Audio API is not available. Ask the user to use a supported browser.
	  alert('Web Audio API not supported. Please use another browser');
	  return;
	}
	
	
  
	var buffers = {};
	var timeWindow = 0.1; // s
	var checkQueueTime = 50; // ms
	
	
	
	
	function playSound(obj, time, callBackOnStart, callBackOnFinish, track) {
		
		// console.log(audioContext.currentTime);
		// check if source is already played
		// if so, disconnect
		time = time ||??0;
		time = Math.max(audioContext.currentTime, time);
		//console.log(time);
		
		// randomize if several urls
		var url;
		
		if(typeof obj.url === "object"){
		
			// support array with multiple files for random selection
				
				
			// if activeVariations is used, then use just those files, else use all
			var nrOfOptions;
			
			if(obj.parameters.retrig == "repeat" && (obj.counter % obj.parameters.repeat)) {
				
				// keep on repeating the same file obj.parameters.repeat times
				if(iMus.debug){console.log(obj.counter, obj.parameters.repeat)}
				
			} else {
			
				// generate a new randomly selected file
				if(obj.parameters.activeVariations){
					nrOfOptions = obj.parameters.activeVariations.length;
				} else if(obj.parameters.retrig == "next"){
					nrOfOptions = 0;
						
				} else {
					// default obj.parameters.retrig == "other". Add maybe support for "any"
					
					// use all urls first time or if there are less than 3 options or if obj.variation is used
					nrOfOptions = (typeof obj.rndID === "undefined" || obj.url.length < 3 || obj.parameters.retrig == "shuffle") ? obj.url.length : obj.url.length - 1;			
				}
				
				var rnd;
				
				if(typeof obj.variation == "number"){
					// obj.variation can be set globally to syncronize random variation between objects
					// change to use parameters!!!
					rnd = obj.variation;
					rnd = Math.max(0,rnd);
					rnd = Math.min(0.9999999999,rnd);
				} else if(typeof obj.variation == "string"){
					if(obj.variationMaster == true){
						rnd = Math.random();
						iMus.setVariation(obj.variation, rnd);
					} else {
						rnd = iMus.getVariation(obj.variation);
					}
				} else {
					// create a new random value
					rnd = Math.random();
				}
				obj.rndID = Math.floor(rnd*nrOfOptions);	
				
				
			}
			
			// pick file	
			
			if(obj.parameters.activeVariations){
				// pick ID from active IDs
				url = obj.url[obj.parameters.activeVariations[obj.rndID]];
				if(!url){url = obj.url[0];}
				
			} else {
				url = obj.url[obj.rndID];
			}
			
			
			
			
		} else {
			url = obj.url;
		}
		

		var length = obj.length;
		var urlObj = url;
		
		if(typeof urlObj === "object"){
			// support objects with unique values for each url i.e. different musical length
			
			url = urlObj.url;
			length = urlObj.length ||??length;
		}
		
		
		
	 	var msToStart = Math.floor((time-audioContext.currentTime)*1000);
	 	var msToFinish = 0;
	 		
		if(buffers[url]){
		
			// create new source if file is loaded
			var source = audioContext.createBufferSource();
			
			obj.playingSources = obj.playingSources || [];
			
			// connect
			source.buffer = buffers[url]; 
			
			var destination = obj.bus.input || iMus.master.input;
			source.connect(destination);
			
			
			// play
	 		
	 		obj.playing = true;
	 		obj.trigging = true;
	 		obj.playingSources.push(source);
	 		
	 		if(typeof obj.active === "undefined"){
	 			obj.active = 1;
	 		}
	 		
	 		
	 		
	 		msToFinish = msToStart + Math.floor(source.buffer.duration*1000);
	 		
	 		
	 		var rnd = Math.random();
	 		if(rnd < obj.active || obj.parameters.fadeTime){
		 		
		 		// play
				if (typeof source.start === 'undefined'){
					source.noteOn(time);
				}else{
					source.start(time);
		 		}
		 		
		 		obj.counter = ++obj.counter || 1;
		 		if(iMus.debug){console.log(url);}
		 		
		 		
		 		if(track){
			 		setTimeout(function(){
				 		track.eventHandler.execute("playFile", url);
			 		}, msToStart);
		 		}


			 	
		 		// call function if set when a sound is about to play
		 		// bad sync with JS
		 		if(typeof callBackOnStart === "function"){
		 			setTimeout(function(){
			 			callBackOnStart("playFile", url);
		 			}, msToStart);
		 		}
		 		
		 		
	 		} else {
		 		
		 		// don't play
		 		if(iMus.debug){console.log("Not playing: " + url + ", Math.random = " + rnd);}
		 		
	 		}
	 		
	 		// reset playing to allow object to be trigged again
	 		setTimeout(function(){
	 			obj.trigging = false;
	 			//console.log(obj.url, obj.playing, timeWindow * 1000 + msToStart);
	 		}, timeWindow * 2 * 1000);
	 		
	 		
	 		
	 		
	 		if(typeof length === "number"){
	 		
	 			// if a Part or Motif has a defined length then make callback before tail
	 			setTimeout(function(){
	 				if(typeof callBackOnFinish === "function"){callBackOnFinish();}
	 				obj.playing = false;
	 			
	 			}, msToStart + length * 1000 - timeWindow * 1000);
	 		}
	 		
	 		
	 		// disconnect and delete source object when played
	 		setTimeout(function(){
	 			obj.playing = false; // denna rad var bortkommenterad men jag kan inte komma p?? varf??r
	 			//if(source){source.disconnect(0);}
	 			if(obj.playingSources) {
		 			if(obj.playingSources.length){
		 				var oldSource = obj.playingSources.shift();
/*
		 				oldSource.disconnect(0);
		 				oldSource = 0;
*/
		 			}
	 			}
	 			
	 			source = null;
	 			if(typeof callBackOnFinish === "function" && typeof length === "undefined"){
	 				callBackOnFinish();
	 			} else {
		 			
	 			}
	 			//console.log(obj.url + ".stop() " + audioContext.currentTime);
	 		}, msToFinish);	
	 		if(iMus.debug){console.log("msToFinish: " + msToFinish);}
 		
 		} else {
	 		if(iMus.debug){console.log("Buffer not found: " + url);}
 		}
 		
 		return urlObj;
	}
	
	
	
	function loadFile(obj, callBack){
		
		callBack = callBack ||??loadComplete;
		var url = this.addSuffix(obj.url);
		
		if(typeof url != "string"){
			
			// this is not a file
			return;
		}

		
		if(obj.url in buffers){
			// if already loaded
					
		} else {
			// else load URL
			buffers[obj.url] = 0;
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.responseType = 'arraybuffer';
			
			var returnObj = {};
			returnObj.url = url;
			
			request.onload = function() {
		        // decode the buffer into an audio source
		        audioContext.decodeAudioData(request.response, function(buffer) {
		          if (buffer) {
		          	// store all buffers in buffers
		            buffers[obj.url] = buffer;
		            returnObj.duration = buffer.duration;
		            // store reference in this object
		            // obj.buffer = buffer;
		            //console.log(obj.url + " loaded. offset: " + obj.offset);
		            callBack(returnObj);
		            
		          }
		        }, function(){
		        	console.error('File "' + url + '" could not be decoded');
		        	buffers[obj.url] = -1;
		        	callBack();
		        });
		     };
		     request.onerror = function() {
		          console.error('File "' + url + '" could not be loaded');
		          buffers[obj.url] = -1;
		          callBack();
		     };
	
			request.send();
		}
	}
	
	function loadComplete(){

		
		for(var url in buffers){
			
			if(buffers[url] == 0){
				return false;
			}	
		}
		
		console.log("LoadComplete");
		for(var obj in iMus.instances){
			
			iMus.instances[obj].loadComplete();
		}
		return true;
	}
	
		
	var Bus = function(o){
		
		
		o = o ||??{};
		
		this.parameters = this.initParameters(o);
		
		this.splitter = audioContext.createChannelSplitter();
		//this.splitter.channelCount = 1; Not allowed
		this.splitter.channelCountMode = "explicit";
		this.splitter.channelInterpretation = "discrete";


		var destination = o.destination || audioContext.destination;

		this.output = createGainNode();
		this.output.gain.value = (typeof o.volume == "number") ? o.volume :??1;
		this.output.connect(destination);

		this.compressor = audioContext.createDynamicsCompressor();
		this.compressor.connect(this.output);
		this.compressor.ratio.value = 1;

		
		this.panner = audioContext.createPanner();
		this.panner.setPosition(0,0,0);
		this.panner.connect(this.output);
		
		this.filter = audioContext.createBiquadFilter();
		this.filter.frequency.value = 20000;
		this.filter.connect(this.output);

		this.inserts = [];
		this.inserts.push(this.filter);
		
	    this.input = createGainNode();
		this.input.connect(this.filter);
		this.sends = {};
		
		this.channelMerger = o.channelMerger || self.channelMerger;
		
		
		return this;
	}
	
	
	Bus.prototype.initParameters = initParameters;
	Bus.prototype.addDefaultParameters = addDefaultParameters;
	Bus.prototype.getBeatDuration = getBeatDuration;
	Bus.prototype.getBarDuration = getBarDuration;
	Bus.prototype.getTime = getTime;
	
	
	Bus.prototype.setOutput = function(ch, targetCh){

		this.output.disconnect(0);
		this.splitter.disconnect(0);
		this.output.connect(this.splitter, 0, 0);
		this.outputGainList = [];
		
		
		if(typeof ch === "number"){
			ch = [ch]
		};
			
		if(targetCh){
			
			// source and target specified
			if(typeof targetCh === "number"){targetCh = [targetCh]};
			
		} else {
			
			// only target specified
			targetCh = ch;
			ch = [];
			for(var i = 0; i < this.output.channelCount; i++){
				ch.push(i);
			}
		}
		
			
		var lpCnt = Math.max(ch.length, targetCh.length);
		for(var i = 0; i < lpCnt; i++){
			
			var srcCh = ch[i % ch.length];
			srcCh = Math.min(srcCh, maxChannelCount-1);
			
			var trgCh = targetCh[i % targetCh.length];
			trgCh = Math.min(trgCh, maxChannelCount-1);
			
			var outputGain = createGainNode();
			this.outputGainList[trgCh] = outputGain;
			this.splitter.connect(outputGain, srcCh, 0);
			outputGain.connect(this.channelMerger, 0, trgCh);
			
		}
			

	}
	
	

	Bus.prototype.volume = function(vol){
		if(typeof vol == "undefined"){return this.output.gain.value;}
		else{this.output.gain.value = vol;}
	}
	Bus.prototype.setVolume = Bus.prototype.volume;


	Bus.prototype.compression = function(params){
		if(typeof params == "undefined"){
			return this.compressor;
		} else {

			
			if(params == false){
				// disconnect

			} else {

				for(var param in params){
					this.compressor[param].value = params[param];
				}
			}
		}
	}
	
	Bus.prototype.animate = function(parameter, targetVal, time){
		
		
		time = time ||??0;
		switch(parameter){
			
			case "pan":
			
			if(!this.outputGainList){
				// default to stereo if not routed yet
				if(this.channelMerger){
					this.setOutput([0,1], [0,1]);
				}
			}
						
			
			targetVal*=0.9999999;
			var dist = targetVal - this.parameters.pan;
			var nrOfOutputs = this.outputGainList.length;
			
			// step through animation with 50 states per second
			var fps = 50;
			
			// at least two steps if time is too short
			var steps = Math.max(2, time * fps);
			
			for(var i = 0; i <= steps; i++){
				
				var curVal = this.parameters.pan + dist * i/steps;
				
				var targetOutput1 = Math.floor((nrOfOutputs-1)*curVal);			
				
				var modVal = 1 / (nrOfOutputs-1);
				var offs = (curVal % modVal) / modVal;
				
				
				var t = audioContext.currentTime + time * i/steps;
				
				// Loop through all speakers for each step
				this.outputGainList.forEach(function(output, id){
					var val;
					switch(id){
						case targetOutput1:
						val = 1 - offs;
						break;
						
						case targetOutput1+1:
						val = offs;
						break;
						
						default:
						val = 0;
						break;
					}
					output.gain.linearRampToValueAtTime(val, t);					
				});
			}
			this.parameters.pan = targetVal;
			break;
			
			
		}
		
	}
	
	Bus.prototype.addPingPongDelay = function(params){
		
		params = params || {};
		var feedBack = params.feedBack ||??10;                    // nr of bounces
		
		var delay; // time between bounces
		if(typeof params.delay === "string"){
			delay = this.getTime(params.delay);
		} else {
			delay = params.delay ? params.delay / 1000 : 0.25;
		}
		
		var outputs = params.outputs || [0,1];                   // array with output numbers
		var volume = params.volume || 0.5;                       // volume for first delay
		
		var delayObj;
		var gainObj;
		
		this.pingPongDelay = createGainNode();
		
		// signal is routed in a parallell chain
		this.output.connect(this.pingPongDelay, 0, 0);
		
		// create one delay node for each feedback
		for(var i=1; i<=feedBack; i++){
			
			delayObj = audioContext.createDelay(feedBack*delay);
			this.pingPongDelay.connect(delayObj, 0);
			delayObj.delayTime.value = delay*i;
			gainObj = createGainNode();
			gainObj.gain.value = volume;
			volume *= 0.5;
			gainObj.channelCount = 1;
			gainObj.channelCountMode = "explicit";
			gainObj.channelInterpretation = "discrete";
			delayObj.connect(gainObj, 0, 0);
			
			// get random output channel (exclude last to avoid repeated bounces in the same)
			var id = Math.floor(Math.random()*outputs.length-1);
			var chNum = outputs.splice(id, 1)[0];
			outputs.push(chNum);
			
			gainObj.connect(this.channelMerger, 0, chNum);
			

		}
		
	}
	
	Bus.prototype.addSerialDelay = function(params){
		
		params = params || {};
		var feedBack = params.feedBack ||??10;                    // nr of bounces
		
		var delay; // time between bounces
		if(typeof params.delay === "string"){
			delay = this.getTime(params.delay);
		} else {
			delay = params.delay ? params.delay / 1000 : 0.25;
		}
		
		var outputs = params.outputs || [0,1];                   // array with output numbers
		var volume = params.volume || 0.5;                       // volume for first delay
		
		var delayObj;
		var gainObj;
		
		this.pingPongDelay = createGainNode();
		
		// signal is routed in a parallell chain
		this.output.connect(this.pingPongDelay, 0, 0);
		
		// create one delay node for each feedback
		for(var i=1; i<=feedBack; i++){
			
			delayObj = audioContext.createDelay(feedBack*delay);
			this.pingPongDelay.connect(delayObj, 0);
			delayObj.delayTime.value = delay*i;
			gainObj = createGainNode();
			gainObj.gain.value = volume;
			volume *= 0.5;
			gainObj.channelCount = 1;
			gainObj.channelCountMode = "explicit";
			gainObj.channelInterpretation = "discrete";
			delayObj.connect(gainObj, 0, 0);
			
			var chNum = outputs[i % outputs.length];
			chNum = Math.min(chNum, maxChannelCount-1);
			gainObj.connect(this.channelMerger, 0, chNum);
			

		}
		
	}
	
	Bus.prototype.addReverb = function(params){
		
		if(!params){return}
		if(typeof params === "string"){
			params = {url: params}
		}
		
		if(!params.url){return}
		
		if(typeof params.value === "undefined"){params.value = 1}
		
		var send = this.sends[params.url];
		if(!send){
			send = createGainNode();
			this.sends[params.url] = send;
		}
		send.gain.value = params.value;
		this.output.connect(send);
		 
		params.src = send;
		var sendEffects = defaultInstance.addReverb(params);
	}
	
	
	Bus.prototype.insertEffect = function(type, initParams){
		
		var newFX = audioContext.createBiquadFilter();
		
		// last added FX will be first in inserts array
		var lastFXinChain = this.inserts[0];
		
		// disconnect last FX in chain
		lastFXinChain.disconnect(0);
		
		
		
		this.inserts.shift(newFX);
		
	}

	Bus.prototype.setPosition = function(newX, newY, newZ){
		
		if(!this.panner.active){
			this.filter.disconnect(0);
			this.filter.connect(this.panner);
			this.panner.active = true;
		}
		
		this.panner.setPosition(newX, newY, newZ);
		//audioContext.listener.setPosition(-newX, -newY, -newZ);
	}


	Bus.prototype.addAnalyser = function(fn, interval, fftSize){
		
		interval = interval || 100;
		var analyser = audioContext.createAnalyser();
		this.input.connect(analyser);
		analyser.fftSize = fftSize || 2048;
		var bufferLength = analyser.frequencyBinCount;
		
		var dataArray = new Uint8Array(bufferLength);
		//var dataArray = new Float32Array(bufferLength);
		
		
		setInterval(function(){
		
			//analyser.getFloatTimeDomainData(dataArray)
			analyser.getByteTimeDomainData(dataArray);	
			fn(dataArray, bufferLength);
			
		}, interval);
		
		
	}



	var Sequence = function(data){
		
		this.iMusInstance = data.iMusInstance;
		this.objects = data.objects ||??[];
		this.firstOffset = data.firstOffset || 0;
		this.loopEnd = data.loopEnd;
		this.timerIDs = [];
		
	}

	
	Sequence.prototype.maxUpbeatOffset = function(){
		
	}
	
	Sequence.prototype.play = function(){
		
		var me = this;
		var delay = 1000;
		var runEachLoop = function(){
			
		}
		
		this.timerIDs.push(setTimeout(function(){
			
			//me.timerIDs.push(); VAd ??r detta?
			
		}, delay));
		
	}
	
	
	/*
	Sequence.prototype.stop = function(){
		
		this.timerIDs.forEach() = function(timerID){
			clearTimeout(timerID);
		}
		this.timerIDs = [];
	}
	*/
	

	/*
	*/
	
	var iMus = function(o, b) {
		
		var self = this;
		o = o || {};

		
		if(typeof o === "string" || Array.isArray(o)){
			
			// Selection
			return new Selection(o, b);
		} else {
			
			
			o.onLoadComplete = o.onLoadComplete || b;
		}
		


		// Music instance
		this.loadFile = loadFile;
		
		
		this.init = function(){
			initAudioContextTimer(this);
		}
		
		this.getBus = function(id){
			
			switch(id){
				
				case "sfx":
				return this.sfxBus;
				break;
				
				case "motif":
				return this.motifBus;
				break;
				
				default:
				if(id <= self.busses.length){
					return self.busses[id-1];
				}else{
					this.parameters.destination = this.master.input;
					this.parameters.channelMerger = this.channelMerger;
					var bus = new Bus(this.parameters);
					self.busses[id] = bus;
					return bus;
				}
				break;
			}
		}
		
		this.addSection = function(){
			
			
			var params;

			if(arguments.length){				
				var args = Array.prototype.slice.call(arguments, 0);
				if(typeof args[0] === "object"){
				
					// if first value is a Section params object
					if(!args[0].url){
						params = args.shift();
					}
				}	
				
			}		
			params = params || {};
			params.urls = params.urls || args;
			
			
			if(typeof params.upbeat === "undefined"){params.upbeat = self.upbeat;}
			
			params.index = self.sections.length;
			var newSection = new Section(params);
			self.sections.push(newSection);
			return newSection;		
		}
		
		
				
		
		this.stop = function(){
			clearInterval(self.queueID);
			self.queueID = null;
			self.playing = false;
			/*self.currentSection;
			self.currentTransition;
			self.transitionParts = [];*/
		}
		
		self.loadComplete = function(){
			switch(typeof self.parameters.onLoadComplete){
				
				case "function":
				self.parameters.onLoadComplete()
				break;
				
				case "string":
				iMus.play(self.parameters.onLoadComplete);
				break;
			}
			
			iMus.onload();
		}
		
		/*
		
		this.getBeatDuration = function(){
			return 60.0 / this.tempo;
		}
		
		this.getBarDuration = function(){
			return this.getBeatDuration() * this.timeSign.nominator;
		}
		
		
		
		if (typeof o === 'function') {
		  callback = o;
		}
		
		*/
		
  
		// a collection of Sections, Transitions, Motifs and SFXs
		
		params = o || {};
		this.parameters = this.initParameters(o);

		self.volume = params.volume ||??1;
		self.parameters.tempo = params.tempo || 120;
		self.parameters.timeSign = params.timeSign ||??"4/4";
		self.parameters.timeSign = getTimeSign(self.parameters.timeSign);
		
		self.upbeat = typeof params.upbeat === "string" ? this.getTime(params.upbeat) :??params.upbeat;
		self.upbeat = self.upbeat || 0;
		
		self.externalOffset = params.offset;
		self.creationTime = new Date().getTime();

		
		// Styr upp denna h??rva av self och self.parameters...
		self.parameters = this.initParameters(params);
		self.parameters.onLoadComplete = params.onLoadComplete; // varf??r kopieras inte denna funktion i initParameters??
		self.parameters.destination = iMus.master.output;
		self.parameters.volume = self.volume;
		
		
		self.master = new Bus(this.parameters);
		self.bus = self.master;
			
		self.master.output.channelCount = maxChannelCount;
		
		// Create a Bus for mono sounds to be routed to a specific output channel
		self.channelMerger = audioContext.createChannelMerger(Math.max(32, maxChannelCount));
		self.channelMerger.channelCount = 1;
		self.channelMerger.channelCountMode = "explicit";
		self.channelMerger.channelInterpretation = "discrete";
		self.channelMerger.connect(self.master.output); //self.master.input);
		
		self.sendEffects = {};
		
		// Activate all inputs by creating dumb source objects and
		// preconnecting them to channelMerger
		
		for(var i=0; i<maxChannelCount; i++){
			var snd = audioContext.createBufferSource();
			snd.connect(self.channelMerger, 0, i);
		}
		
		
		
		//self.currentBarIDs = [];                // counters
		//self.nextTime = 0;
		
		self.transitionParts = [];		
		self.sections = [];
		self.actions = [];
		self.currentSection;
		self.currentTransition;
		self.playing = false;
		self.sectionStart = 0;
		self.musicalStart = 0;
		
		self.motifs = [];
		self.busses = [];
		self.intervalIDs = [];
		
		this.parameters.destination = self.master.input;
		this.parameters.channelMerger = self.channelMerger;
			
		self.sfxBus = new Bus(this.parameters);
		self.motifBus = new Bus(this.parameters);
		

		
		iMus.instances.push(this);
		
		










		
		this.checkQueue = function(){
			
			if(!self.playing){return;}
			
			// queue transition parts

			/*
			// transistion currently blocked
			var tracks = self.transitionTracks;
			
			if(tracks) {
				
				var transitionPartsToQueue = 0;
				for(trackID in tracks){		
					var track = tracks[trackID];
					if(track.parts.length){
						transitionPartsToQueue += track.parts.length;
						var nt = queueNextPartOnTrack(track, 0);
						
						if(typeof nt !== "undefined"){
							track.parts.shift();
							track.nextTime = nt;
						}
					}
				}
				// just queue transition parts as long as there are some to queue
				if(!transitionPartsToQueue){
					// transition done
					self.transitionTracks = null;
					
					// transfer nextTime values from track1 in transition
					var track1 = tracks[0];
					if(self.currentSection){
						tracks = self.currentSection.tracks;
						for(trackID in tracks){
							var track = tracks[trackID];
							track.nextTime = track1.nextTime;
						}
					}
					
				}
				return;
				
				
			}
			*/


			
			var currentTime = audioContext.currentTime;
			var musicTime = currentTime - self.sectionStart;
			self.musicTime = musicTime; // store the current music position pointer
			//if(musicTime < -timeWindow){return;} // what is this? It messed up the upbeats...
			
			// que parts on tracks in sections
			if(self.currentSection){
				tracks = self.currentSection.tracks;
				
				for(trackID in tracks){		
					var track = tracks[trackID];
					var newLoop = false;
					
					//var trackTime = track.getTime(musicTime);
					var loopEnd = track.musicalPositionToTime(track.parameters.loopEnd);
					var loopID = Math.floor(musicTime / loopEnd);
					var loopStart = loopID * loopEnd;
					var timeInLoop = (musicTime + loopEnd*1000) % loopEnd;
					
					//mt = [musicTime, timeInLoop]; just for bug fix
					
					
					if(loopID != track.loopID){
						
						// On every loop
						if(!track.active && track.parameters.fadeTime){
							// set volume to 0 if not active but in fade mode
							// to play silently until track recieves a play() command
							//track.bus.setVolume(0, true); -- already controlled by newTrack.setVolume()
						}
						
						// control the likeness for this loop to play
						var rnd = Math.random();
						track.playing = track.loopActive > rnd;
						track.loopID = loopID;
						//console.log("LoopActive: " + track.loopActive + " > " + rnd);
						newLoop = true;
						
						setTimeout(function(){
							track.eventHandler.execute("loopEnd");
						}, loopEnd*1000);
					}
					
					// track.active is the parameter set by Track.setActive(), Track.play() and Track.stop()
					// track.playing is set on each trackloop depending on loopActive and random()
					// track.parameters.fadeTime is set to a value bigger than 0 if the track is supposed to 
					// fade in/out on play/stop (like Ableton, Elias etc) rather than playing full audio files with audio tails
					
					if((track.active > 0 && track.playing && !track.parameters.fadeTime) || track.parameters.fadeTime){
						
						//(track.parameters.fadeTime && (newLoop ||??musicTime < loopStart)
						// get local time inside this stem/track loop
						
						
			
						
						for(partID in track.parts){
							
							var targetPart = track.parts[partID];
							
							
							if(!(targetPart.playing || targetPart.trigging)){
								
								
							
								
								// store randomness from track in part
								targetPart.active = track.active;
								
								// store tracks fadeTime in part
								targetPart.parameters.fadeTime = track.parameters.fadeTime;
								
								var posInLoop = (targetPart.pos + targetPart.offset + loopEnd) % loopEnd;
								var posInNextLoop = posInLoop + loopEnd;
								var hit = timeInLoop <= posInLoop && (timeInLoop + timeWindow) > posInLoop;
								
								// check if loop is before bar 1 and part has not got upbeat
								//var partShouldNotPlay;// = (loopID < 0 && targetPart.offset >= 0) || loopID < -1;
								
								var hitInNextLoop = timeInLoop <= posInNextLoop && (timeInLoop + timeWindow) > posInNextLoop;
								var fadeTrackNeedsTrigging = track.parameters.fadeTime && !track.playing;
												
																
								if((hit || hitInNextLoop || fadeTrackNeedsTrigging) && loopID >= -1){

									
									// if targetPart is within timeWindow
									//var time = self.sectionStart + relPos; //+relPos;
									var time = self.sectionStart + loopStart + posInLoop + (hitInNextLoop ? loopEnd : 0);
									
									// make sure faded tracks are triggered correctly
									if(track.parameters.fadeTime){
										
										while(time < currentTime){
											time += loopEnd;
										}
										
									}
									
									
									if(time < currentTime){
										
										// to prevent trig errors (I encountered logical problems with faded tracks)
										//console.log("Negative time: " + time);
									} else {
										//console.log(loopID);
										track.playingParts.push(targetPart);
										if(targetPart.lastTriggedTime != time){
											targetPart.lastTriggedTime = time;
											targetPart.parameters.retrig = track.parameters.retrig;
											
											var chosenURL = playSound(targetPart, time, null, null, track);

											
											var spliceID;
											switch(track.parameters.retrig){
												
												case "next":
												case "other":
												case "shuffle":
												case "repeat":
												
												// det h??r m??ste fixas! OBS! Inte genomt??nkt f??r alla case
												// fixen f??r activeVariations ??r gjort f??r att RTG inte ska g?? ??t pipan
												// Dumt att playSound returnerar chosenURL
												
												if(targetPart.parameters.activeVariations){
													
													if(targetPart.counter % targetPart.parameters.repeat){
														// don't shuffle
													} else {
														var ID = targetPart.parameters.activeVariations.splice(targetPart.rndID, 1)[0];
														targetPart.parameters.activeVariations.push(ID);
													}
													
													
												} else {
													
													var i = targetPart.url.indexOf(chosenURL);
													// pick target URL
													chosenURL = targetPart.url.splice(i, 1)[0];
													// move selected file last
													targetPart.url.push(chosenURL);
												}
												break;
											
												
											}
											
											
										}
										
									}
								
								} else {
									
									//console.log(timeInLoop, posInLoop)
								}
							}
							
						}
						
					}
				}
			}
		}
		
		
		
		
		function queueNextPartOnTrack(track, currentPart){
			var currentTime = audioContext.currentTime;
			var targetPart = track.parts[currentPart % track.parts.length];
			var nt;
			if(track.id < self.busses.length){var bus = self.busses[track.id];}
			
			
			if(track.id == 1){
				//console.log("track2");
			}
			if(currentTime + timeWindow >= track.nextTime + targetPart.offset){
				
				// trig next part if start (inkl offset/upbeat) happens less than timeWindow seconds
				// from now.
				
				var time;
				var startOffset;
				
				if(!track.nextTime){
					// first time
					
					time = audioContext.currentTime;
					self.sectionStart = time-targetPart.offset;
					//this.sectionStart = self.sectionStart;
					startOffset = self.sectionStart;
				} else {
					// all other times
					time = track.nextTime + targetPart.offset;
					startOffset = 0;
				}
				playSound(targetPart, time);
				return track.nextTime + targetPart.length + startOffset;
			}

		}
		
	












		
		var Section = function(o){
		
			// a (multi)track arrangement
			// concists of (at least) one track
			// console.log("new Section() id " + o.id);
			this.id = o.index;

			this.volume = o.volume ||??1;
			if(typeof o.upbeat === "undefined"){
				this.upbeat = self.upbeat;
			}else{
				this.upbeat = self.getTime(o.upbeat);
			}
			
			this.tracks = [];
			this.transitions = [];
			this.leadIns = [];
			
			this.idName = o.id || "";
			
			
			this.tags = o.tags || o.class || urlsToTags(o.urls);
			if(typeof this.tags === "string"){this.tags = this.tags.split(" ")};
		
			

			this.parameters = this.initParameters(o, self.parameters);

			o.loopEnd = defaultParams.loopEnd || o.end || o.loopEnd || 0;
			this.parameters.loopEnd = this.getPosition(o.loopEnd).time;
			
			this.type = "section";

		
			this.addStem = function(urls){
				
				// create track object
				//console.log(urls);
				if(urls instanceof Array){
					//console.log("ulrs instanceof Array");
					// called from new Section where urls are specified with an array
					if(!urls[0].url && typeof urls[0] != "string"){
						//console.log("!urls[0].url", urls);

						o = urls.shift();

					}
				}else{
					
					var args = Array.prototype.slice.call(arguments, 0);
					
					if(typeof args[0] === "object"){
						if(!args[0].url){
							o = args.shift();
						}
					}
					if(args[0] instanceof Array){
						urls = args[0];
					} else {
						urls = args;
					}
				}


				
				var params = (typeof o === "object") ? o :??{};
				var id = this.tracks.length;
				params.loopActive = typeof params.loopActive === "number" ? params.loopActive : 1; 
				params.destination = params.destination || self.master.input;
				params.channelMerger = params.channelMerger || self.channelMerger;
				params.timeSign = params.timeSign || this.parameters.timeSign;
				params.tempo = params.tempo || this.parameters.tempo;
				params.upbeat = params.upbeat || this.parameters.upbeat;
				params.audioPath = params.audioPath || this.parameters.audioPath;
				//params.upbeat = (typeof params.upbeat == "number") ? params.upbeat : this.parameters.upbeat;
				params.partLength = params.partLength || this.parameters.partLength;
				params.loopEnd = params.loopEnd || this.parameters.loopEnd;
				
				
				params.volume = (typeof params.volume == "number") ? params.volume : this.parameters.volume;
				
				var bus;
				
				/* 
					// skip the idea of sharing busses between sections
				if(self.busses.length == this.tracks.length){
					// create a new bus if needed
					bus = new Bus(params);
					self.busses.push(bus);
				}else{
					bus = self.busses[id];
				}
				*/
				
				bus = new Bus(params);
				self.busses.push(bus);
				
				
				var parts = this.createParts(urls, params, bus, this);
				
				params.index = id;
				params.parts = parts;
				params.bus = bus;
				
				
				var newTrack = new Track(params, this);
				
				if(params.fadeTime){
					newTrack.setVolume(0, true); // true == dontStoreInParameters
				}
				
				this.tracks.push(newTrack);
				return newTrack;		
			}


			// add stem on init track if urls are provided
			if(o){
				if(o.urls){
					if(o.urls.length){
						this.addStem(o.urls);
					}
				}
			}
			
			
			this.addTransition = function(o){
			
				var args = Array.prototype.slice.call(arguments, 0);
				// treat first argument as targetPart
				var targetSection = args.shift();
							
				var firstObject = args[0];
				if(firstObject instanceof Object){
					
					// if object is the first part data
					if(firstObject.url){
						
					}else{
					// if object is default parameters for transition
						var params = args.shift();
					}
				}
				
				params = params || {};
				if(typeof params.upbeat === "undefined"){params.upbeat = self.upbeat;}
				params.urls = args;
				params.index = self.sections.length;
				this.transitions[targetSection.id] = new Section(params);
				
				
			}
			
			var triggedRecently = false;
			
			
				
			this.setOffset = function(offset){
				

				var oldMusicalStart = self.sectionStart;

				if(typeof offset === 'number'){
					self.sectionStart = audioContext.currentTime - offset / 1000;

				} else if(typeof self.externalOffset !== 'undefined'){
					
					// sync to external clock set by javascript
					// i.e. picked from a server syncronizing multiple clients
					
					var now = new Date().getTime();
					var timeSinceExternalOffset = (now - self.creationTime + self.externalOffset) / 1000;
					self.sectionStart = audioContext.currentTime - timeSinceExternalOffset;

				} else {
					
					// find the earliest start on any Stem and sets musicalStart accordingly
				
					var maxUpbeatOffset = getMaxUpbeatOffset(this.tracks);
					self.sectionStart = audioContext.currentTime + maxUpbeatOffset + timeWindow;
					
					
				}
				//this.sectionStart = self.sectionStart;
				return self.sectionStart;

				
			}
			


			

			this.stop = function(callBack){
				triggedRecently = false;
				if(self.queueID){clearInterval(self.queueID)}
				self.queueID = null;
				
				

				if(self.playing && self.currentSection == this){
					
					
					if(this.postSection){

						this.postSection.play(1);

					} else {	
						self.stop();
					}
			
				}
				
				
				self.playing = false;
				
				// reset all part counters
				this.tracks.forEach(function(track){
					//track.stop();
					track.parts.forEach(function(part){
						part.counter = 0;
					});
				});
			}


			this.queue = function(){

				
				this.play(1);

			}
			

			this.replay = function(){
				this.stop();
				
				
				this.play();
			}


			this.play = function(nrOfLoops, trigAfterAWhile){
				
				
				// exit if trigged recently or if this section is already playing
				if(triggedRecently ||??(self.currentSection == this && self.playing)){return;}
				
				
			

				
	 			if(!self.playing){
	 				
	 				initAudioContextTimer(self);
	 				
					
					if(!self.queueID){
						
						this.tracks.forEach(function(track){
							track.nextTime = 0;
						});
				
						self.queueID = setInterval(self.checkQueue, checkQueueTime);
						// There are timing problems with first event on track. Is this a solution?
						self.checkQueue();
					}
	 			}

	 			// reset if instance is not playing
				

				
	 			var barDuration = this.getBarDuration();
	 			var thisSection = this;
	 			
				if(self.currentSection && self.playing) {
					// set transition if it exists
					
					var maxUpbeatInThis = this.getMaxUpbeatOffset();
					var maxFadeTimeInThis = this.getMaxFadeTime();
					var legalBreak = self.currentSection.getNextLegalBreak(maxUpbeatInThis + maxFadeTimeInThis + audioContext.currentTime);
		 			var nextTime = legalBreak.time;
		 			//console.log("now: " + round(audioContext.currentTime) + ", next: " + round(self.sectionStart) );
		 			//console.log("nextTime", nextTime);
		 			
		 			var timeToLegalBreak = legalBreak.timeLeft;
		 			
		 			
		 			
		 			var maxUpbeatInCurrent = self.currentSection.getMaxUpbeatOffset();
		 			
		 			
		 			var maxFadeTimeInCurrent = self.currentSection.getMaxFadeTime();
		 			var maxLeadInOffset = this.getMaxLeadInUpbeatOffset();
		 			var minLeadInOffset = this.getMinLeadInUpbeatOffset();
		 			var maxOffset = Math.max(maxUpbeatInThis, maxUpbeatInCurrent, maxFadeTimeInThis, maxFadeTimeInCurrent);
		 			
		 			
		 			// L??gg till funktioner f??r att plocka en viss leadIn beroende p?? 
		 			// f??ruts??ttningar som hoppa fr??n takt, till takt etc
		 			
		 			var timeToTrigLeadIns = Math.min(timeToLegalBreak - maxLeadInOffset, timeToLegalBreak - minLeadInOffset);
		 			setTimeout(function(){
			 			if(minLeadInOffset < timeToLegalBreak && !trigAfterAWhile){
				 			thisSection.leadIns.forEach(function(leadIn){
					 			leadIn.play();
				 			});
				 			//console.log("trig leadin", minLeadInOffset, timeToLegalBreak);
			 			}
		 			}, Math.max(1, (timeToTrigLeadIns-timeWindow)*1000));
		 			
		 			
		 			
		 			/* Det h??r ??r ett struligt s??tt att fixa s?? att alla
			 			tracks loopar klart innan man b??rjar spela n??sta section
			 			G??r om!
			 		
		 			if(timeToLegalBreak > (timeWindow*2 + maxOffset)){
			 			// trigga om sektionen efter en stund
			 			
			 			
			 			setTimeout(function(){
				 			thisSection.play(nrOfLoops, true);
				 			console.log("Nu triggar sektionen efter " + round(timeToLegalBreak) + "s");
			 			}, (timeToLegalBreak-timeWindow*2-maxOffset)*1000);
			 			
			 			
			 			return;
			 			
		 			}
		 			*/
		 			
		 			
		 			self.currentSection.finishPlaying(timeToLegalBreak);
		 			self.sectionStart = nextTime;
		 			
		 			
		 			
		 			// reset all volumes on faded tracks
		 			this.tracks.forEach(function(track){
			 			if(track.parameters.fadeTime){
				 			
				 			track.parts.forEach(function(part){
					 			//playSound(part, nextTime);
				 			});
				 			
				 			if(track.active > 0){
					 			track.fadeIn();
				 			}
			 			}
		 			});
		 			
		 			
		 			

		 			/*
		 			// transitions currently blocked

					var transitions = self.currentSection.transitions;
					if(transitions){
						// sanity check
						if(transitions.length >= this.id){
							// if there is a transition defined for this change
							var transition = transitions[this.id];
							if(transition){
								self.transitionTracks = [];	
								for(var trackID in transition.tracks){
									var track = transition.tracks[trackID];
									
									// duplicate into iMus instance
									var transitionTrack = Object.create(track);
									transitionTrack.parts = Object.create(track.parts);
									transitionTrack.nextTime = nextTime;
									
									self.transitionTracks.push(transitionTrack);
								}
							}else{
								self.transitionTracks = [];
							}
						}
					}
					*/
					
				} else {

					var nextTime = this.setOffset(); // sets musicalStart depending on max upbeat
				
					if(!self.playing){
						self.musicalStart = nextTime;
					}

				}
				
				self.playing = true;
	 			
				var currentPartID;
				
				//console.log("play(section " + this.id + ", " + Math.floor(self.sectionStart*100)/100 + ")");
				 			
	 			if(nrOfLoops > 0){

	 				// queue a section in its full length
	 				// this way should probably merge into transtion playback
	 				self.sectionStart = nextTime;
	 				this.schedule(nrOfLoops);
	 				self.sectionStart += this.length * nrOfLoops;


	 			} else {

	 				// normal looped playback 
	 				currentPartID = currentPartID || 0;
	 			
	 				for(var trackID in this.tracks){
	 					var track = this.tracks[trackID];
	 					track.currentPartID = currentPartID;
	 					track.nextTime = nextTime;
	 				}
		 			
					self.currentSection = this;
					
				}


				triggedRecently = true;
				setTimeout(function(){triggedRecently = false;},200);
			}
			
			
		}
		
		Section.prototype.stopAllSounds = function(){
			this.stop();
			this.tracks.forEach(function(track){
				track.stopAllSounds();
			});
		}
		
		Section.prototype.addLoopTrack = function(urls){
			
			if(typeof urls === "string"){urls = [urls];}
			var tags = mergeArrays(urlsToTags(urls), this.tags);
			//var tags = urlsToTags(urls).concat(this.tags);
			return this.addStem({tags: tags}, urls);
			
		}
		
		Section.prototype.addMotif = function(params, urls){
			return defaultInstance.addMotif(params, urls, this);
		}
		
		
		Section.prototype.addStingerTrack = function(urls){
			
			var tags = urlsToTags(urls); // .concat(this.parameters.tags);
			return self.addMotif({tags: tags}, urls);
			
		}
		
		Section.prototype.addTrackGroup = function(selector){
			var selection = new Selection(selector, this.tracks);
			selection.group();
			
			selection.objects.forEach(function(track, id){
				var activeVal = (id == 0 ? 1 : 0);
				track.setActive(activeVal);
			});

						
		}
		

		Section.prototype.schedule = function(nrOfLoops){

			var end = this.parameters.loopEnd * nrOfLoops;

			for(trackID in this.tracks){

				var nt = self.sectionStart;

				var track = this.tracks[trackID];

				for(var loopID = 0; nt < end; loopID++){
					var trackStart = loopID * track.parameters.loopEnd;
					for(partID in track.parts){

						var targetPart = track.parts[partID];

						// store randomness from track in part
						targetPart.active = track.active;
						var relPos = targetPart.pos + targetPart.offset;

						// if targetPart is within timeWindow
						var time = self.sectionStart + trackStart + relPos;
						playSound(targetPart, time);

					}
				}
			}
		}
		
			
			
		function getNextLegalBreak(targetTime, compareObjArr){
			
			
			// den h??r koden inneh??ller en del fel som g??r att ??verg??ngar sker direkt n??r man anv??nder fadeTime
			// d??rf??r har jag blockerat logiken f??r tillf??llet och anv??nder j??mna takter s?? l??nge
			
			
			targetTime = targetTime || audioContext.currentTime;
			var musicTime = targetTime - self.sectionStart;
			var barDuration = this.getBarDuration();
			
			
			var returnObj;
			returnObj = {};
			returnObj.time = self.sectionStart + Math.ceil(musicTime / barDuration) * barDuration;	
			returnObj.timeLeft = returnObj.time - audioContext.currentTime;
			returnObj.fadeTime = this.parameters.fadeTime || 0.01;
			returnObj.fadeTime = Math.min(returnObj.fadeTime, returnObj.timeLeft);
			return returnObj;
			
				
			
			// getTime() ??r inte stabil. Det jag beh??ver h??r ??r tiden sedan musiken startade 
			//var localTime = this.getTime();
			
			
			var legalBreakPoints = this.parameters.legalBreakPoints || [{pos: "2.1"}];
			var loopEnd = this.musicalPositionToTime(this.get("loopEnd") ||??"2.1");
			
			targetTime = targetTime || audioContext.currentTime;
			var musicTime = targetTime - self.sectionStart;
			var localTime = musicTime % loopEnd;
			var loopID = Math.floor(musicTime / loopEnd);
			
			var targetBreakPoint = legalBreakPoints.find(function(breakPoint){
				var pos;
				
				switch(typeof breakPoint){
					
					case "object":
					pos = this.musicalPositionToTime(breakPoint.pos);
					break;
					
					case "number":
					pos = breakPoint;
					break;
				}
				
				
				
				var avoidPoint = false;
				/*
				if(compareObjArr){
					compareObjArr.forEach(function(compareObj){
						switch(compareObj.comp){
							case "equal":
							case "=":
							case "==":
							if(breakPoint[compareObj.prop] != compareObj.val){avoidPoint = avoidPoint || true}
							break;
							
							case "greaterThan":
							case ">":
							if(breakPoint[compareObj.prop] <= compareObj.val){avoidPoint = avoidPoint || true}
							break;
							
							case "lessThan":
							case "<":
							if(breakPoint[compareObj.prop] >= compareObj.val){avoidPoint = avoidPoint || true}
							break;
							
						}
					});
				}
				*/
				if(!avoidPoint){
					return pos > localTime;	
				}
						
			}, this);
			
			if(!targetBreakPoint){
				targetBreakPoint = legalBreakPoints[legalBreakPoints.length-1];
			}
			
			console.log(loopID, loopEnd, targetBreakPoint);
			
			var returnObj;
			returnObj = {};
			returnObj.time = self.sectionStart + loopID * loopEnd + this.musicalPositionToTime(targetBreakPoint.pos);
			returnObj.fadeTime = targetBreakPoint.fadeTime ||??this.parameters.fadeTime || 0.01;	
			returnObj.timeLeft = returnObj.time - audioContext.currentTime;
			
			if(returnObj.timeLeft < 0){
				console.log(returnObj);
				returnObj.timeLeft = 0;
			}
			
			
			// den h??r koden inneh??ller en del fel som g??r att ??verg??ngar sker direkt n??r man anv??nder fadeTime
			// d??rf??r har jag blockerat logiken f??r tillf??llet och anv??nder j??mna takter s?? l??nge
			
			
			
			return returnObj;
		}
	


		Section.prototype.getNextLegalBreak = getNextLegalBreak;

		Section.prototype.finishPlaying = function(timeToLegalBreak){
			
			this.tracks.forEach(function(track){

				track.finishPlaying(timeToLegalBreak);

			});
		}
		
		
		Section.prototype.addLeadIn = function(params, urls){
			
			// anv??nds dessa rader alls? kolla addMotif
			params.quantize = params.quantize ||??"bar";
			var leadin = self.addLeadIn(params, urls);
			leadin.parameters.type = "leadIn";
			this.leadIns.push(leadin);
			return leadin;
		}
		
		Section.prototype.getMaxLeadInUpbeatOffset = function(){
			var maxOffset = 0;
			this.leadIns.forEach(function(leadIn){
				maxOffset = Math.max(maxOffset, leadIn.getMaxUpbeatOffset());
			});
			return maxOffset;
		}
		
		Section.prototype.getMinLeadInUpbeatOffset = function(){
			var minOffset = this.getBarDuration();
			this.leadIns.forEach(function(leadIn){
				 minOffset = Math.min(minOffset, leadIn.getMinUpbeatOffset());
			});
			return minOffset;
		}
		
		Section.prototype.setTempo = function(value){
			
			this.parameters.tempo = value;
			
			this.tracks.forEach(function(track){
				track.parameters.tempo = value;
				
				track.parts.forEach(function(part){
					part.parameters.tempo = value;
				});
			});
		}

			
		Section.prototype.initParameters = initParameters;
		Section.prototype.addDefaultParameters = addDefaultParameters;
		Section.prototype.getBeatDuration = getBeatDuration;
		Section.prototype.getBarDuration = getBarDuration;
		Section.prototype.getPosition = getPosition;
		Section.prototype.createParts = createParts;
		Section.prototype.getTime = getTime;
		Section.prototype.set = set;
		Section.prototype.get = get;
		Section.prototype.getMaxUpbeatOffset = getMaxUpbeatOffset;
		Section.prototype.getMaxFadeTime = getMaxFadeTime;
		Section.prototype.musicalPositionToTime = musicalPositionToTime;
		







		
		var Track = function(o, section){
			
			// A collection of parts
			// Always playes in looped mode
			// Exists within a Section and Transition
			params = o ||??{}
			
			this.id = params.index;
			this.parts = params.parts;
			this.nextTime = 0;
			this.currentPartID = 0;
			this.tags = params.tags || params.class || "";
			if(typeof this.tags === "string"){this.tags = this.tags.split(" ")};
			this.idName = params.id || "";
			this.playingParts = [];
			this.groups = [];
			this.section = section;
			
			this.type = "track";
			
			this.liveValues = {};
			
			
			this.bus = o.bus || self.getBus(this.id);
			this.volume = typeof o.volume === "number" ? o.volume : 1;
			this.bus.output.gain.value = this.volume;
			
			this.loopID;
			this.loopActive = typeof o.loopActive === "number" ? o.loopActive : 1;
			this.playing = false;

			
			// active is a number value between 0 and 1 that controls the the random factor 
			// to play or not to play a part on an active track
			// 0 = muted = no parts will play
			// 0.5 = 50% of the parts will play controlled by random()
			// 1 = unmuted = all parts will play
			
			if(typeof params.active === "boolean"){
				this.active = params.active ? 1 : 0;
			}else if(typeof params.active === "number"){
				this.active = params.active > 1 ? 1 : (params.active < -1 ? -1 : params.active);
			}else{
				this.active = 1;
			}
			
			
			if(params.fadeTime){
				params.fadeTime = params.fadeTime / 1000;
			}
					
			this.parameters = this.initParameters(params, section.parameters);
		
			var beatDuration = self.getBeatDuration(); // !!
			var barDuration = self.getBarDuration();
			
			this.parameters.loopEnd = params.loopEnd || section.parameters.loopEnd ||??self.parameters.loopEnd || defaultParams.loopEnd;
			
			if(typeof params.loopEnd === "string"){
				
				// get track length (for looping) from specified value
				
				this.parameters.loopEnd = this.musicalPositionToTime(o.loopEnd);

			} else {
				
				// use position and length of last part to define track length
				if(this.parts.length){
					var lastPart = this.parts[this.parts.length-1];
					lastPart.length = lastPart.length || barDuration;
					this.parameters.loopEnd = lastPart.pos + lastPart.length;
				} else {
					// to avoid errors
					this.parameters.loopEnd = barDuration;
				}
			}
			
			
			this.eventHandler = new EventHandler();

						
		}
		
		
		Track.prototype.play = function(){
			
			// auto play the section of this track if iMusic is not playing
			if(!self.playing){
				this.section.play();
			}
			
			initAudioContextTimer(self);
			
			var thisTrack = this;
			
			// Mute all tracks in group if track is part of a group
			this.groups.forEach(function(group){
				group.stop({omit:thisTrack});
			});

			if(this.active > 0){
				if(this.parameters.fadeTime){
					this.fadeIn();
				}
				return;
			} else if(this.active == 0){
				this.active = 1;
			} else {
				this.active = -this.active;
			}
			
			if(self.playing){
			
				// make sure a track in fade mode is fading in
				if(this.parameters.fadeTime){
					
					// add a track output before common bus input
					// or add a bus for each track
					
					var nextLegalBreak;
					nextLegalBreak = this.getNextLegalBreak();
					if(!nextLegalBreak){
						nextLegalBreak = this.section.getNextLegalBreak();
						nextLegalBreak.fadeTime = this.parameters.fadeTime;
					}
					var timeToLegalBreak = nextLegalBreak.time - audioContext.currentTime;
					this.fade(this.parameters.volume, timeToLegalBreak, nextLegalBreak.fadeTime);
				}
			} 
		}
		
		
		Track.prototype.stop = function(){
			
			if(this.active <= 0){
				return;
			}
			this.active = -this.active;	
			
			if(this.parameters.fadeTime){
				if(self.playing){
					// make sure a track in fade mode is fading in
					
					// add a track output before common bus input
					// or add a bus for each track
					
					var nextLegalBreak = this.getNextLegalBreak(); // [{prop:"out", comp:"=", val:true}]
					this.fade(0, nextLegalBreak.timeLeft, nextLegalBreak.fadeTime);
					
					
				} else {
					this.fade(0, 0, 0);
				}

			}
			

		}
		
		Track.prototype.stopAllSounds = function(){
			
			this.finishPlaying(0);
		}

		Track.prototype.finishPlaying = function(timeToLegalBreak){
			
			var fadeTime = this.parameters.fadeTime;
			this.playing = false;
			var me = this;
			
			var disconnectAllObjects = function(){
				me.parts.forEach(function(part){
					if(part.playingSources){
			 			while(part.playingSources.length){
			 				var oldSource = part.playingSources.shift();
			 				oldSource.disconnect(0);
			 				oldSource = 0;
			 			}
					}
				});
			}

			if(fadeTime){
				this.fade(0, timeToLegalBreak, fadeTime, disconnectAllObjects);
			} else {
				//disconnectAllObjects();
			}
		}
		
		Track.prototype.setVariation = function(val, val2){
			this.parts.forEach(function(part){
				part.variation = val;
				part.variationMaster = (val2 == "master");
			});
			
		}
		
		
		Track.prototype.setPartLength = function(value){
			
			value = this.divisionToTime(value);
			this.parts.forEach(function(part){
				part.length = value;
			});
			
		}
		
		
		Track.prototype.setUpbeat = function(value){
			
			value = this.divisionToTime(value);
			this.parts.forEach(function(part){
				part.offset = -value;
			});
			
		}
		
		Track.prototype.setRepeat = function(val){
			this.parts.forEach(function(part){
				part.parameters.repeat = val;
				part.counter = 0;
			});
		}
		
		Track.prototype.update = function(sequence){
			
			this.parts = this.createParts(sequence, this.parameters, this.bus, this);
			
		}
		
		
		
		Track.prototype.getNextLegalBreak = getNextLegalBreak;
		Track.prototype.initParameters = initParameters;
		Track.prototype.addDefaultParameters = addDefaultParameters;
		Track.prototype.getBeatDuration = getBeatDuration;
		Track.prototype.getBarDuration = getBarDuration;
		Track.prototype.getPosition = getPosition;
		Track.prototype.setActive = setActive;
		Track.prototype.createParts = createParts;
		Track.prototype.getTime = getTime;
		Track.prototype.setVolume = setVolume;
		Track.prototype.getVolume = getVolume;
		Track.prototype.fade = fade;
		Track.prototype.fadeIn = fadeIn;
		Track.prototype.fadeOut = fadeOut;
		Track.prototype.musicalPositionToTime = musicalPositionToTime;
		Track.prototype.set = set;
		Track.prototype.divisionToTime = divisionToTime;
		Track.prototype.get = get;
		
		Track.prototype.urlToUpbeat = urlToUpbeat;

		Track.prototype.setActiveVariations = function(activeVariations){
			
			this.parameters.activeVariations = activeVariations;
			this.parts.forEach(function(part){
				part.parameters.activeVariations = activeVariations;
			});
		}




		var Part = function(o, defaultData, bus, curPos){
			// a (typically) one bar of music including (optional) upbeat and (recommended) release tag
			
			var thisPart = this;
			if(o instanceof Array){
			
				// if array with urls
				o = {url:o};

			} else if(typeof o === "string"){
				// if single url
				o = {url:o};
			}
			
			o = o || {};
			defaultData = defaultData ||??{};
			this.parameters = this.initParameters(defaultData);
			
			var beatDuration = getBeatDuration(defaultData);
			var barDuration = getBarDuration(defaultData);
			
			if(typeof defaultData.timeSign === "string"){
				defaultData.timeSign = getTimeSign(defaultData.timeSign);
				//defaultData.length = defaultData.timeSign.nominator * beatDuration * self.parameters.timeSign.denominator / defaultData.timeSign.denominator;
			}
			var timeSign = defaultData.timeSign || self.parameters.timeSign;
			
			
			// ******* UPBEAT ******* //
			/*
			var upbeat;
			if(typeof o.upbeat === "undefined"){
				upbeat = defaultData.upbeat;
			} else {
				upbeat = o.upbeat;
			}
			*/
			
			upbeat = o.upbeat || defaultData.upbeat ||??self.parameters.upbeat ||??defaultData.upbeat;
			
			if(typeof upbeat === "string"){
				upbeat = getTimeSign(upbeat);
				upbeat = upbeat.nominator * beatDuration * self.parameters.timeSign.denominator / upbeat.denominator;
			} else if(typeof upbeat === "number"){
				upbeat /= 1000;
			}
			this.offset = -upbeat ||??0.0;

			
			
			// ******* POSITION ******* //
			if(typeof o.pos === "string"){
				// use specified pos if available, else calculated value from previous part
				// format has to be "bar.beat" ie "10.3" for beat 3 in bar 10
				curPos = this.musicalPositionToTime(o.pos);
			}
			this.pos = curPos;
			
			
			
			
			// ******* LENGTH ******* //
			
			var length;
			if(typeof o.length === "number"){
				length = o.length;
			} else {
				length = o.length || defaultData.partLength;
				length = divisionToTime(length, defaultData.timeSign, beatDuration);
				/*
				if(typeof length === "string"){
					length = getTimeSign(length);
				}
				
				length = length.nominator * beatDuration; // * self.parameters.timeSign.denominator / length.denominator;
				*/
			}
			
			this.length = length;
			
			
						
			
			// store urls in array 
			var urls = typeof o.url === "string" ? [o.url] : o.url;
			
			var urlsCopy = [];
			this.files = [];
			// make a fresh copy of urls (so we don't mess with incoming array)
			urls.forEach(function(url){
				urlsCopy.push(url);
			});
			this.url = urlsCopy;
			
			for(var urlID in this.url){
				
				if(typeof this.url[urlID] === "string"){
					if(this.url[urlID].length){
						var fullPath = addAudioPath(defaultData.audioPath, this.url[urlID]);
						this.url[urlID] = fullPath;
						
						self.loadFile({url: this.url[urlID]}, function(fileData){
							
							// double structure for future use
							thisPart.files.push(fileData);
							loadComplete();
						});
						
						console.log(this.url[urlID] + ": pos: " + this.pos + "; offset: " + this.offset + "; length: " + this.length);
					}
				}
			}
			
			this.id = o.index;
			
			this.parameters.destination = bus.input;
			this.parameters.channelMerger = self.channelMerger;
			
			this.bus = new Bus(this.parameters);						
		}	
		
		Part.prototype.fade = fade;
		Part.prototype.initParameters = initParameters;
		Part.prototype.addDefaultParameters = addDefaultParameters;
		Part.prototype.getBeatDuration = getBeatDuration;
		Part.prototype.getBarDuration = getBarDuration;
		Part.prototype.getPosition = getPosition;
		Part.prototype.setActive = setActive;
		Part.prototype.musicalPositionToTime = musicalPositionToTime;









		
		var Motif = function(o, section){
			
			// A short, single track, single part, phrase to be played in addition
			// to a section. It can trigger quantized to a specific note value
			
			
			this.id = self.motifs.length;
			this.section = section;
			
			this.type = "motif";
			
			var me = this;
			var beatDuration = self.getBeatDuration();

			var parentObj = section || defaultInstance;
			o.quantize = getTimeSign(o.quantize || parentObj.parameters.quantize ||??self.parameters.quantize, parentObj.parameters.timeSign);
			
			this.volume = o.volume || 1; 
			this.parameters = this.initParameters(o, self.parameters);
			
			this.loop = o.loop || 0;
			this.loopCnt = 0;
			this.idName = o.id || "";
			
			
			this.tags = o.tags || params.tags || params.class || urlsToTags(o.urls) || [];
			if(typeof this.tags === "string"){this.tags = this.tags.split(" ")};

			this.parameters.destination = self.motifBus.input;
			this.parameters.channelMerger = self.channelMerger;
			this.bus = new Bus(this.parameters);




		
			
			this.active = typeof o.active === "number" ? o.active :??1;
			this.sounds = [];
			this.offset = -self.getTime(this.parameters.upbeat);
			
			var obj;
			var url;
			
			for(var urlID in o.urls){
				url = o.urls[urlID];


				if(typeof url === "string"){

					// url without parameters
					obj = {};
					obj.url = addAudioPath(self.parameters.audioPath, url);
					
					
					obj.offset = -this.urlToUpbeat(url) || this.offset;
					
					//obj.offset = this.offset || 0;
				} else if(typeof url === "object"){

					// url with parameters
					obj = url;
					
					obj.url = addAudioPath(self.parameters.audioPath, obj.url);
					
					// length
					if(obj.length){
						var length = getTimeSign(obj.length);
						obj.length = length.nominator * beatDuration * self.parameters.timeSign.denominator / length.denominator;
					}
					
					
					obj.offset = -self.getTime(obj.upbeat || this.parameters.upbeat);
					obj.offset = obj.offset || 0;					
				} else {
					
					console.error("Motif url is not correct: " + url);
				}
				self.loadFile(obj);
				
				this.sounds.push(obj);
			}
			
						
			
			me.triggedRecently = false;
			
			this.play = function(){
				
				// only play if parent section is playing or if Motif is 
				// not connected to a section
				if(this.section){
					if(!(this.section.parameters.tags == defaultSectionName || this.section == self.currentSection)){
						return;
					}
				}

				
				if(this.parameters.release){
					this.fadeOut(0, this.parameters.release);
				}
				
				
				// avoid cracy double trigging
				
				var blockRetrig = this.parameters.blockRetrig || 0;
				
				if(arguments.length){				
					var args = Array.prototype.slice.call(arguments, 0);
					if(typeof args[0] === "number"){
						blockRetrig = args.shift();
					}
					
					if(typeof args[0] === "string"){
						var playFunction = args.shift();
						switch(playFunction) {
							
							// causes the motif to retrigger when played
							case "loop":
							this.loop = -1;
							break;
						}
					}
					
					
					if(typeof args[0] === "function"){
						this.callBackOnFinish = args.shift();
					}
				}
				
				if(me.triggedRecently){
					console.log("trigged recently");
					return;
				}
				
				me.playing = true;
				
				if(self.currentSection && this.parameters.quantize != "off"){
					
				
					var beatDuration = self.currentSection.getBeatDuration();
					var Q = this.parameters.quantize.nominator * beatDuration * self.currentSection.parameters.timeSign.denominator / this.parameters.quantize.denominator;
	
	
					var time = self.currentSection.getTime();
					var Qtime = Math.ceil(time / Q) * Q + self.sectionStart;
					var localTime = time % Q;
					
					var timeToQ = Q - localTime;
					
					
					// sort all sounds with the one to be played nearest in the future first 
					this.sounds.sort(function(a, b){
						var diffA = Q + a.offset - localTime;
						diffA = diffA < 0 ? diffA + Q : diffA;
						var diffB = Q + b.offset - localTime;
						diffB = diffB < 0 ? diffB + Q : diffB;
						return diffA - diffB;
					});
				} else {
					timeToQ = 0;
				}
				

				var targetSounds = [];
				
				// pick the url that best suits the time from now to Qtime
				for(var i = 0; i < this.sounds.length; i++) {
					
					var curSound = this.sounds[i];
					if(targetSounds.length) {
						
						// add sound if it has the same offset (then randomize)
						if(curSound.offset == targetSounds[0].offset){
							targetSounds.push(curSound);
						}
					} else {
						
						// add at least one sound
						targetSounds.push(curSound);
					}
					
				}
				
				// put all possible files in url-list
				this.url = [];
				for(var sndID in targetSounds){
					var targetSound = targetSounds[sndID]
					this.url.push(targetSound);
				}
				//var targetSound = targetSounds[Math.floor(Math.random()*targetSounds.length)];
				
				if(this.parameters.quantize != "off"){
					// move to next legal Q if time is to early
					var t = Qtime + targetSound.offset;
					
					if(this.parameters.type != "leadIn"){
						while(t < audioContext.currentTime) {
							t+=Q;
						}
					} else {
						if(t < audioContext.currentTime){
							// don't play a leadin if it's too late
							return;
						}
					}
				} else {
					t = audioContext.currentTime;
				}
				//this.url = targetSound.url;
				
				var that = this;
				var doOnFinishPlaying = function(){
				
					// retrigg if eternal loop
					
					switch(me.loop) {
						
						case -1:
						if(me.playing){
							me.play();
						}
						
						break;
						
						case 0:
						me.playing = false;
						break;
						
						default:
						me.loopCnt++;
						if(me.loopCnt <= me.loop){
							me.play();
						} else {
							me.playing = false;
							me.loopCnt = 0;
						}
						break;
						
					}
					if(that.callBackOnFinish){that.callBackOnFinish();}
				}
				
				var chosenURL = playSound(this, t, this.callBackOnStart, doOnFinishPlaying);
				
				switch(this.parameters.retrig){
					
					case "next":
					case "shuffle":
					case "repeat":
					case "other":
					var i = this.sounds.indexOf(chosenURL);
					// pick target URL
					chosenURL = this.sounds.splice(i, 1)[0];
					// move selected file last
					this.sounds.push(chosenURL);
					break;
					
				}
				
				
				
				
				if(blockRetrig){
					me.triggedRecently = true;
					setTimeout(function(){
						me.triggedRecently = false;
					},blockRetrig*1000);
				}
				
				return timeToQ*1000;
			}
			
			
			this.stop = function(){
				
				me.playing = false;
				me.triggedRecently = false;
				var gainNode = this.bus.input;
				
				fadeAudioNode(gainNode, 1, 0, 0.01);
				
				if(me.playingSources){
					setTimeout(function(){
						me.playingSources.forEach(function(source){
							source.disconnect(0);
						});
						fadeAudioNode(gainNode, 0, 1, 0);
					}, 20);	
				}
					
				
			}
			
		}



		this.addMotif = function(){
			
			var params = {};
			var q, upbeat;
			
			if(arguments.length){	
				var args = Array.prototype.slice.call(arguments, 0);
				if(args[0] instanceof Object){
					if(!args[0].url){
							
						// Motif properties found
						params = args.shift();
						
					}
					
				} 
				
				while(!args[args.length-1]){
					args.pop();
				}
				
				
				// check if urls was set with array
				if(Array.isArray(args[0])){
					params.urls = args[0];
				} else {
					params.urls = args;
				}
				
				
				// store reference to section
				var section = args[1];
				

			} else {
				
				return -1;
			}
		
			var newMotif = new Motif(params, section);
			self.motifs.push(newMotif);
			
			
			return newMotif;
		}
		
		Motif.prototype.getMaxUpbeatOffset = function(){
			
			var maxOffset = 0;
			this.sounds.forEach(function(sound){
				maxOffset = Math.min(maxOffset, sound.offset);
			});
			
			return -maxOffset;
		}
		
		Motif.prototype.getMinUpbeatOffset = function(){
			
			var minOffset = -this.getBarDuration();
			this.sounds.forEach(function(sound){
				minOffset = Math.max(minOffset, sound.offset);
			});
			
			return -minOffset;
		}
		
		
		
		
		this.addLeadIn = this.addMotif;



		Motif.prototype.initParameters = initParameters;
		Motif.prototype.addDefaultParameters = addDefaultParameters;
		Motif.prototype.getBeatDuration = getBeatDuration;
		Motif.prototype.getBarDuration = getBarDuration;
		Motif.prototype.getPosition = getPosition;
		Motif.prototype.setActive = setActive;
		Motif.prototype.setVolume = setVolume;
		Motif.prototype.getVolume = getVolume;
		Motif.prototype.set = set;

		Motif.prototype.fade = fade;
		Motif.prototype.fadeIn = fadeIn;
		Motif.prototype.fadeOut = fadeOut;
		Motif.prototype.setActiveVariations = setActiveVariations;
		Motif.prototype.get = get;
		
		Motif.prototype.urlToUpbeat = urlToUpbeat;









		
		var SFX = function(){
			
			// a SFX object
			this.url = Array.prototype.slice.call(arguments, 0);
			
			this.bus = new Bus({destination: self.sfxBus.input, channelMerger: self.channelMerger});

			
			for(var urlID in this.url){
				this.url[urlID] = addAudioPath(self.parameters.audioPath, this.url[urlID]);
				self.loadFile({url: this.url[urlID]});
			}
			
			
			var triggedRecently = false;
			
			this.play = function(){
				
				var blockRetrig = this.parameters.blockRetrig;
				
				if(arguments.length){				
					var args = Array.prototype.slice.call(arguments, 0);
					if(typeof args[0] === "number"){
						blockRetrig = args.shift();
					}
					
					if(typeof args[0] === "function"){
						var callBackOnFinish = args.shift();
					}
				}
				
				
				if(!triggedRecently){
					blockRetrig = blockRetrig || 500;
	
					playSound(this, audioContext.currentTime, null, callBackOnFinish);	
					triggedRecently = true;
					setTimeout(function(){triggedRecently = false;},blockRetrig);
				}
			}
			
			return this;
			
		}


		SFX.prototype.setVolume = setVolume;
		SFX.prototype.getVolume = getVolume;
		SFX.prototype.get = get;
		
		
		//this.addSFX = SFX;
		this.addSFX = (function() {
		    function tempSFX(args) {
		        return SFX.apply(this, args);
		    }
		    tempSFX.prototype = SFX.prototype;

		    return function() {
		        return new tempSFX(arguments);
		    }
		})();







				
		function posStringToObject(pos) {
			obj = {}
			obj.bar = 1;
			obj.beat = 1;
			obj.offBeat = 0;
			
			
			if(typeof pos === "string"){
				var delimiter = pos.indexOf(",") != -1 ? "," : ".";			
				pos = pos.split(delimiter);
				if(pos.length){obj.bar = eval(pos[0])};
				if(pos.length > 1){obj.beat = eval(pos[1])};
				if(pos.length > 2){obj.offBeat = eval(pos[2])};
			}
			return obj;
		}
		
		
		function musicalPositionToTime(pos){
			var time = 0;
			switch(typeof pos) {
				
				case "string":
				var obj = posStringToObject(pos);
				var beatDuration = this.getBeatDuration();
				time = this.getBarDuration() * (obj.bar-1) + beatDuration * (obj.beat-1) + beatDuration * obj.offBeat;
				break;
				
				
				case "number":
				time = pos;
				break;
				
			} 
			return time;
		}
		

		
		function createParts(urls, defaultData, bus){
				
			// create Part objects
			var parts = [];
			var curPos = 0;
			for(var i=0; i<urls.length; i++){	
				var part = new Part(urls[i], defaultData, bus, curPos);			
				parts.push(part);
				curPos = part.pos + part.length;
			}
			return parts;
		}
		
		
		
		
	}


	function addSuffix(url){

		// check suffix
		var s = url.substr(-4);
		switch(s){

			case ".wav":
			case ".mp3":
			case ".ogg":
			return url;
			break;


			default:
			return url + "." + this.parameters.suffix;
			break;

		}
		

	}



	function setVolume(val, dontStore){

		if(!this.bus){return}
		this.bus.output.gain.value = val;
		
		if(!this.parameters || dontStore){return}
		this.parameters.volume = val;
	}


	function getVolume(){

		if(!this.bus){return -1}
		return this.bus.output.gain.value;
	}
	
	
	

	iMus.prototype.initParameters = initParameters;
	iMus.prototype.addDefaultParameters = addDefaultParameters;
	iMus.prototype.getBeatDuration = getBeatDuration;
	iMus.prototype.getBarDuration = getBarDuration;
	
	iMus.prototype.getTime = getTime;
	iMus.prototype.addSuffix = addSuffix;
	iMus.prototype.getPosition = getPosition;
	iMus.prototype.divisionToTime = divisionToTime;
	iMus.prototype.fade = fade;
	iMus.prototype.fadeOut = fadeOut;
	iMus.prototype.fadeIn = fadeIn;
	
	
	iMus.prototype.setOffset = function(offset){

		var nextTime;
		for(var sectionID in this.sections){

			var section = this.sections[sectionID];
			nextTime = section.setOffset(offset);
		}
		return nextTime;
	}
	
	

	iMus.prototype.find = find;


	iMus.prototype.play = function(selector){
		
		if(!this.sections.length){return;}
		this.sections[0].play();
	}
	
	
	iMus.prototype.call = function(selector, options){
		
		var selection = new Selection(selector, this);
		selection.play(options);
		
	}
	iMus.prototype.addAction = addAction;
	
	
	
	iMus.prototype.addReverb = function(params){
		
		if(!params){return}
		if(!params.url){return}
		if(!params.src){return}
				
		var url = addAudioPath(this.parameters.audioPath, params.url);
		
		var targetSFX = this.sendEffects[url];
		var self = this;
		
		if(!targetSFX){
			
			targetSFX = audioContext.createConvolver();
			this.sendEffects[url] = targetSFX;
			
			this.loadFile({url:url}, function(){
				var buffer = buffers[url];
				var bufferSource = audioContext.createBufferSource();
				bufferSource.buffer = buffer;
				
				targetSFX.buffer = buffer;
				targetSFX.loop = true;
				targetSFX.normalize = true;
				targetSFX.connect(params.output ||??self.master.output);
	
			});
			
			
		}
		
		params.src.connect(targetSFX);
	}
	
	iMus.addLFO = addLFO;
	
	
	
		
	iMus.prototype.setTempo = function(value){
		
		
		this.sections.forEach(function(section){
			
			section.setTempo(value);
		});
	}
	
	
		
	iMus.setTempo = function(value){
		
		
		this.instances.forEach(function(instance){
			
			instance.setTempo(value);
		});
	}
	iMus.timeToNext = function(val){
		return defaultInstance.timeToNext(val);
	}
	iMus.prototype.timeToNext = function(val){
	
		return this.divisionToTime(val)*1000;
	}
	
	iMus.prototype.on = function on(int, fn, offset, repeat){
		
		if(!fn){return}
		offset = offset || 0;
		offset /= 1000;
				
		repeat = repeat || -1;
		var self = this;
		var interval;
		var intervalID = 0;
		var counter = 1;
		
		switch(typeof int){
			
			case "string":
			if(stringIsTimeSign(int)){
				var intervalString = int;
				interval = this.divisionToTime(int);
			}
			
			break;
			
			case "number":
			interval = int/1000;
			break;
			
			default:
			return;
			break;
			
		}
		
		
		var run = function(){
			
			var nextTrig = self.musicalStart + interval * counter + offset;
			var delay = nextTrig - audioContext.currentTime;
			counter++;
			setTimeout(function(){
				fn();
				if(counter <= repeat || repeat == -1){
					run();
				}
			}, delay*1000);	
		}
		
		var wait = function(){
			
			if(self.playing){
				
				run();
				
			} else {
				
				// wait until running
				setTimeout(wait, 100);
			}
			
		}
		wait();
		
		return interval;
		
	}
	
	
	function addAction(id, fn){
		this.actions.push( new Action(id, fn) );
	}
	
	
	
	var Action = function(id, fn){
		
		this.idName = id;
			
		this.tags = id.split(" ");
		this.play = fn;
		
		return this;
	}

	
	
	// SELECTION OPERATIONS

	function find(selector){

		return new Selection(selector, this);
		
	}
	
	var Selection = function(selector, container){
		
		var allObjects = [];
		this.objects = [];
		
		
		switch(typeof selector){
			
			case "string":
			break;
			
			case "object":
			selector = selector.join(" ");
			break;
			
			default:
			return this;
			break;
		}
		
		if(!selector.length){return this}
		
		var type;
		switch(typeof selector){
			
			case "string":
			this.selector = selector;
			selector = selector.split(" ").shift();
			var firstChar = selector.substr(0, 1);
	
			switch(firstChar){
				
				case "#":
				type = "id";
				selector = selector.substr(1);
				break;
				
				case ".":
				type = "class";
				selector = selector.substr(1);
				break;
				
				default:
				type = "class";
				selector = this.selector;
				break;
				
			}
			
			break;
			
			default:
			return this;
			break;
			
		}

		// limit search range to container
		var targetInstances;
		if(container instanceof iMus) {

			targetInstances = [container];

		} else {
			targetInstances = iMus.instances;
		}

		

		if(container instanceof Selection){

			// sub selection of selection
			allObjects = container.objects;

		} else if(container instanceof Array){
			
			// sub selection of tracks in a section
			allObjects = container;
			
		} else {


			// selection in all or one instance

			targetInstances.forEach(function(instance){

				instance.sections.forEach(function(section){

					allObjects.push(section);
					section.tracks.forEach(function(track){

						allObjects.push(track);
					});
				});

				instance.motifs.forEach(function(motif){

					allObjects.push(motif);
				});

				instance.actions.forEach(function(action){

					allObjects.push(action);
				});
				
				/* instance.SFXs not implemented yet
				instance.SFXs.forEach(function(sfx){

					allObjects.push(sfx);
				});
				*/

			});

		}
		
		
		

		var objects = [];

				
			
		allObjects.some(function(obj){

			switch(type){

				case "id":
				if(obj.idName == selector){
					objects.push(obj);
				}
				
				break;

				case "class":
				var matchedClass = inArray(selector, obj.tags);
				
				// check if this is a section. If so just add this section to objects
				
				if(matchedClass){
					if(obj.type == "section"){
						objects = [obj];
						return true;
					} else {
						objects.push(obj);
					}
					
				}
				break;

				case "objectType":
				//change to make it possible to select different types of objects !!!
				switch(selector){
					
					case "track":
					case "stem":
					if(obj instanceof Track){objects.push(obj)}
					break;
					
					case "motif":
					if(obj instanceof Motif){objects.push(obj)}
					break;
				}
				
				
				break;

			}


		});
		
		
		this.objects = objects;
		
		return this;
	}
	
	
	Selection.prototype.createDefaultSectionIfNeeded = function(){

		// generate section if no matches
		if(!this.objects.length){
			
			var newSection = defaultInstance.addSection({tags: this.selector});
			
			if(!defaultInstance.currentSection){
				defaultInstance.currentSection = newSection;
			}
			this.objects.push(newSection);
			
			
		}
	}
	
	
	
	Selection.prototype.addLoopTrack = function(urls){
		
		var newObj;
		this.createDefaultSectionIfNeeded();
		if(!urls){urls = [];}
		this.objects.forEach(function(obj){
			
			if(!obj.addLoopTrack){return}
			newObj = obj.addLoopTrack(urls);
			
			
		});

		this.objects = [newObj];
		return this;
		
	}
	
	
	
	Selection.prototype.addLFO = function(prop, frequency, range, offset, object){

		this.objects.forEach(function(obj){
			
			if(!obj.addLFO){return}
			
			obj.addLFO(prop, frequency, range, offset, object);			
			
		});
		return this;
		
	}
	
	Selection.prototype.addDelay = function(params){

		this.objects.forEach(function(obj){
			
			if(!obj.bus){return}
			
			obj.bus.addSerialDelay(params);			
			
		});
		return this;
		
	}
	
	
	Selection.prototype.addReverb = function(params){
		
		this.objects.forEach(function(obj){
			
			if(!obj.bus){return}
			
			obj.bus.addReverb(params);			
			
		});
		return this;
		
	}
	
	
	
	Selection.prototype.addMotif = function(urls, q, upbeat){
		
		if(typeof urls === "string"){
			urls = [urls];
		}
		this.createDefaultSectionIfNeeded();
		var tags = urlsToTags(urls);
		if(this.objects.length){
			// add sections tags to motif
			tags = mergeArrays(tags, this.objects[0].tags);
		}
		
		
		var targetObj = this.objects.find(function(obj){
			// connect Motif to Section
			return typeof obj.addMotif === "function";			
		}) || defaultInstance;
		
		var params = typeof q == "object" ? q : {};
		params.tags =  params.tags ||??tags;
		params.quantize =  params.quantize ||??q;
		params.upbeat =  params.upbeat ||??upbeat;
		
		var newObj = targetObj.addMotif(params, urls);
		this.objects = [newObj];
		return this;
		
	}
	Selection.prototype.addLeadIn = function(urls, params){
		params = typeof params == "object" ? params : {quantize: "bar", type: "leadIn"}
		this.addMotif(urls, params);
		return this;
	}
	
	Selection.prototype.loadFile = function(urls){
		this.addMotif(urls, "off");
		return this;
	}
	
	
	
	/*
	Selection.prototype.addLeadIn = function(urls){
		
		this.createDefaultSectionIfNeeded();
		var tags = urlsToTags(urls);
		
		var targetObj = this.objects.find(function(obj){
			return typeof obj.addLeadIn === "function";			
		}) || defaultInstance;
		
		var newObj = targetObj.addLeadIn({tags: tags}, urls);
		this.objects = [newObj];
		return this;
		
	}
	*/
	
	
	
	Selection.prototype.solo = function(selector){
		
		this.stop();
		this.find(selector).play();	
		return this;
		
	}

	
	Selection.prototype.play = function(arg1, arg2, arg3){
		
		
		var returnVal = {};
		
		this.objects.forEach(function(obj){

			if(!obj.play){return}
			returnVal.delay = obj.play(arg1, arg2, arg3);

		});
		this.returnVal = returnVal;
		return this;
		
		
	}
	
	Selection.prototype.trig = Selection.prototype.play;
	
	
	Selection.prototype.replay = function(){

		this.objects.forEach(function(obj){

			if(!obj.replay){return}
			return obj.replay();

		});
		return this;
	}
	
	
	Selection.prototype.stop = function(params){
		params = params || {};
		this.objects.forEach(function(obj){

			if(!obj.stop){return}
			
			// to mute other tracks in a group
			if(obj == params.omit){return}
			
			return obj.stop();

		});
		return this;
		
		
	}

	
	Selection.prototype.stopAllSounds = function(){
		this.objects.forEach(function(obj){

			if(!obj.stopAllSounds){return}
						
			obj.stopAllSounds();

		});
		return this;
		
		
	}
	
	
	Selection.prototype.isPlaying = function(){

		var isPlaying = false;
		this.objects.forEach(function(obj){
			var curObjIsPlaying = obj.isPlaying ? obj.isPlaying() : obj.playing;
			isPlaying = isPlaying || curObjIsPlaying;
		});
		return isPlaying;
	}

	Selection.prototype.setActive = function(active){
		
		this.objects.forEach(function(obj){

			if(!obj.setActive){return}
			return obj.setActive(active);

		});
		return this;
			
	}
	Selection.prototype.setOutput = function(output, source){

		
		this.objects.forEach(function(obj){

			if(!obj.bus){return}
			return obj.bus.setOutput(output, source);

		});
		return this;
			
	}


	Selection.prototype.setVolume = function(arg1, arg2){
		
		
		this.objects.forEach(function(obj){

			if(!obj.setVolume){return}
			return obj.setVolume(arg1, arg2);

		});
		return this;
		
		
	}

	Selection.prototype.getVolume = function(){
		
		var vol = -1;
		this.objects.forEach(function(obj){

			if(!obj.getVolume){return -1}
			vol = Math.max(vol, obj.getVolume());

		});
		return vol;
		
	}
	

	Selection.prototype.fade = function(val, delay, duration){
		
		delay = delay || 0;
		duration = duration || 250;
		duration /= 1000;
		this.objects.forEach(function(obj){

			if(!obj.fade){return}
			return obj.fade(val, delay, duration);

		});
		return this;
			
	}
	

	Selection.prototype.fadeIn = function(){
		
		this.objects.forEach(function(obj){

			if(!obj.fadeIn){return}
			return obj.fadeIn();

		});
		return this;
			
	}
	

	Selection.prototype.fadeOut = function(duration, delay){
		
		if(duration){duration = duration / 1000}
		if(delay){delay = delay / 1000}
		
		this.objects.forEach(function(obj){

			if(!obj.fadeOut){return}
			return obj.fadeOut(delay, duration);

		});
		return this;
			
	}
	Selection.prototype.setVariation = function(val, val2){
		
		this.objects.forEach(function(obj){

			if(typeof obj.setVariation === "function"){
				obj.setVariation(val, val2);
			} else {
				obj.variation = val;
			}
			
			

		});
		return this;
			
	}
	Selection.prototype.setActiveVariations = function(activeVariations){
		
		this.objects.forEach(function(obj){

			if(!obj.setActiveVariations){return}
			return obj.setActiveVariations(activeVariations);
			
		});
		return this;
			
	}
	
	Selection.prototype.get = function(param){
		
		var value;
		this.objects.forEach(function(obj){

			if(!obj.get){return}
			value = obj.get(param);
			
		});
		return value;
		
	}
	
	
	Selection.prototype.set = function(param, value, value2){
		
		this.createDefaultSectionIfNeeded();
		
		this.objects.forEach(function(obj){

			if(!obj.set){return}
			return obj.set(param, value, value2);
			
		});
		return this;
		
	}

	Selection.prototype.find = find;
	
	
	Selection.prototype.group = function(){
		
		var thisSelection = this;
		this.objects.forEach(function(obj){
			
			if(obj.groups){
				obj.groups.push(thisSelection);
			}
		});
		return this;
		
	}
	
	
	Selection.prototype.addTrackGroup = function(selection){
		this.objects.forEach(function(obj){
			
			if(obj.addTrackGroup){
				obj.addTrackGroup(selection);
			}
		});
		return this;

	}
	
	
	Selection.prototype.getPosition = function(pos, flags){
		
		var positionObj;
		
		if(!this.objects.length){
			this.objects = [defaultInstance];
		}
		this.objects.forEach(function(obj){
			
			if(obj.getPosition){
				positionObj = obj.getPosition(pos, flags);
			}
		});
		
		return positionObj;
	}
	
	Selection.prototype.on = function(event, fn, delay){
		
		this.objects.forEach(function(obj){
			
			if(obj.eventHandler){
				obj.eventHandler.addEvent(event, fn, delay);
			}
		});
	}
		
	Selection.prototype.update = function(arg1){
		
		this.objects.forEach(function(obj){
			
			if(obj.update){
				obj.update(arg1);
			}
		});
		return this;
	}
	
	
	

	// EVENT HANDLER
	
	var Event = function(fn, delay){
		
		this.fn = fn;
		this.delay = delay || 0;
	}
	
	var EventHandler = function(){
		
		return this;
	}
	
	EventHandler.prototype.addEvent = function(event, fn, delay){
		
		if(typeof fn !== "function"){return}
		this[event] = this[event] ||??[];
		this[event].push( new Event(fn, delay) );
		
	}
	
	EventHandler.prototype.execute = function(event, param1){
		
		var events = this[event];
		if(!events){return}
		
		events.forEach(function(event){
			setTimeout(function(){
				event.fn(param1);
			}, event.delay);
		});
		
	}


	// HELPERS
	
	
	function widthEndingSlash(str){
		return str.substring(str.length-1) == "/" ? str : str + "/";
	}

	function addAudioPath(path, fileName){
		if(fileName.includes("//")){
			return fileName;
		}
		var pathLength = path.length;
		path = path == fileName.substr(0, pathLength) ? "" : widthEndingSlash(path);
		return path + fileName;
	}
	
	function urlToUpbeat(url){
		
		
		var patt = /up-(\d+)/;
		var result = url.match(patt);
		if(!result){
			return 0;
		}
		var nrOfBeats = Number(result.pop()) ||??0;
		
		return this.getBeatDuration() * nrOfBeats;
		
	}

	function urlsToFileNames(urls){
		
		var fileNames = [];
		urls = urls ||??[];
		
		urls.forEach(function(file){
			
			if(typeof file === "object"){
				
				// if part is defined by object with parameters
				if(file.url){
					if(file.url instanceof Array) {
						// if url is array with random alternatives
						var fileNamesFromVariations = urlsToFileNames(file.url);
						fileNames = fileNames.concat(fileNamesFromVariations);
					} else {
						fileNames.push(file.url);
					}
					
				} else if(file instanceof Array) {
					
					// if file is array with random alternatives
					var fileNamesFromVariations = urlsToFileNames(file);
					fileNames = fileNames.concat(fileNamesFromVariations);
				}
				
			} else if (typeof file === "string"){
				fileNames.push(file);
			}
		});
		
		return fileNames;
		
	}
	
	
	function urlsToTags(urls){
		
		var tags = [];
		var allNames = {};
		
		var fileNames = urlsToFileNames(urls);
		
			
		fileNames.forEach(function(str){
			// add full file name
			tags.push(str);
			
			// remove suffix		
			if(str.substr(-4, 1) == "."){		
				str = str.substr(0, str.length-4);		
			}
			
			// remove audioPath
			var lastSlash = str.lastIndexOf("/");
			if(lastSlash != -1){
				str = str.substr(lastSlash+1);
			}
				
			// get tags

			var curTags = str.split("_");
			curTags.forEach(function(curTag){
				allNames[curTag] = allNames[curTag] || 0;
				allNames[curTag]++;
			});
			
			
		});
		
		
		Object.keys(allNames).forEach(function (tag) {
			// add tag when all files share a tag
			if(allNames[tag] == fileNames.length){
				tags.push(tag);
			}

		});
		
		
		/*
		fileNames.forEach(function(str){
			var curTags = str.split("_");
			curTags.forEach(function(curTag){
				tags.push(curTag);
			});
		});
		*/
		
		return tags;
	}
	
	function round(val, decimals){
		decimals = decimals || 2;
		var factor = Math.pow(10, decimals); 
		return Math.floor(val*factor)/factor;
	}

	function setActiveVariations(activeVariations){
		this.parameters.activeVariations = activeVariations;
	}
	
	function getBellCurveY(x, stdD, scale){
		// It returns values along a bell curve from 0 - 1 - 0 with an input of 0 - 1.
		scale = scale || false;
		stdD = stdD || 0.125;
		x = Math.min(1, Math.max(x, 0));
		var mean = 0.5;
		if(scale){
			return  1 / (( 1/( stdD * Math.sqrt(2 * Math.PI) ) ) * Math.pow(Math.E , -1 * Math.pow(x - mean, 2) / (2 * Math.pow(stdD,2))));
		}else{
			return (( 1/( stdD * Math.sqrt(2 * Math.PI) ) ) * Math.pow(Math.E , -1 * Math.pow(x - mean, 2) / (2 * Math.pow(stdD,2)))) * getBellCurveY(0.5, stdD, true);
		}
	}

	function getPosition(pos, flags){

		
		pos = pos ||??this.musicTime || audioContext.currentTime - this.sectionStart || audioContext.currentTime - self.sectionStart;

		obj = {};
		obj.bar = 1;
		obj.beat = 1;
		
		flags = flags ||??{};

		var params = this.parameters;
		var beatDuration = this.getBeatDuration();
		var barDuration = this.getBarDuration();

		switch(typeof pos){

			case "string":
			var delimiter = pos.indexOf(",") != -1 ? "," : ".";			
			pos = pos.split(delimiter);
			if(pos.length){obj.bar = eval(pos[0])};
			if(pos.length > 1){obj.beat = eval(pos[1])};
			obj.time = params.barDuration * (obj.bar-1) + beatDuration * (obj.beat-1);
			break;

			case "number":
			switch(flags.roundTo){
				
				case "bar":
				pos = pos + barDuration / 2;
				break;
				
				case "beat":
				pos = pos + beatDuration / 2;
				break;
				
				default:
				break;
			}
			var bar = Math.floor(pos / barDuration);
			obj.beat = Math.floor(pos / beatDuration) % params.timeSign.nominator + 1;
			obj.bar = bar + 1;
			
			obj.time = pos;
			break;


		}

		return obj;

	}
	
	
	function onEvent(event, fn, delay){
		
		this.eventHandler = this.eventHandler || new EventHandler();
		this.eventHandler.addEvent(event, fn, delay);		
	}
	
	
	
	function getBeatDuration (params){
		params = params || this.parameters;
		return 60.0 / params.tempo;
	}
	
	function getBarDuration(params){
		params = params || this.parameters;
		var beatDuration = getBeatDuration(params);
		return beatDuration * params.timeSign.nominator;
	}
	
	function setActive(activeVal){

		var ar = this.parameters.activeRange;

		if(activeVal < 0) {

			// predefined passive val
			this.active = activeVal;

		} else if(activeVal >= ar.min && activeVal <= ar.max) {

			var range = ar.max - ar.min;
			var valInRange = activeVal - ar.min;

			var valueRange = ar.maxVal - ar.minVal;

			if(range == 0){
				this.active = ar.maxVal;
			} else {
				this.active = ar.minVal + valInRange / range * valueRange;
			}

		} else {
			this.active = 0;
		}
		
		
		if(this.parameters.fadeTime){
			var vol = this.active > 0 ? 1 : 0;
			this.setVolume(vol, true);
		}

	}

		
	function getTime(time){
		
		var timeSign = (this.parameters || defaultParams).timeSign;
		var tempo = (this.parameters || defaultParams).tempo;

		if(!timeSign){
			console.log(timeSign);
		}
		if(typeof time === "undefined"){
			
			time = audioContext.currentTime - (self.sectionStart || defaultInstance.sectionStart);
		} else if(typeof time === "string"){
			// if specified by "bar/beat"
			var posArr = time.split("/");
			if(posArr.length < 1){
				posArr = [0,timeSign.denominator];
			} else if(posArr.length < 2) {
				posArr[1] = timeSign.denominator;
			}
			
			var beat = posArr[0] * timeSign.denominator / posArr[1];
			time = beat * 60 / tempo;
			
		}
		time = time || 0;
		return time;
	}

	function inArray(needle, haystack){
		
		if(typeof haystack !== "object"){
			
			console.log("no haystack");
		}
		
		var needles = needle.split(" ");
		var matches = 0;
		
		needles.forEach(function(needle){
			
			var matchPattern = needle.substr(0, 1) == "*";
			if(matchPattern){
				needle = needle.substr(1);
			}
			
			
			
			haystack.forEach(function(str){
				if(matchPattern){
					if(str.substr(str.length-needle.length) == needle){
						matches++;
					}
				} else {
					if(str == needle){
						matches++;
					}
				}
			});

		});

		
		return matches >= needles.length;
	}
	
	
	function mergeArrays(targetArray, sourceArray){
		
		sourceArray.forEach(function(val){
			if(!inArray(val, targetArray)){
				targetArray.push(val);
			}
		});
		
		return targetArray;
	}
	
	
	function findAndReplace(originalString, needle, rplc){
		
		// remove init char if # or .
		var firstChar = needle.substr(0, 1);
		if(firstChar == "#" ||??firstChar == "."){
			needle = needle.substr(1);
		}
		
		
		var matchPattern = needle.substr(0, 1) == "*";
		if(matchPattern){
			needle = needle.substr(1);
			rplc = rplc.substr(1);
			return originalString.replace(needle, rplc);
		} else {
			return originalString;
		}
	}
	


	function initParameters(values, inheritedValues){

		// values = Object.create(values);
		inheritedValues = typeof inheritedValues === "undefined" ? {} : (JSON.parse(JSON.stringify(inheritedValues)));
		
		// overwrite with local values
		if(typeof values === "object"){
			values = (JSON.parse(JSON.stringify(values)));
			for(attr in values){
				inheritedValues[attr] = values[attr];
			}
		}
		

		this.addDefaultParameters(inheritedValues);

		return inheritedValues;

	}
	
	
	
	var defaultParams = {};
	defaultParams.volume = 1;
	defaultParams.pan = 0.5;
	defaultParams.tempo = 120;
	defaultParams.audioPath = "audio";
	defaultParams.upbeat = 0;
	defaultParams.partLength = "1/1";
	defaultParams.timeSign = {nominator: 4, denominator: 4};
	defaultParams.fadeTime = 0.01;
	defaultParams.offset = 0;
	defaultParams.suffix = "mp3";
	defaultParams.loopActive = 1;
	defaultParams.activeRange = {};
	defaultParams.activeRange.min = 0;
	defaultParams.activeRange.max = 1;
	defaultParams.activeRange.minVal = 0;
	defaultParams.activeRange.maxVal = 1;
	defaultParams.blockRetrig = 0;
	defaultParams.repeat = 1;
	defaultParams.retrig = "shuffle";
	defaultParams.release = 0;
	
	
	
	defaultParams.quantize = "1/1";

	function addDefaultParameters(params){
		

		params.volume = params.volume ||??defaultParams.volume;
		params.pan = typeof params.pan === "number" ? params.pan :??defaultParams.pan;
		params.tempo = params.tempo || defaultParams.tempo;
		params.timeSign = getTimeSign(params.timeSign || defaultParams.timeSign);
		params.upbeat = params.upbeat || defaultParams.upbeat;
		params.quantize = params.quantize || defaultParams.quantize;
		params.fadeTime = typeof params.fadeTime === "undefined" ? defaultParams.fadeTime : params.fadeTime;
		params.partLength = params.partLength || defaultParams.partLength;
		params.retrig = params.retrig || defaultParams.retrig;
		params.release = params.release || defaultParams.release;
		
		params.externalOffset = params.offset || defaultParams.offset;
		params.creationTime = params.creationTime  || new Date().getTime();
		params.suffix = params.suffix || defaultParams.suffix;

		params.audioPath = params.audioPath || defaultParams.audioPath;
		params.loopActive = typeof params.loopActive === "number" ? params.loopActive : defaultParams.loopActive; 

		params.activeRange = params.activeRange || defaultParams.activeRange;
		params.activeRange.min = params.activeRange.min || defaultParams.activeRange.min;
		params.activeRange.max = params.activeRange.max || defaultParams.activeRange.max;
		params.activeRange.minVal = typeof params.activeRange.minVal === "undefined" ? defaultParams.activeRange.minVal : params.activeRange.minVal;
		params.activeRange.maxVal = typeof params.activeRange.maxVal === "undefined" ? defaultParams.activeRange.maxVal : params.activeRange.maxVal;
		

	}
	
	function fade(val, delay, duration, callBack){

		//if(!this.playing){return;}
		var myObj = this;
		delay = delay || 0;
		
		if(typeof duration === "undefined"){
			duration = this.parameters.fadeTime ||??0.25;
		}
		
		
		var gainNode = this.bus.output;
		
		var fadeEndTime = audioContext.currentTime+delay+duration;
		var fadeStartTime = fadeEndTime-duration;		
		var oldVolume = gainNode.gain.value;
		
		if(this.parameters){
			var defaultVal = this.parameters.volume;
		}
		// user either defined value, stored value or 1
		val = (typeof val === "undefined") ? (defaultVal || 1) : val;
		val = Math.max(val, 0);

		//val = Math.max(val, 0.00000000000001);
		
		gainNode.gain.cancelScheduledValues(0);
		gainNode.gain.setValueAtTime(oldVolume, fadeStartTime);
		//gainNode.gain.exponentialRampToValueAtTime(val, fadeEndTime);
		gainNode.gain.linearRampToValueAtTime(val, fadeEndTime);
		
		if(typeof callBack === "function"){
			setTimeout(callBack, (delay+duration)*1000);
		}
		
		
	}
	
	
	function fadeAudioNode(node, from, to, delay){
		
		node.gain.cancelScheduledValues(0);
		node.gain.setValueAtTime(from, 0);
		//node.gain.exponentialRampToValueAtTime(to, audioContext.currentTime+delay);
		node.gain.linearRampToValueAtTime(to, audioContext.currentTime+delay);
		
	}
	
	function fadeIn(delay, duration){
		
		this.fade(this.parameters.volume, delay, duration);
	}
	
	function fadeOut(delay, duration){
		
		this.fade(0, delay, duration);
	}
	
	function get(param){
		
		var targetParams = this.parameters;
		switch(param){
			
			case "bus":
			return this.bus;
			break;
			
			default:
			return targetParams[param];
			break;
			
			
		}
	}
	
	function set(param, value, value2){
		
		var targetParams = this.parameters || defaultInstance.parameters;
		
		switch(param){
			
			case "volume":
			if(this.setVolume){
				this.setVolume(value);
			}
			break;
			
			case "timeSign":
			value = getTimeSign(value);
			break;
			
			case "loopEnd":
			console.log(value);
			break;
			
			
			case "partLength":
			if(typeof value === "number"){
				value /= 1000;
			}
			if(this.setPartLength){
				this.setPartLength(value);
			}
			break;
			
			case "repeat":
			if(this.setRepeat){
				this.setRepeat(value);	
			}
			break;
			
			case "upbeat":
			if(typeof value === "number"){
				value /= 1000;
			}
			if(this.setUpbeat){
				this.setUpbeat(value);
			}
			break;
			
			case "active":
			if(this.setActive){
				this.setActive(value);
			}
			break;
			
			
			case "fadeTime":
			value /= 1000;
			break;
			
			case "tags":
			if(typeof value === "string"){
				value = value.split(" ");
			}
			targetParams = this;
			break;
			
			
			case "blockRetrig":
			if(typeof value === "string"){
				value = (this.getTime ||??getTime)(value);
			} else {
				value /= 1000;
			}
			break;
			
			
			case "release":
			value /= 1000;
			break;
			
			case "tempo":
			if(this.setTempo){
				this.setTempo(value);
			}
			break;
			
			
			case "variation":
			if(this.setVariation){
				this.setVariation(value, value2);
			}
			break;
			
			case "output":
			if(this.bus){
				this.bus.setOutput(value, value2);
			}
			break;
			
			case "pan":
			if(this.bus){
				value2 = value2 || 1;
				this.bus.animate("pan", value, value2/1000);
			}
			break;
			
			default:
			break;
		}
		
		targetParams[param] = value;
		return value;
	}
	
	
		
	

	var masterBus = new Bus();
	masterBus.output.channelCount = maxChannelCount;

	iMus.master = masterBus;
	
	iMus.audioContext = audioContext;
	iMus.instances = [];
	iMus.setOffset = function(offset){


		var nextTime;
		for(var i=0; i<this.instances.length; i++){
			console.log("diff - " + new Date() + " : " + i);
			var curInstance = this.instances[i];
			nextTime = curInstance.setOffset(offset);
		}

		console.log("nextTime: " + nextTime);

	}


	
	
	iMus.set = function(param, val){
		var sectionID = defaultInstance.sections.length - 1;
		val = defaultInstance.sections[sectionID].set(param, val);
		defaultInstance.parameters[param] = val;
		defaultParams[param] = val;
	}
	
	
	
	iMus.play = function(selector, options, arg2, arg3){
		// play objects matched by selector or play defaultInstance
		selector = selector ||??"default";
		var selection = new Selection(selector, defaultInstance);
		return selection.play(options, arg2, arg3);
		
	}
	
	iMus.stop = function(selector){
		// stop objects matched by selector or play defaultInstance
		
		if(selector){
			var selection = new Selection(selector, defaultInstance);
			selection.stopAllSounds();
		} else {
			defaultInstance.currentSection.stopAllSounds();
		}
		
		defaultInstance.currentSection = null;
		
	}
	
	iMus.isPlaying = function(){
		var isPlaying = false;
		this.instances.forEach(function(instance){
			isPlaying = instance.playing || isPlaying;
		});
		return isPlaying;
	}
	
	
	iMus.setInterval = function(fn, interval, offset, counter){
		counter = counter || -1;
		return defaultInstance.on(interval, fn, offset, counter);
	}
	
	
	iMus.setTimeout = function(fn, interval, offset){
		return defaultInstance.on(interval, fn, offset, 1);
	}
	
	iMus.getPosition = function(pos, flags){
		return defaultInstance.getPosition(pos, flags);
	}
	
	iMus.clearTimeouts = function(){
		
		while(defaultInstance.intervalIDs.length){
			var intervalID = defaultInstance.intervalIDs.pop();
			clearTimeout(intervalID);
		}
		
	}
	
	iMus.getDefaultInstance = function(){
		return defaultInstance;
	}
	
	iMus.fade = function(val, delay, duration){
		defaultInstance.fade(val, delay, duration);
	}
	
	iMus.fadeIn = function(delay, duration){
		defaultInstance.fadeIn(delay, duration);
	}
	
	iMus.fadeOut = function(delay, duration){
		defaultInstance.fadeOut(delay, duration);
	}
	
	
	iMus.createBus = function(){
		return defaultInstance.getBus();
	};	

	audioContext.createBufferSource(); //??
	window.audioContext = audioContext;
	
	
	iMus.addLoopTrack = function(urls){
		return iMus(defaultSectionName).addLoopTrack(urls);
	}
	
	iMus.addTrackGroup = function(selection){
		return iMus(defaultSectionName).addTrackGroup(selection);
	}
	
	
	iMus.addMotif = function(urls, q, upbeat){
		return iMus.getDefaultInstance().addMotif(urls, q, upbeat);
		//return iMus(defaultSectionName).addMotif(urls, q, upbeat);
	}
	iMus.loadFile = function(urls){
		return iMus(defaultSectionName).addMotif(urls, "off");
	}
	
	iMus.addLeadIn = iMus.addMotif;
	iMus.addStingerTrack = iMus.addMotif;
	
	
	if(window.module){
		// support nodeJS
		module.exports = iMus;
	} else {
		// stand alone
		window.iMus = iMus;
		window.iMusic = iMus;
		//iMus.instances.push(defaultInstance);
	}
	
	var defaultInstance = new iMus();
	defaultInstance.addSection({tags: defaultSectionName});
	iMus.addSection = defaultInstance.addSection;
	
	
	
	iMus.variations = {};
	
	iMus.setVariation = function(groupID, val){
		iMus.variations[groupID] = val;
	}
	
	iMus.getVariation = function(groupID){
		var val = iMus.variations[groupID];
		if(!val){val = 0};
		val = Math.min(val, Math.max(val, 0));
		return val;
	}
	
	
	setInterval(function(){
		//console.log("musicalStart", round(defaultInstance.sectionStart));
	}, 1000);
	
	
	iMus.onload = function(){};
			
}(window.jQuery));




/*

To do:



Add support for preSection and postSection


Establish a params-property for all objects that is easily inherited and overwrited with local parameters

Try to merge Part/Motif/SFX (at least the Motif/SFX. SFX ought to be a Motif with quantize set to "off")



Implement channelSplitter and channelMerger into Bus

Make sure a masterbus is always working in multi channel mode.

Clean up the addSection, addStem, createParts - structure

remove parts from Track.playingParts when they stop playing.


Check the Action object. Does it work?

playSound triggers a setTimeout if length is typeof "number". This makes it possible to retrigg before tail but
also makes parts longer than default partLength retrig before finished.

Delay: Skapa m??jlighet att skicka studsar till utg??ngar i en viss ordning



BUGS:
Loopade Motifs loopar inte i evighet. Kolla rad 507. me.playing blir false. Vad f??r det f??r konsekvenser att
ta bort kollen f??r -1-loopar.


getTime() - kolla igenom alla st??llen den anv??nds. Hur ska den relatera till audiocontext.currentTime och self.sectionStart?
NU ??r det f??rvirring och det st??r t.ex. getNextLegalBreak()









DONE:

OK Inf??r events som triggas av olika musikaliska h??ndelser. Bar, beat etc
PROBLEM: 1925 krock mellan self och default
Reducera getPosition()
Byt ut classes till tags. Make sure Selection.find() works with multiple tags.
Skapa slumpgrupper
LegalBreakPoints verkar inte funka exakt som jag t??nkt (men fixa multipla)
setInterval slutar efter ett tag (n??r man byter section?)
Work through inheritence of parameters
Motif slumpar inte totalt. Splice-funktionen fungerar inte eftersom url-listan sorteras om hela tiden.
fadeTime-tracks kickar inte ig??ng mitt i en loop

Fixa klart Motifs s?? att de knyts till en Section och att Quantize-v??rdet sitter i Motif.parameters
G??r set tempo och set timeSign s??ker s?? att det g??r att byta f??r en viss section
St??da upp mellan musicalStart och sectionStart



*/

/*

Jonas ideas:

Add possibility to loop part for a certain number of times within a track


g??r partposition oberoende av beatDuration etc. 

*/