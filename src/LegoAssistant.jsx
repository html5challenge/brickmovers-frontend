import React, { useEffect, useRef } from "react";

  
function LegoAssistant() {
  const audioRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const backgroundCanvasRef = useRef(null);

  useEffect(() => {
    let audioContext, analyser, dataArray, recorder, interval;
    
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 4096;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      recorder = new MediaRecorder(stream);

    //   recorder.addEventListener("dataavailable", onRecordingReady);

      interval = setInterval(() => {
        analyser.getByteTimeDomainData(dataArray);
        drawWaveform();
      }, 100);
    });


    // function onRecordingReady(e) {
    //   const data = e.data;
    //   audioRef.current.src = URL.createObjectURL(data);
    //   audioRef.current.play();
    // }

    function drawWaveform() {
      const waveformCanvas = waveformCanvasRef.current;
      const waveformContext = waveformCanvas.getContext("2d");


      waveformContext.clearRect(
        0,
        0,
        waveformCanvas.width,
        waveformCanvas.height
      );
      waveformCanvas.width = 800;
      waveformContext.lineWidth = 2;
      waveformContext.strokeStyle = "#2196F3";
      waveformContext.beginPath();

      let sliceWidth = (waveformCanvas.width * 2.0) / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        let v = dataArray[i] / 128.0;
        let y = (v * waveformCanvas.height) / 2;

        if (i === 0) {
          waveformContext.moveTo(x, y);
        } else {
          waveformContext.lineTo(x, y);
        }

        x += sliceWidth;
      }

      waveformContext.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
      waveformContext.stroke();
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
     {/* <canvas id="background" ref={backgroundCanvasRef}></canvas> */}
      <div className="row">
        <div className="col s12 m6 offset-m3">
          <div className="card">
            <div className="card-content flex justify-center">
              <canvas id="waveformCanvas" width="300" height="100" ref={waveformCanvasRef}></canvas>
              {/* <audio id="audio" controls></audio> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LegoAssistant;
