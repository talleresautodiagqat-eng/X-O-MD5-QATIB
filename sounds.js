/* XO MD5 QATIB — Motor de música y efectos */
(function(){
  "use strict";

  let ctx = null;
  let master = null;
  let musicGain = null;
  let musicTimer = null;
  let switchTimer = null;
  let trackIndex = 0;
  let step = 0;
  let playing = false;
  let volume = 0.16;

  const tracks = [
    {
      name:"NEON DRIVE",
      tempo:92,
      notes:[220,277.18,329.63,415.30,329.63,277.18,246.94,329.63],
      bass:[110,138.59,164.81,207.65]
    },
    {
      name:"CYBER PULSE",
      tempo:104,
      notes:[261.63,329.63,392.00,523.25,392.00,329.63,293.66,392.00],
      bass:[130.81,164.81,196.00,261.63]
    },
    {
      name:"GALAXY NIGHT",
      tempo:88,
      notes:[196.00,246.94,293.66,369.99,440.00,369.99,293.66,246.94],
      bass:[98,123.47,146.83,184.99]
    },
    {
      name:"ROYAL ARCADE",
      tempo:110,
      notes:[293.66,369.99,440.00,587.33,523.25,440.00,369.99,329.63],
      bass:[146.83,184.99,220,293.66]
    }
  ];

  function audio(){
    if(!ctx){
      const C = window.AudioContext || window.webkitAudioContext;
      if(!C) return null;
      ctx = new C();
      master = ctx.createGain();
      musicGain = ctx.createGain();
      master.gain.value = 0.9;
      musicGain.gain.value = volume;
      musicGain.connect(master);
      master.connect(ctx.destination);
    }
    if(ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq,duration,type="sine",gain=0.05,when,output){
    const c=audio();
    if(!c) return;
    const start=when ?? c.currentTime;
    const osc=c.createOscillator();
    const g=c.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(freq,start);
    g.gain.setValueAtTime(0.0001,start);
    g.gain.exponentialRampToValueAtTime(Math.max(gain,0.001),start+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,start+duration);
    osc.connect(g);
    g.connect(output || master);
    osc.start(start);
    osc.stop(start+duration+0.03);
  }

  function musicTick(){
    if(!playing) return;
    const c=audio();
    if(!c) return;

    const t=tracks[trackIndex];
    const note=t.notes[step % t.notes.length];
    const bass=t.bass[step % t.bass.length];

    tone(note,0.42,"triangle",0.050,c.currentTime,musicGain);
    tone(note*2,0.18,"sine",0.014,c.currentTime+0.18,musicGain);
    tone(bass,0.50,"sine",0.032,c.currentTime,musicGain);

    if(step % 4 === 0){
      tone(note/2,0.65,"sine",0.018,c.currentTime,musicGain);
    }

    step++;
    const interval=60000/t.tempo/2;
    musicTimer=setTimeout(musicTick,interval);
  }

  function scheduleSwitch(){
    clearTimeout(switchTimer);
    switchTimer=setTimeout(()=>{
      if(!playing) return;
      nextTrack(true);
    },32000);
  }

  function playTrack(index,announce){
    audio();
    if(!ctx) return;
    trackIndex=(index+tracks.length)%tracks.length;
    step=0;
    playing=true;
    clearTimeout(musicTimer);
    musicTick();
    scheduleSwitch();

    if(typeof window.updateMusicPanel==="function"){
      window.updateMusicPanel();
    }
    if(announce && typeof window.showMusicNotice==="function"){
      window.showMusicNotice("🎵 "+tracks[trackIndex].name);
    }
  }

  function startMusic(){
    playTrack(trackIndex,false);
  }

  function stopMusic(){
    playing=false;
    clearTimeout(musicTimer);
    clearTimeout(switchTimer);
    musicTimer=null;
    switchTimer=null;
    if(typeof window.updateMusicPanel==="function") window.updateMusicPanel();
  }

  function nextTrack(auto=false){
    playTrack(trackIndex+1,!auto);
  }

  function previousTrack(){
    playTrack(trackIndex-1,true);
  }

  function setVolume(v){
    volume=Math.max(0,Math.min(0.30,Number(v)));
    if(musicGain) musicGain.gain.value=volume;
  }

  window.startBackgroundMusic=startMusic;
  window.stopBackgroundMusic=stopMusic;
  window.nextMusicTrack=nextTrack;
  window.previousMusicTrack=previousTrack;
  window.setGameMusicVolume=setVolume;

  window.playMoveSound=function(player){
    const c=audio();
    if(!c) return;
    const now=c.currentTime;
    if(player==="X"){
      tone(520,.10,"sine",.10,now);
      tone(780,.09,"triangle",.055,now+.055);
    }else{
      tone(300,.12,"triangle",.10,now);
      tone(225,.10,"sine",.055,now+.055);
    }
  };

  window.playWinSound=function(player){
    const c=audio();
    if(!c) return;
    const now=c.currentTime;

    /* Fanfarria larga de celebración */
    const melody=player==="X"
      ? [523.25,659.25,783.99,1046.50,1318.51,1567.98,2093.00]
      : [392.00,493.88,587.33,783.99,987.77,1174.66,1567.98];

    melody.forEach((f,i)=>{
      tone(f,.48,i%3===0?"sine":"triangle",i===6?.16:.095,now+i*.30);
      if(i>1) tone(f/2,.52,"sine",.035,now+i*.30);
    });

    tone(melody[0]/2,1.4,"sine",.045,now);
    tone(melody[3]/2,1.3,"triangle",.040,now+.9);

    /* Segunda frase */
    const end=now+2.25;
    [783.99,987.77,1174.66,1567.98,2093.00].forEach((f,i)=>{
      tone(f,.42,"triangle",.075,end+i*.25);
    });

    /* Acorde final */
    const finalTime=end+1.35;
    [523.25,659.25,783.99,1046.50].forEach(f=>{
      tone(f,1.7,"sine",.055,finalTime);
    });

    if(typeof window.showMusicNotice==="function"){
      window.showMusicNotice("🏆 ¡VICTORIA! • ¡ENHORABUENA!");
    }
  };

  window.playDrawSound=function(){
    const c=audio();
    if(!c) return;
    const now=c.currentTime;
    tone(330,.25,"sine",.07,now);
    tone(277.18,.30,"sine",.055,now+.18);
    tone(246.94,.42,"triangle",.045,now+.38);
  };

  window.toggleGameSound=function(){
    const c=audio();
    if(!c) return;

    const enabled = !window.gameSoundEnabled;
    window.gameSoundEnabled=enabled;

    if(enabled){
      startMusic();
      tone(660,.12,"sine",.07);
    }else{
      stopMusic();
    }

    if(typeof window.updateSoundButton==="function"){
      window.updateSoundButton();
    }
  };

  window.gameSoundEnabled=true;
  window.getCurrentMusicName=function(){ return tracks[trackIndex].name; };
  window.isMusicPlaying=function(){ return playing; };

  document.addEventListener("DOMContentLoaded",()=>{
    if(typeof window.updateMusicPanel==="function") window.updateMusicPanel();
    if(typeof window.updateSoundButton==="function") window.updateSoundButton();
  });
})();
