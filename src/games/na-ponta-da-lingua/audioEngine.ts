/**
 * Motor de áudio cinematográfico — Na Ponta da Língua.
 *
 * Design: minimalismo sonoro. Não arcade, não cartoon.
 * Camadas:
 *   Ambient  — drone de baixa frequência que cresce com a tensão
 *   Timer    — pulso discreto nos últimos segundos
 *   Result   — impacto seco (falha) / micro-release (acerto)
 *   Event    — roubo (impacto pesado)
 *
 * Implementação: WAV sintetizado em runtime → FileSystem cache → expo-av.
 * Sem assets externos. Sem dependências sonoras de terceiros.
 */

import { cacheDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { Audio } from 'expo-av';

import type { IntensidadeVisual } from './types';

const SAMPLE_RATE = 11025; // voice quality — suficiente para sons de baixa freq

// ─── WAV generator ────────────────────────────────────────────────────────────

function criarWavBuffer(
  gerarSample: (i: number, samples: number) => number,
  duracaoMs: number,
): Uint8Array {
  const samples = Math.floor(SAMPLE_RATE * duracaoMs / 1000);
  const dataSize = samples * 2;
  const buf = new Uint8Array(44 + dataSize);
  const view = new DataView(buf.buffer);

  // RIFF header
  buf.set([0x52, 0x49, 0x46, 0x46], 0);           // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  buf.set([0x57, 0x41, 0x56, 0x45], 8);           // "WAVE"
  buf.set([0x66, 0x6D, 0x74, 0x20], 12);          // "fmt "
  view.setUint32(16, 16, true);                    // subchunk size
  view.setUint16(20, 1, true);                     // PCM
  view.setUint16(22, 1, true);                     // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);       // byte rate
  view.setUint16(32, 2, true);                     // block align
  view.setUint16(34, 16, true);                    // bits/sample
  buf.set([0x64, 0x61, 0x74, 0x61], 36);          // "data"
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples; i++) {
    const s = Math.max(-1, Math.min(1, gerarSample(i, samples)));
    view.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }

  return buf;
}

function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
    binary += String.fromCharCode(...Array.from(chunk));
  }
  return btoa(binary);
}

// ─── Definições de som ────────────────────────────────────────────────────────

function gerarDrone(i: number, samples: number): number {
  const t = i / SAMPLE_RATE;
  const dur = samples / SAMPLE_RATE;
  const attackMs = 120 / 1000;
  const releaseMs = 120 / 1000;
  let env = 1;
  if (t < attackMs) env = t / attackMs;
  else if (t > dur - releaseMs) env = (dur - t) / releaseMs;
  // Fundamental 100Hz + 2nd harmonic 200Hz (quieter)
  const wave = 0.7 * Math.sin(2 * Math.PI * 100 * t) + 0.3 * Math.sin(2 * Math.PI * 200 * t);
  return wave * env * 0.055;
}

function gerarTick(i: number, _samples: number): number {
  const t = i / SAMPLE_RATE;
  const env = Math.exp(-t * 60);
  return Math.sin(2 * Math.PI * 650 * t) * env * 0.22;
}

function gerarFalha(i: number, _samples: number): number {
  const t = i / SAMPLE_RATE;
  const env = Math.exp(-t * 8);
  // Low thud + brief noise burst at attack
  const thud = Math.sin(2 * Math.PI * 72 * t) * env;
  const noise = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.18;
  return (thud * 0.38 + noise);
}

function gerarAcerto(i: number, _samples: number): number {
  const t = i / SAMPLE_RATE;
  const env = Math.exp(-t * 14);
  // Perfect fifth: C5 (523Hz) + G5 (784Hz) — soft musical release
  const wave = 0.6 * Math.sin(2 * Math.PI * 523 * t) + 0.4 * Math.sin(2 * Math.PI * 784 * t);
  return wave * env * 0.18;
}

function gerarRoubo(i: number, _samples: number): number {
  const t = i / SAMPLE_RATE;
  const env = Math.exp(-t * 5);
  // Very low dry impact — almost subsonic
  const thud = Math.sin(2 * Math.PI * 48 * t) * env;
  const attack = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.25;
  return thud * 0.5 + attack;
}

// ─── Cache de instâncias ──────────────────────────────────────────────────────

type SomKey = 'drone' | 'tick' | 'falha' | 'acerto' | 'roubo';

const instancias: Partial<Record<SomKey, Audio.Sound>> = {};
let audioInicializado = false;

// ─── API pública ──────────────────────────────────────────────────────────────

export async function inicializarAudio(): Promise<void> {
  if (audioInicializado) return;
  audioInicializado = true;

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: false,
      shouldDuckAndroid: true,
    });

    const sons: Array<{ key: SomKey; fn: (i: number, s: number) => number; ms: number }> = [
      { key: 'drone', fn: gerarDrone, ms: 1500 },
      { key: 'tick',  fn: gerarTick,  ms: 30 },
      { key: 'falha', fn: gerarFalha, ms: 200 },
      { key: 'acerto', fn: gerarAcerto, ms: 95 },
      { key: 'roubo', fn: gerarRoubo, ms: 300 },
    ];

    await Promise.all(sons.map(async ({ key, fn, ms }) => {
      try {
        const bytes = criarWavBuffer(fn, ms);
        const b64 = uint8ToBase64(bytes);
        const uri = `${cacheDirectory ?? ''}npl_${key}.wav`;
        await writeAsStringAsync(uri, b64, {
          encoding: EncodingType.Base64,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false, volume: 0.5 },
        );
        instancias[key] = sound;
      } catch {
        // Som individual falhou — continua sem ele
      }
    }));
  } catch {
    // Áudio indisponível — haptics são o fallback
  }
}

export async function liberarAudio(): Promise<void> {
  try {
    for (const sound of Object.values(instancias)) {
      await sound?.stopAsync();
      await sound?.unloadAsync();
    }
    Object.keys(instancias).forEach((k) => {
      delete instancias[k as SomKey];
    });
    audioInicializado = false;
  } catch {
    // silencia erros de cleanup
  }
}

export async function iniciarDrone(): Promise<void> {
  const drone = instancias.drone;
  if (!drone) return;
  try {
    await drone.setVolumeAsync(0);
    await drone.setIsLoopingAsync(true);
    await drone.playAsync();
  } catch {
    // silencia
  }
}

export async function pararDrone(): Promise<void> {
  try {
    await instancias.drone?.stopAsync();
  } catch {
    // silencia
  }
}

const VOLUMES_DRONE: Record<IntensidadeVisual, number> = {
  calmo:   0,
  pressao: 0.08,
  panico:  0.2,
  colapso: 0.38,
};

export async function setIntensidadeDrone(intensidade: IntensidadeVisual): Promise<void> {
  try {
    await instancias.drone?.setVolumeAsync(VOLUMES_DRONE[intensidade]);
  } catch {
    // silencia
  }
}

async function tocar(key: SomKey, volume?: number): Promise<void> {
  const som = instancias[key];
  if (!som) return;
  try {
    await som.setVolumeAsync(volume ?? 0.5);
    await som.setPositionAsync(0);
    await som.playAsync();
  } catch {
    // silencia — haptic já aconteceu como fallback
  }
}

export const tocarTick  = () => tocar('tick', 0.3);
export const tocarFalha = () => tocar('falha', 0.45);
export const tocarAcerto = () => tocar('acerto', 0.35);
export const tocarRoubo  = () => tocar('roubo', 0.65);
