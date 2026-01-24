import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BrowserMultiFormatReader } from '@zxing/browser';

const videoStyles = {
  width: '100%',
  height: 260,
  backgroundColor: '#06131c',
  borderRadius: 12,
  objectFit: 'cover'
};

export default function BarcodeScanner({ onResult }) {
  const videoRef = useRef(null);
  const [message, setMessage] = useState('Allow camera and place the barcode inside the frame.');

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls;
    let active = true;

    const start = async () => {
      if (!navigator?.mediaDevices) {
        setMessage('Camera access is not supported on this browser.');
        return;
      }

      try {
        if (videoRef.current) {
          videoRef.current.setAttribute('playsinline', true);
          videoRef.current.muted = true;
        }

        controls = await reader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
          if (!active) return;
          if (result) {
            onResult?.(result.getText());
          }
        });
        setMessage('Scanning… keep the barcode steady.');
      } catch (err) {
        const denied = err?.name === 'NotAllowedError';
        setMessage(denied ? 'Camera permission denied. Enable access to scan.' : 'Camera unavailable. Check permissions.');
      }
    };

    start();

    return () => {
      active = false;
      controls?.stop?.();
      if (typeof reader?.reset === 'function') {
        reader.reset();
      }
      const stream = videoRef.current?.srcObject;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onResult]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.frame}>
        <video ref={videoRef} style={videoStyles} />
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>{message}</Text>
        </View>
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>
    </View>
  );
}

const cornerBase = {
  position: 'absolute',
  width: 24,
  height: 24,
  borderColor: '#0db28b',
  borderWidth: 3,
  borderRadius: 6
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%'
  },
  frame: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)'
  },
  overlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(7, 17, 24, 0.6)',
    borderRadius: 10,
    padding: 10
  },
  overlayText: {
    color: '#d6e4ee',
    fontSize: 13
  },
  cornerTopLeft: {
    ...cornerBase,
    top: 10,
    left: 10,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  cornerTopRight: {
    ...cornerBase,
    top: 10,
    right: 10,
    borderLeftWidth: 0,
    borderBottomWidth: 0
  },
  cornerBottomLeft: {
    ...cornerBase,
    bottom: 10,
    left: 10,
    borderRightWidth: 0,
    borderTopWidth: 0
  },
  cornerBottomRight: {
    ...cornerBase,
    bottom: 10,
    right: 10,
    borderLeftWidth: 0,
    borderTopWidth: 0
  }
});
