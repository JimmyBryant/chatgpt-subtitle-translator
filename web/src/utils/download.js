export function downloadString(text, fileType, fileName, maxLineLength) {
  const outputText = processSrt(text,maxLineLength);
  console.log('处理完字幕',outputText)
  console.log('原始字幕',text)
  var blob = new Blob([outputText], { type: fileType });

  var a = document.createElement('a');
  a.download = fileName;
  a.href = URL.createObjectURL(blob);
  a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
}
/**
 * 处理 SRT 字幕内容，长字幕分割并根据行长度分配时间
 * @param {string} inputText SRT 字幕文本
 * @param {number} maxLineLength 每条字幕的最大字符数（英文）
 * @param {number} chineseRatio 中文字幕行长度相对于 maxLineLength 的比例（默认 0.5）
 * @returns {string} 处理后的 SRT 字幕文本
 */
function processSrt(inputText, maxLineLength = 42, chineseRatio = 0.5) {
  const lines = inputText.split('\n');
  let result = [];
  let currentSubtitle = { index: 0, startTime: '', endTime: '', text: '' };
  let isTimeLine = false;
  let subtitleIndex = 0; // 新的字幕索引

  lines.forEach(line => {
    if (/^\d+$/.test(line.trim())) {
      // 如果当前有字幕，处理它
      if (currentSubtitle.index !== 0) {
        const splittedSubtitles = splitSubtitle(currentSubtitle.text.trim(), maxLineLength, chineseRatio);
        result.push(formatSubtitles(currentSubtitle, splittedSubtitles, subtitleIndex));
        subtitleIndex += splittedSubtitles.length;
      }
      // 开始处理新的字幕
      currentSubtitle = { index: parseInt(line), startTime: '', endTime: '', text: '' };
      isTimeLine = true;
    } else if (isTimeLine && line.includes('-->')) {
      // 时间行
      const [startTime, endTime] = line.split(' --> ');
      currentSubtitle.startTime = startTime;
      currentSubtitle.endTime = endTime;
      isTimeLine = false;
    } else if (line.trim()) {
      // 字幕内容行
      currentSubtitle.text += line + ' ';
    }
  });

  // 处理最后一条字幕
  if (currentSubtitle.index !== 0) {
    const splittedSubtitles = splitSubtitle(currentSubtitle.text.trim(), maxLineLength, chineseRatio);
    result.push(formatSubtitles(currentSubtitle, splittedSubtitles, subtitleIndex));
  }

  return result.join('\n'); // 返回字符串
}

/**
 * 分割字幕文本，优先按标点符号切割，没有标点符号时根据字符长度切割（不拆分单词）
 * @param {string} text 字幕文本
 * @param {number} maxLineLength 每行的最大英文字符数
 * @param {number} chineseRatio 中文字符长度比例
 * @returns {string[]} 分割后的字幕行数组
 */
function splitSubtitle(text, maxLineLength, chineseRatio) {
  let lines = [];
  let currentLine = '';

  // 判断当前是中文还是英文字幕
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  const maxLineLengthForText = isChinese ? Math.floor(maxLineLength * chineseRatio) : maxLineLength;

  // 优先按标点符号切割
  const punctuation = isChinese ? /[，。！？；]/ : /[.,!?;]/;
  const segments = text.split(punctuation);

  segments.forEach((segment, index) => {
    const punctuationMatch = text.match(punctuation);

    // 如果当前分段长度不超过最大行长度，直接加入
    if ((currentLine + segment).length <= maxLineLengthForText) {
      currentLine += segment + (punctuationMatch && punctuationMatch[index] ? punctuationMatch[index] : '');
    } else {
      // 如果当前分段超长，处理为多行
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = '';
      }

      // 根据长度分割，不拆分单词
      let subSegment = segment;
      while (subSegment.length > maxLineLengthForText) {
        // 找到适合的分割点（不拆分单词）
        const slicePoint = findWordBoundary(subSegment, maxLineLengthForText);
        lines.push(subSegment.slice(0, slicePoint).trim());
        subSegment = subSegment.slice(slicePoint).trim();
      }
      currentLine = subSegment;
    }
  });

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines;
}

/**
 * 找到适合的分割点，确保不拆分单词
 * @param {string} text 文本
 * @param {number} maxLength 最大字符长度
 * @returns {number} 返回适合的分割点
 */
function findWordBoundary(text, maxLength) {
  // 如果文本长度已经小于最大长度，直接返回文本长度
  if (text.length <= maxLength) {
    return text.length;
  }

  // 尝试在 maxLength 附近找到单词边界（空格）
  let slicePoint = text.lastIndexOf(' ', maxLength);
  
  // 如果没有找到合适的空格，默认返回 maxLength
  if (slicePoint === -1) {
    return maxLength;
  }
  
  return slicePoint;
}


/**
 * 计算时间戳，将时间字符串转换为秒数
 * @param {string} timeStr 时间字符串，格式为 "HH:MM:SS,SSS"
 * @returns {number} 秒数
 */
function timeToSeconds(timeStr) {
  const [timePart, msPart] = timeStr.split(',');
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds + parseInt(msPart, 10) / 1000;
}

/**
 * 将秒数转换为时间字符串，格式为 "HH:MM:SS,SSS"
 * @param {number} seconds 秒数
 * @returns {string} 时间字符串
 */
function secondsToTime(seconds) {
  const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, '0');
  return `${hours}:${minutes}:${secs},${ms}`;
}

/**
 * 格式化字幕为 SRT 格式并重新分配时间
 * @param {Object} subtitle 当前字幕对象，包含 index、startTime、endTime 和 text
 * @param {string[]} splittedSubtitles 分割后的字幕行数组
 * @param {number} startIndex 新字幕的起始索引
 * @returns {string} 格式化后的 SRT 字幕文本
 */
function formatSubtitles(subtitle, splittedSubtitles, startIndex) {
  const result = [];
  const startTimeInSeconds = timeToSeconds(subtitle.startTime);
  const endTimeInSeconds = timeToSeconds(subtitle.endTime);
  const totalDuration = endTimeInSeconds - startTimeInSeconds;
  const linesCount = splittedSubtitles.length;

  splittedSubtitles.forEach((line, index) => {
    const lineDuration = totalDuration / linesCount;
    const lineStartTime = startTimeInSeconds + index * lineDuration;
    const lineEndTime = lineStartTime + lineDuration;

    result.push(`${startIndex + index + 1}`);
    result.push(`${secondsToTime(lineStartTime)} --> ${secondsToTime(lineEndTime)}`);
    result.push(line);
    result.push(''); // 每条字幕后面强制添加一个空行
  });

  return result.join('\n');
}


