import React, { useEffect, useRef } from "react";

class Effect {
    constructor(canvasWidth, canvasHeight) {
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      this.fontSize = 25;
      this.columns = this.canvasWidth / this.fontSize;
      this.symbols = [];
      this.initialize();
    }
    initialize() {
      for (let i = 0; i < this.columns; i++) {
        this.symbols[i] = new Symbol(i, 0, this.fontSize, this.canvasHeight);
      }
    }
    resize(width, height) {
      this.canvasWidth = width;
      this.canvasHeight = height;
      this.columsn = this.canvasWidth / this.fontSize;
    }
  }
  
function LegoAssistant() {
  const audioRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const backgroundCanvasRef = useRef(null);

  useEffect(() => {
    let audioContext, analyser, dataArray, recorder, interval;
    // const backgroundCanvas = backgroundCanvasRef.current;
    // const backgroundContext = backgroundCanvas.getContext("2d");
    // backgroundCanvas.width = window.innerWidth;
    // backgroundCanvas.height = window.innerHeight;

    // let effect = null;
    
    // let gradient = backgroundContext.createLinearGradient(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    // gradient.addColorStop(0, "red");
    // gradient.addColorStop(0.2, "yellow");
    // gradient.addColorStop(0.4, "green");
    // gradient.addColorStop(0.6, "cyan");
    // gradient.addColorStop(0.8, "blue");
    // gradient.addColorStop(1, "magenta");
  
    // window.addEventListener("resize", (event) => {
    //   backgroundCanvas.width = event.target.window.innerWidth;
    //   backgroundCanvas.height = event.target.window.innerHeight;
    //   effect = new Effect(backgroundCanvas.width, backgroundCanvas.height);
    // });
    
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 2048;
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
            <h3 className="center-align">Brick Movers</h3>
            <div className="card-content">
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
