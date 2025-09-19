import { v5 as uuidv5 } from 'uuid';
import { split as splitSentences } from 'sentence-splitter';

// Namespace UUID para generar IDs determinísticos (puedes usar un valor fijo)
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// Normaliza texto eliminando espacios y pasando a minúsculas.
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

// Genera un UUID determinístico a partir del texto y la fuente.
export function generateDeterministicUuid(text: string, source?: string): string {
  return uuidv5((source ?? '') + '|' + normalizeText(text), NAMESPACE);
}

// Fragmenta el texto en frases normalizadas para procesamiento semántico.
export function fragmentText(text: string, maxLength: number = 500): string[] {
  const normalized = normalizeText(text);
  if (normalized.length <= maxLength) return [normalized];

  const sentences = splitSentences(text)
    .filter((item: any) => item.type === 'Sentence')
    .map((item: any) => item.raw.trim())
    .filter(Boolean);

  const fragments: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    // Permite fragmentos de hasta 700 caracteres si el texto lo requiere
    if ((current + ' ' + sentence).trim().length <= Math.max(maxLength, 700)) {
      current = current ? current + ' ' + sentence : sentence;
    } else {
      if (current) fragments.push(current.trim());
      current = sentence;
    }
  }
  if (current) fragments.push(current.trim());

  return fragments.map(normalizeText);
}

// Convierte cualquier metadata en texto legible, manejando arrays y objetos anidados.
export function metadataToText(metadata: any, indent = 0): string {
  if (!metadata || typeof metadata !== 'object') return '';
  const pad = ' '.repeat(indent);
  return Object.entries(metadata)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length ? `${pad}${key}: ${value.join(', ')}` : '';
      } else if (typeof value === 'object' && value !== null) {
        const nested = metadataToText(value, indent + 2);
        return nested ? `${pad}${key}:\n${nested}` : '';
      }
      return `${pad}${key}: ${value}`;
    })
    .filter(Boolean)
    .join('\n');
}