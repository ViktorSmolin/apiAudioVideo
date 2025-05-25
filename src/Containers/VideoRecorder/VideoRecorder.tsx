import { useRef, useState } from "react";
import {
  RecordingState,
  type ErrorType,
  type MediaStreamType,
} from "./types";

import styles from "./VideoRecorder.module.css";

function VideoRecorder() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>(
    RecordingState.Idle
  );
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStreamType>(null);
  const [error, setError] = useState<ErrorType>(null);

  // Запуск камеры
  const startCamera = async (): Promise<void> => {
    try {
      const mediaStream: MediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(mediaStream);
      setError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Ошибка доступа к камере:", error);
      setError("Не удалось получить доступ к камере. Проверьте настройки.");
    }
  };

  // Остановка камеры
  const stopCamera = (): void => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Начало записи
  const startRecording = (): void => {
    if (!stream) return;

    const mediaRecorder: MediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    const chunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
    };
    setRecordingState(RecordingState.Recording);
    mediaRecorder.start();
  };

  // Остановка записи
  const stopRecording = (): void => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingState(RecordingState.Stopped);
    } 
  };

  return (
    <div className={styles.video}>
      <h1>Browser API. Audio, Video</h1>
      <div>
        <video
          autoPlay
          className={styles.video_recorder}
          muted
          ref={videoRef}
        ></video>
      </div>
    <div className={styles.video_button_management}>
      {!stream && (
        <button onClick={startCamera}>Запустить камеру</button>
      )}
      
      {stream && recordingState === RecordingState.Idle && (
        <>
          <button
            onClick={startRecording}
            className={styles.video_button_start_recording}
          >
            Начать запись
          </button>
          <button onClick={stopCamera}>Остановить камеру</button>
        </>
      )}
      
      {recordingState === RecordingState.Recording && (
        <button onClick={stopRecording}>Остановить запись</button>
      )}
    </div>
      {error && <p className={styles.error}>{error}</p>}
      {videoURL && (
        <div>
          <h2>Записанное видео:</h2>
          <video
            src={videoURL}
            controls
            className={styles.recorded_video}
          ></video>
          <div className={styles.download_video}>
            <a href={videoURL} download="recorded-video.webm">
              <button>Скачать видео</button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoRecorder;