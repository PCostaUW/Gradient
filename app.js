function addCustomSpectrum() {
    const start = document.getElementById("custom-start").value.trim();
    const end = document.getElementById("custom-end").value.trim();
    if (!start || !end) return alert("Both ends required");
  
    const newSpectrum = { start, end };
    db.ref(`rooms/${roomId}/customSpectrums`).push(newSpectrum);
  }
  
  async function createOrJoinRoom() {
    roomId = document.getElementById("room-id").value.trim();
    if (!roomId) return alert("Enter a room name");
  
    document.getElementById("room-section").style.display = "none";
    document.getElementById("game-section").style.display = "block";
  
    const spectrumData = await fetch('spectrums.json').then(res => res.json());
    const defaultSpectrums = spectrumData.spectrums;
  
    // Fetch any custom spectrums added to the room
    const customSnap = await db.ref(`rooms/${roomId}/customSpectrums`).once("value");
    const customSpectrums = customSnap.exists() ? Object.values(customSnap.val()) : [];
  
    const allSpectrums = [...defaultSpectrums, ...customSpectrums];
  
    const spectrum = allSpectrums[Math.floor(Math.random() * allSpectrums.length)];
    const clueWord = prompt(`Enter a clue word for: ${spectrum.start} ←→ ${spectrum.end}`);
    const trueValue = Math.floor(Math.random() * 101);
  
    const gameRef = db.ref(`rooms/${roomId}`);
  
    gameRef.child("state").set({
      spectrum,
      clue: clueWord,
      value: trueValue
    });
  
    gameRef.child("players").child(playerId).set({
      score: 0,
      guess: null
    });
  
    gameRef.child("state").on("value", snap => {
      const state = snap.val();
      if (!state) return;
      document.getElementById("spectrum-label").textContent = `${state.spectrum.start} ←→ ${state.spectrum.end}`;
      document.getElementById("clue-label").textContent = `Clue: ${state.clue}`;
    });
  }
  