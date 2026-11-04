import Tesseract from 'tesseract.js';

export interface ExtractedEFootballStats {
  p1Score?: number;
  p2Score?: number;
  winner?: 'p1' | 'p2' | 'draw';

  possession_p1?: number;
  possession_p2?: number;

  shots_p1?: number;
  shots_p2?: number;

  shots_on_target_p1?: number;
  shots_on_target_p2?: number;

  passes_p1?: number;
  passes_p2?: number;

  successful_passes_p1?: number;
  successful_passes_p2?: number;

  saves_p1?: number;
  saves_p2?: number;

  tackles_p1?: number;
  tackles_p2?: number;

  fouls_p1?: number;
  fouls_p2?: number;

  interceptions_p1?: number;
  interceptions_p2?: number;

  rawText: string;
}

/**
 * Preprocesses an image using an HTML5 Canvas to optimize OCR readability:
 * - Grayscale conversion
 * - High contrast stretch
 */
export async function preprocessImage(imageFileOrUrl: File | string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof imageFileOrUrl === 'string' ? imageFileOrUrl : URL.createObjectURL(imageFileOrUrl));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        // Grayscale + Contrast enhance
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          // Luminance formula
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          // Contrast boost
          gray = (gray - 128) * 1.5 + 128;
          gray = Math.max(0, Math.min(255, gray));

          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(img.src);
      }
    };

    img.onerror = () => {
      resolve(typeof imageFileOrUrl === 'string' ? imageFileOrUrl : URL.createObjectURL(imageFileOrUrl));
    };

    if (typeof imageFileOrUrl === 'string') {
      img.src = imageFileOrUrl;
    } else {
      img.src = URL.createObjectURL(imageFileOrUrl);
    }
  });
}

/**
 * Parses raw OCR text lines from eFootball match screenshot
 */
export function parseEFootballText(text: string): ExtractedEFootballStats {
  const result: ExtractedEFootballStats = { rawText: text };
  const lines = text.split('\n').map(l => l.trim().toLowerCase()).filter(Boolean);

  const extractPair = (lineText: string): [number, number] | null => {
    // Looks for numbers on the left and right sides of the row
    const numbers = lineText.match(/\b\d+\b/g);
    if (numbers && numbers.length >= 2) {
      return [parseInt(numbers[0], 10), parseInt(numbers[numbers.length - 1], 10)];
    }
    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Possession
    if (line.includes('possession') || line.includes('%')) {
      const match = line.match(/(\d+)\s*%.*?(\d+)\s*%/);
      if (match) {
        result.possession_p1 = parseInt(match[1], 10);
        result.possession_p2 = parseInt(match[2], 10);
      }
    }

    // 2. Shots on Target (check before general Shots)
    else if (line.includes('target')) {
      const pair = extractPair(line);
      if (pair) {
        result.shots_on_target_p1 = pair[0];
        result.shots_on_target_p2 = pair[1];
      }
    }

    // 3. Shots
    else if (line.includes('shots') || line.includes('shot')) {
      const pair = extractPair(line);
      if (pair) {
        result.shots_p1 = pair[0];
        result.shots_p2 = pair[1];
      }
    }

    // 4. Successful Passes (check before Passes)
    else if (line.includes('successful') || line.includes('completed')) {
      const pair = extractPair(line);
      if (pair) {
        result.successful_passes_p1 = pair[0];
        result.successful_passes_p2 = pair[1];
      }
    }

    // 5. Passes
    else if (line.includes('passes') || line.includes('pass')) {
      const pair = extractPair(line);
      if (pair) {
        result.passes_p1 = pair[0];
        result.passes_p2 = pair[1];
      }
    }

    // 6. Saves
    else if (line.includes('saves') || line.includes('save')) {
      const pair = extractPair(line);
      if (pair) {
        result.saves_p1 = pair[0];
        result.saves_p2 = pair[1];
      }
    }

    // 7. Tackles
    else if (line.includes('tackles') || line.includes('tackle')) {
      const pair = extractPair(line);
      if (pair) {
        result.tackles_p1 = pair[0];
        result.tackles_p2 = pair[1];
      }
    }

    // 8. Fouls
    else if (line.includes('fouls') || line.includes('foul')) {
      const pair = extractPair(line);
      if (pair) {
        result.fouls_p1 = pair[0];
        result.fouls_p2 = pair[1];
      }
    }

    // 9. Interceptions
    else if (line.includes('interceptions') || line.includes('intercept')) {
      const pair = extractPair(line);
      if (pair) {
        result.interceptions_p1 = pair[0];
        result.interceptions_p2 = pair[1];
      }
    }
  }

  // 10. Extract Final Score (Usually right above Full Time / Extra Time, or adjacent to eFootball logo)
  const fullTimeIdx = lines.findIndex(l => {
    return l.includes('full time') || l.includes('extra time') || l.includes('pk');
  });

  if (fullTimeIdx > 0) {
    const lineAbove = lines[fullTimeIdx - 1];
    const match = lineAbove.match(/(?:\[|\b)(\d{1,2})(?:\]|\b)\s*[^0-9\n]{1,12}\s*(?:\[|\b)(\d{1,2})(?:\]|\b)/);
    if (match) {
      const s1 = parseInt(match[1], 10);
      const s2 = parseInt(match[2], 10);
      if (s1 <= 25 && s2 <= 25) {
        result.p1Score = s1;
        result.p2Score = s2;
      }
    }
  }

  // Fallback: search each line for emblem/bracket score patterns (e.g. "Hardcore Punisher [2 © [2] ΣGθIST XI")
  if (result.p1Score === undefined) {
    for (const line of lines) {
      const match = line.match(/(?:\[|\b)(\d{1,2})(?:\]|\b)\s*(?:©|@|®|\(e\)|e|efootball|[\-_:]|\|)\s*(?:\[|\b)(\d{1,2})(?:\]|\b)/i);
      if (match) {
        const s1 = parseInt(match[1], 10);
        const s2 = parseInt(match[2], 10);
        if (s1 <= 25 && s2 <= 25) {
          result.p1Score = s1;
          result.p2Score = s2;
          break;
        }
      }
    }
  }

  // Determine Winner based on scores
  if (result.p1Score !== undefined && result.p2Score !== undefined) {
    if (result.p1Score > result.p2Score) {
      result.winner = 'p1';
    } else if (result.p2Score > result.p1Score) {
      result.winner = 'p2';
    } else {
      result.winner = 'draw';
    }
  }

  return result;
}

/**
 * Main OCR Runner: Takes image file, runs preprocessing and Tesseract recognition
 */
export async function runEFootballOcr(
  imageSource: File | string,
  onProgress?: (progressPercent: number) => void
): Promise<ExtractedEFootballStats> {
  const processedDataUrl = await preprocessImage(imageSource);

  const { data } = await Tesseract.recognize(processedDataUrl, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    }
  });

  return parseEFootballText(data.text);
}
