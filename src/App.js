import logo from "./logo.svg";
import "./App.css";
import React, { useState } from "react";
import resampler from "audio-resampler";
import "./RecordButton.css"; // Import the CSS file
import LegoAssistant from "./LegoAssistant";
import useTypewriter from 'react-typewriter-hook';


let recorder = null;
let context = null,
  inputData = [],
  size = 0,
  audioInput = null;

let commands = [];
let characteristic;

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [buttonSize, setButtonSize] = useState(100);
  const [responseText, setResponseText] = useState("");
  const handleTyping = useTypewriter(responseText);


  let mediaRecorder;
  let recordedChunks = [];

  var oututSampleBits = 16; // 输出采样数位

  function resampleAudio(audioBuffer, targetSampleRate) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const oldSampleRate = audioBuffer.sampleRate;
    const oldLength = audioBuffer.length;
    const newLength = (oldLength * targetSampleRate) / oldSampleRate;
    const offlineContext = new OfflineAudioContext(
      numberOfChannels,
      newLength,
      targetSampleRate
    );

    // Create a buffer source from the existing audio buffer.
    const bufferSource = offlineContext.createBufferSource();
    bufferSource.buffer = audioBuffer;

    // Connect the source to the offline context and start it.
    bufferSource.connect(offlineContext.destination);
    bufferSource.start();

    // Render the audio and return the resulting buffer.
    return offlineContext.startRendering();
  }

  // 数据简单处理
  function decompress(audioBuffer) {
    // Get the PCM data from the audio buffer
    let inputData = audioBuffer.getChannelData(0);
    return inputData;
  }

  function encodePCM(audioBuffer) {
    let bytes = decompress(audioBuffer),
      sampleBits = oututSampleBits,
      offset = 0,
      dataLength = bytes.length * (sampleBits / 8),
      buffer = new ArrayBuffer(dataLength),
      data = new DataView(buffer);

    // 写入采样数据
    if (sampleBits === 8) {
      for (var i = 0; i < bytes.length; i++, offset++) {
        var s = Math.max(-1, Math.min(1, bytes[i]));
        var val = s < 0 ? s * 128 : s * 127;
        val = parseInt(val + 128);
        data.setInt8(offset, val, true);
      }
    } else {
      for (var i = 0; i < bytes.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, bytes[i]));
        data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
    }

    return data;
  }

  const handleRecord = () => {
    setResponseText("Hearing...");
    context = new (window.AudioContext || window.webkitAudioContext)();
    // 清空数据
    inputData = [];
    // 录音节点
    recorder = context.createScriptProcessor(4096, 1, 1);

    recorder.onaudioprocess = function (e) {
      // getChannelData返回Float32Array类型的pcm数据
      var data = e.inputBuffer.getChannelData(0);

      inputData.push(new Float32Array(data));
      size += data.length;
    };

    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then((stream) => {
        audioInput = context.createMediaStreamSource(stream);
      })
      .catch((err) => {
        console.log("error");
      })
      .then(function () {
        audioInput.connect(recorder);
        recorder.connect(context.destination);
      });
  };

  const handleStop = () => {
    recorder.disconnect();

    // Convert inputData to AudioBuffer
    let audioBuffer = context.createBuffer(1, size, context.sampleRate);
    let channelData = audioBuffer.getChannelData(0);
    let offset = 0;
    for (let i = 0; i < inputData.length; i++) {
      channelData.set(inputData[i], offset);
      offset += inputData[i].length;
    }

    // Resample to 16kHz
    resampleAudio(audioBuffer, 16000).then((resampledAudioBuffer) => {
      // Now you have an AudioBuffer resampled at 16kHz
      // You can pass it to your encodePCM function
      let pcmData = encodePCM(resampledAudioBuffer);
      console.log(pcmData);
      let pcmBlob = new Blob([pcmData], { type: "audio/wav" });

      // Send the pcm data to the server
      const formData = new FormData();
      formData.append("voicefile", pcmBlob, "audio.wav");

      // let url = URL.createObjectURL(pcmBlob);
      // // Create a link and click it to start download
      // let a = document.createElement("a");
      // a.href = url;
      // a.download = "audio.wav";
      // a.click();
      fetch(
        "https://hackathon.xxsite.fun/api/v1/VoiceRecognition/%7Bvoicefile%7D",
        {
          method: "POST",
          body: formData,
        }
      )
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          const numbers = data.match(/\d+/g);
          const mappedNumbers = numbers ? numbers.map(Number) : [];
          console.log(mappedNumbers)
          setResponseText(data);
          if(mappedNumbers.length > 0){
            setPeople(mappedNumbers[0]);
            startDealCard();
            console.log(commands)
          }
        })
        .catch((error) => console.error("Error:", error));
    });
  };

  const handleButtonClick = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setButtonSize(100);
      handleStop();
    } else {
      // Start recording
      setIsRecording(true);
      setButtonSize(150);
      handleRecord();
    }
  };

/**
 * 蓝牙连接
 */
  function addCommand(commandName, parameters) {
      commands = [{ name: commandName, parameters: !parameters ? {} : parameters }, ...commands];
  }
  const handleConnect = async() => {
    const serviceUUID = 'c5f50001-8280-46da-89f4-6d8051e4aeef';
    const device = await navigator.bluetooth.requestDevice({
        filters: [{
            services: [serviceUUID]
        }]
    });

    device.addEventListener("gattserverdisconnected", e => {
        console.error("disconnection");
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(serviceUUID);
    characteristic = await service.getCharacteristic('c5f50002-8280-46da-89f4-6d8051e4aeef');

    characteristic.addEventListener("characteristicvaluechanged", async e => {
        const message = new TextDecoder().decode(e.target.value.buffer);
        console.info("received: " + message);
        if (message.endsWith("rdy") && commands.length > 0) {
            var command = commands.pop();
            var commandStr = command.name + "|" + JSON.stringify(command.parameters) + "\n";

            console.info("send command: " + commandStr);

            var data = new Uint8Array([6, ...new Uint8Array(new TextEncoder().encode(commandStr))]);
            await characteristic.writeValueWithResponse(data);
        }
    });
    characteristic.startNotifications();
  }


  const setPeople = (people) => {
    addCommand("set_people", {
      people: parseInt(people)
    })
  }

  const startDealCard = () => {
    addCommand("start")
  }

  const stopDealCard = () => {
    addCommand("stop")
  }

  return (
    <div className="App">
      <div className="flex flex-col">
        <div>
          <div className="bg-[#0f0f0f] text-white h-screen p-4 flex flex-col items-center justify-center space-y-8">
            <h1 className="text-4xl font-bold">Brick Movers</h1>
            <LegoAssistant />
            <div>{handleTyping}</div>
            <button
              className={`record-button bg-gradient-to-r from-purple-400 to-blue-500 font-bold ${
                isRecording ? "recording" : ""
              }`}
              onClick={handleButtonClick}
              style={{
                width: `${buttonSize}px`,
                height: `${buttonSize}px`,
                display: "block",
              }}
            >
              {isRecording ? "Stop" : "Record"}
            </button>
            <div className="flex space-x-4">
              <button
                className="bg-green-600 hover:bg-green-700 focus:ring focus:ring-green-300 rounded p-2"
                variant="default"
                onClick={handleConnect}
              >
                Connect LEGO Spike Prime Hub
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 focus:ring focus:ring-blue-300 rounded p-2"
                variant="default"
                onClick={startDealCard}
              >
                Start Play
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 focus:ring focus:ring-red-300 rounded p-2"
                variant="destructive"
                onClick={stopDealCard}
              >
                Stop Play
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
